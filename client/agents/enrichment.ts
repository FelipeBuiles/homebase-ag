import { setupWorker } from "../lib/queue";
import prisma from "../lib/prisma";
import { Job } from "bullmq";
import { generateText } from "ai";
import { getAgentConfig, runAgentPrompt } from "../lib/ai";
import { getProviderClient, resolveEffectiveConfig, resolveProviderConfig, type ProviderKind } from "../lib/llm-providers";
import { DEFAULT_INVENTORY_CATEGORIES, normalizeTagName, toTitleCase } from "../lib/inventory";
import { deriveNameSuggestion } from "../lib/enrichment";
import { resolvePublicUploadPath } from "../lib/uploads";
import sharp from "sharp";
import { promises as fs } from "node:fs";

type VisionAnalysis = {
    labels: string[];
    ocr: string[];
    summary?: string;
    model?: string;
};

type VisionResult = {
    analysis: VisionAnalysis | null;
    raw: string;
    error?: string;
};

const extractJson = (input: string) => {
    const start = input.indexOf("{");
    const end = input.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    const slice = input.slice(start, end + 1);
    try {
        return JSON.parse(slice) as unknown;
    } catch {
        return null;
    }
};

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((entry) => typeof entry === "string");

const buildVisionPrompt = () =>
    `You analyze a household item photo.
Return JSON only: {"labels": string[], "ocr": string[], "summary": string}.
Rules:
- labels: 3-8 concise object/category labels.
- ocr: capture any visible text like model numbers, serials, or brands.
- summary: one short sentence describing the item.`;

const analyzeAttachment = async (
    imagePath: string,
    model: string,
    providerConfig: { provider: ProviderKind; baseUrl?: string; apiKey?: string }
): Promise<VisionResult> => {
    const buffer = await fs.readFile(imagePath);
    const resized = await sharp(buffer)
        .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 70 })
        .toBuffer();
    const providerClient = getProviderClient({
        provider: providerConfig.provider,
        baseUrl: providerConfig.baseUrl,
        apiKey: providerConfig.apiKey,
    });
    let raw = "";
    try {
        const response = await generateText({
            model: providerClient(model),
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: buildVisionPrompt() },
                        { type: "image", image: resized, mediaType: "image/jpeg" },
                    ],
                },
            ],
        });
        raw = response.text ?? "";
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { analysis: null, raw: message, error: "request_failed" };
    }
    const parsed = extractJson(raw);
    if (!parsed || typeof parsed !== "object") {
        return { analysis: null, raw, error: "invalid_json" };
    }
    const labels = (parsed as { labels?: unknown }).labels;
    const ocr = (parsed as { ocr?: unknown }).ocr;
    const summary = typeof (parsed as { summary?: unknown }).summary === "string"
        ? (parsed as { summary: string }).summary
        : undefined;
    if (!isStringArray(labels) || !isStringArray(ocr)) {
        return { analysis: null, raw, error: "invalid_schema" };
    }
    return {
        analysis: {
            labels,
            ocr,
            summary,
            model,
        } satisfies VisionAnalysis,
        raw,
    };
};

console.log("Starting Enrichment Agent...");

setupWorker("inventory", async (job: Job) => {
    console.log("Processing job:", job.id, job.name, job.data);

    if (job.name === "created" || job.name === "enrich") {
        const { itemId } = job.data;
        const item = await prisma.inventoryItem.findUnique({
            where: { id: itemId },
            include: { rooms: true, tags: true, attachments: { orderBy: { order: "asc" } } },
        });
        if (!item) return;
        const name = item.name;
        const description = item.description;

        await prisma.inventoryItem.update({
            where: { id: itemId },
            data: {
                enrichmentStatus: "running",
                enrichmentError: null,
                enrichmentUpdatedAt: new Date(),
            },
        });

        let visualSummary = "None";
        let visualAnalysis: VisionAnalysis | null = null;
        let visualRaw: string | null = null;

        const primaryPhoto = item.attachments.find((attachment) => attachment.kind === "photo");
        if (primaryPhoto?.url?.startsWith("/uploads/")) {
            try {
                const config = await getAgentConfig("agent_enrichment");
                const appConfig = await prisma.appConfig.findFirst();
                const effectiveConfig = resolveEffectiveConfig({
                    global: {
                        provider: appConfig?.llmProvider,
                        model: appConfig?.llmModel,
                        visionModel: appConfig?.llmVisionModel,
                    },
                    agent: config
                        ? {
                            overrideEnabled: config.overrideEnabled,
                            providerOverride: config.providerOverride,
                            modelOverride: config.modelOverride,
                            visionModelOverride: config.visionModelOverride,
                        }
                        : null,
                    agentDefaults: {
                        model: config?.model,
                        visionModel: config?.visionModel,
                    },
                });
                const modelName = effectiveConfig.visionModel
                    ?? config?.visionModel
                    ?? config?.model
                    ?? "qwen3-vl:8b";
                const providerConfig = resolveProviderConfig({
                    globalProvider: effectiveConfig.provider,
                    baseUrl: appConfig?.llmBaseUrl,
                    apiKey: appConfig?.llmApiKey,
                    agentProviderOverride: null,
                });
                const absolutePath = resolvePublicUploadPath(primaryPhoto.url);
                if (!absolutePath) {
                    throw new Error(`Invalid upload path: ${primaryPhoto.url}`);
                }
                const visionStart = Date.now();
                const { analysis, raw, error } = await analyzeAttachment(absolutePath, modelName, providerConfig);
                visualAnalysis = analysis;
                visualRaw = raw;
                if (analysis) {
                    await prisma.inventoryAttachment.update({
                        where: { id: primaryPhoto.id },
                        data: {
                            metadata: {
                                labels: analysis.labels,
                                ocr: analysis.ocr,
                                summary: analysis.summary,
                                model: analysis.model,
                                createdAt: new Date().toISOString(),
                            },
                        },
                    });
                    visualSummary = [
                        analysis.summary ? `Summary: ${analysis.summary}` : null,
                        analysis.labels.length > 0 ? `Labels: ${analysis.labels.join(", ")}` : null,
                        analysis.ocr.length > 0 ? `OCR: ${analysis.ocr.join(", ")}` : null,
                    ]
                        .filter(Boolean)
                        .join("\n");
                }
                const durationMs = Date.now() - visionStart;
                await prisma.auditLog.create({
                    data: {
                        action: analysis ? "agent.vision.run" : "agent.vision.failed",
                        details: {
                            agentId: "agent_enrichment",
                            model: modelName,
                            summary: analysis
                                ? `Vision analysis succeeded for ${name}`
                                : `Vision analysis failed for ${name}`,
                            success: Boolean(analysis),
                            error: error ?? null,
                            responseRaw: raw,
                            durationMs,
                            labels: analysis?.labels ?? [],
                            ocr: analysis?.ocr ?? [],
                        },
                    },
                });
            } catch (error) {
                console.warn("Vision analysis failed", error);
                const message = error instanceof Error ? error.message : "Unknown error";
                await prisma.auditLog.create({
                    data: {
                        action: "agent.vision.failed",
                        details: {
                            agentId: "agent_enrichment",
                            model: "unknown",
                            summary: `Vision analysis failed for ${name}`,
                            success: false,
                            error: message,
                            responseRaw: visualRaw ?? null,
                        },
                    },
                });
            }
        }

        const rooms = await prisma.room.findMany({ orderBy: { name: "asc" } });
        const allowedRoomNames = rooms.map((room) => room.name);
        const existingRoomNames = item.rooms.map((room) => room.name);
        const existingTagNames = item.tags.map((tag) => tag.name);

        try {
            const { data, raw } = await runAgentPrompt(
                "agent_enrichment",
                `ITEM:\nName: ${name}\nDescription: ${description ?? ""}\n\nEXISTING:\nCategories: ${item.categories.join(", ")}\nRooms: ${existingRoomNames.join(", ")}\nTags: ${existingTagNames.join(", ")}\n\nALLOWED CATEGORIES:\n${DEFAULT_INVENTORY_CATEGORIES.join(", ")}\n\nALLOWED ROOMS:\n${allowedRoomNames.join(", ")}\n\nVISUAL:\n${visualSummary}`
            );

        const confidenceByField = data?.confidenceByField ?? {};
        const rationaleByField = data?.rationaleByField ?? {};
        const getConfidence = (key: string, fallback = 0.5) => {
            const value = confidenceByField[key];
            return typeof value === "number" ? value : fallback;
        };
        const getRationale = (key: string, fallback: string) => {
            const value = rationaleByField[key];
            return typeof value === "string" ? value : fallback;
        };

        const categories = (data?.categories ?? [])
            .map((category: string) => toTitleCase(category))
            .filter((category: string) => DEFAULT_INVENTORY_CATEGORIES.includes(category));
        const roomsFromAgent = (data?.rooms ?? [])
            .map((room: string) => toTitleCase(room))
            .filter((room: string) => allowedRoomNames.includes(room));
        const tagsFromAgent = (data?.tags ?? [])
            .map((tag: string) => normalizeTagName(tag))
            .filter((tag: string | null) => Boolean(tag)) as string[];
        const visualTokens = (visualAnalysis?.labels ?? [])
            .concat(visualAnalysis?.ocr ?? [])
            .map((token) => token.toLowerCase());
        const hasToken = (tokens: string[]) => tokens.some((token) => visualTokens.some((entry) => entry.includes(token)));
        const inferredCategories = new Set<string>();
        if (hasToken(["camera", "dslr", "mirrorless", "lens", "photography"])) {
            inferredCategories.add("Electronics");
        }
        if (hasToken(["laptop", "computer", "monitor", "printer"])) {
            inferredCategories.add("Electronics");
        }
        if (hasToken(["tool", "drill", "saw", "hammer", "wrench"])) {
            inferredCategories.add("Tools");
        }
        if (hasToken(["sofa", "chair", "table", "desk", "bed"])) {
            inferredCategories.add("Furniture");
        }
        if (hasToken(["vacuum", "blender", "microwave", "toaster"])) {
            inferredCategories.add("Appliances");
        }
        const inferredCategoryList = Array.from(inferredCategories);
        const categoryCandidates = categories.length > 0 ? categories : inferredCategoryList;

        const categoryConfidence = getConfidence("categories", 0.6);
        const roomsConfidence = getConfidence("rooms", 0.6);
        const tagsConfidence = getConfidence("tags", 0.6);
        const nameConfidence = getConfidence("name", 0.6);
        const brandConfidence = getConfidence("brand", 0.6);
        const modelConfidence = getConfidence("model", 0.6);
        const conditionConfidence = getConfidence("condition", 0.6);
        const serialConfidence = getConfidence("serial", 0.6);
        const needsCategory = item.categories.length === 0;
        const needsRooms = existingRoomNames.length === 0;
        const needsTags = existingTagNames.length === 0;

        const categoryProposalAllowed =
            categoryCandidates.length > 0 && (needsCategory || categoryConfidence >= 0.75);
        const roomProposalAllowed = roomsFromAgent.length > 0 && (needsRooms || roomsConfidence >= 0.75);
        const tagProposalAllowed = tagsFromAgent.length > 0 && (needsTags || tagsConfidence >= 0.75);

        const isGenericName = (value: string) =>
            ["new item", "item", "unknown item"].includes(value.trim().toLowerCase());
        const proposedName = typeof data?.name === "string" ? data.name.trim() : "";
        const proposedBrand = typeof data?.brand === "string" ? data.brand.trim() : "";
        const proposedModel = typeof data?.model === "string" ? data.model.trim() : "";
        const proposedCondition = typeof data?.condition === "string" ? data.condition.trim() : "";
        const proposedSerial = typeof data?.serial === "string" ? data.serial.trim() : "";

        const hasVisualContext = Boolean(visualAnalysis?.labels?.length || visualAnalysis?.ocr?.length);
        const nameThreshold = hasVisualContext ? 0.6 : 0.75;
        const { name: proposedNameToApply, usedFallback } = deriveNameSuggestion({
            proposedName,
            proposedBrand,
            proposedModel,
            itemBrand: item.brand,
            itemModel: item.model,
            tags: tagsFromAgent,
        });
        const nameConfidenceOverride = usedFallback ? 0.7 : nameConfidence;
        const nameProposalAllowed = proposedNameToApply
            && !isGenericName(proposedNameToApply)
            && (isGenericName(item.name) || hasVisualContext || nameConfidenceOverride >= nameThreshold)
            && proposedNameToApply !== item.name;
        const brandProposalAllowed = proposedBrand
            && (!item.brand || brandConfidence >= 0.75)
            && proposedBrand !== item.brand;
        const modelProposalAllowed = proposedModel
            && (!item.model || modelConfidence >= 0.75)
            && proposedModel !== item.model;
        const conditionProposalAllowed = proposedCondition
            && (!item.condition || conditionConfidence >= 0.75)
            && proposedCondition !== item.condition;
        const serialProposalAllowed = proposedSerial
            && (!item.serialNumber || serialConfidence >= 0.75)
            && proposedSerial !== item.serialNumber;

        if (
            !categoryProposalAllowed &&
            !roomProposalAllowed &&
            !tagProposalAllowed &&
            !nameProposalAllowed &&
            !brandProposalAllowed &&
            !modelProposalAllowed &&
            !conditionProposalAllowed &&
            !serialProposalAllowed
        ) {
            console.log("No enrichment suggestions met thresholds.");
            await prisma.inventoryItem.update({
                where: { id: itemId },
                data: {
                    enrichmentStatus: "success",
                    enrichmentUpdatedAt: new Date(),
                },
            });
            return;
        }

        await prisma.proposal.create({
            data: {
                agentId: "agent_enrichment",
                summary: `Enrichment suggestions for '${name}'`,
                changes: {
                    create: [
                        ...(categoryProposalAllowed ? [{
                            entityType: "InventoryItem",
                            entityId: itemId,
                            confidence: categoryConfidence,
                            rationale: getRationale(
                                "categories",
                                categories.length > 0
                                    ? "AI category suggestion."
                                    : "Category inferred from visual labels."
                            ),
                            diff: [{ op: "replace", path: "/categories", value: categoryCandidates }],
                            before: { categories: item.categories },
                            after: { categories: categoryCandidates },
                            metadata: { rawResponse: raw, visual: visualAnalysis, visualRaw },
                        }] : []),
                        ...(roomProposalAllowed ? [{
                            entityType: "InventoryItem",
                            entityId: itemId,
                            confidence: roomsConfidence,
                            rationale: getRationale("rooms", "AI room suggestion."),
                            diff: [{ op: "replace", path: "/rooms", value: roomsFromAgent }],
                            before: { rooms: existingRoomNames },
                            after: { rooms: roomsFromAgent },
                            metadata: { rawResponse: raw, visual: visualAnalysis, visualRaw },
                        }] : []),
                        ...(tagProposalAllowed ? [{
                            entityType: "InventoryItem",
                            entityId: itemId,
                            confidence: tagsConfidence,
                            rationale: getRationale("tags", "AI tag suggestion."),
                            diff: [{ op: "replace", path: "/tags", value: tagsFromAgent }],
                            before: { tags: existingTagNames },
                            after: { tags: tagsFromAgent },
                            metadata: { rawResponse: raw, visual: visualAnalysis, visualRaw },
                        }] : []),
                        ...(nameProposalAllowed ? [{
                            entityType: "InventoryItem",
                            entityId: itemId,
                            confidence: nameConfidenceOverride,
                            rationale: getRationale(
                                "name",
                                usedFallback
                                    ? "Derived name from brand/model or tags."
                                    : "AI name suggestion."
                            ),
                            diff: [{ op: "replace", path: "/name", value: proposedNameToApply }],
                            before: { name: item.name },
                            after: { name: proposedNameToApply },
                            metadata: { rawResponse: raw, visual: visualAnalysis, visualRaw },
                        }] : []),
                        ...(brandProposalAllowed ? [{
                            entityType: "InventoryItem",
                            entityId: itemId,
                            confidence: brandConfidence,
                            rationale: getRationale("brand", "AI brand suggestion."),
                            diff: [{ op: "replace", path: "/brand", value: proposedBrand }],
                            before: { brand: item.brand },
                            after: { brand: proposedBrand },
                            metadata: { rawResponse: raw, visual: visualAnalysis, visualRaw },
                        }] : []),
                        ...(modelProposalAllowed ? [{
                            entityType: "InventoryItem",
                            entityId: itemId,
                            confidence: modelConfidence,
                            rationale: getRationale("model", "AI model suggestion."),
                            diff: [{ op: "replace", path: "/model", value: proposedModel }],
                            before: { model: item.model },
                            after: { model: proposedModel },
                            metadata: { rawResponse: raw, visual: visualAnalysis, visualRaw },
                        }] : []),
                        ...(conditionProposalAllowed ? [{
                            entityType: "InventoryItem",
                            entityId: itemId,
                            confidence: conditionConfidence,
                            rationale: getRationale("condition", "AI condition suggestion."),
                            diff: [{ op: "replace", path: "/condition", value: proposedCondition }],
                            before: { condition: item.condition },
                            after: { condition: proposedCondition },
                            metadata: { rawResponse: raw, visual: visualAnalysis, visualRaw },
                        }] : []),
                        ...(serialProposalAllowed ? [{
                            entityType: "InventoryItem",
                            entityId: itemId,
                            confidence: serialConfidence,
                            rationale: getRationale("serial", "AI serial suggestion."),
                            diff: [{ op: "replace", path: "/serialNumber", value: proposedSerial }],
                            before: { serialNumber: item.serialNumber },
                            after: { serialNumber: proposedSerial },
                            metadata: { rawResponse: raw, visual: visualAnalysis, visualRaw },
                        }] : []),
                    ],
                }
            }
        });
        await prisma.inventoryItem.update({
            where: { id: itemId },
            data: {
                enrichmentStatus: "success",
                enrichmentUpdatedAt: new Date(),
            },
        });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            await prisma.inventoryItem.update({
                where: { id: itemId },
                data: {
                    enrichmentStatus: "failed",
                    enrichmentError: message,
                    enrichmentUpdatedAt: new Date(),
                },
            });
            throw error;
        }
    }
});
