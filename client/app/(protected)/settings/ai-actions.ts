"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AGENT_PROMPTS, type AgentId } from "@/lib/agent-prompts";

const getConfigId = async () => {
  const config = await prisma.appConfig.findFirst();
  return config?.id ?? "app";
};

export async function updateAiProvider(formData: FormData) {
  const provider = (formData.get("provider") as string | null) ?? "ollama";
  const baseUrl = (formData.get("baseUrl") as string | null) ?? "";
  const apiKey = (formData.get("apiKey") as string | null) ?? "";
  const model = (formData.get("model") as string | null)?.trim();
  const visionModel = (formData.get("visionModel") as string | null)?.trim();
  const id = await getConfigId();

  await prisma.appConfig.upsert({
    where: { id },
    create: {
      id,
      setupComplete: true,
      llmProvider: provider,
      llmBaseUrl: baseUrl || "http://localhost:11434",
      llmApiKey: apiKey || null,
      llmModel: model || null,
      llmVisionModel: visionModel || null,
    },
    update: {
      llmProvider: provider,
      llmBaseUrl: baseUrl || "http://localhost:11434",
      llmApiKey: apiKey || null,
      llmModel: model || null,
      llmVisionModel: visionModel || null,
    },
  });

  revalidatePath("/settings");
}

export async function updateAgentConfig(agentId: AgentId, formData: FormData) {
  const model = (formData.get("model") as string | null)?.trim();
  const visionModel = (formData.get("visionModel") as string | null)?.trim();
  const userPrompt = (formData.get("userPrompt") as string | null) ?? "";
  const providerOverride = (formData.get("providerOverride") as string | null)?.trim();
  const modelOverride = (formData.get("modelOverride") as string | null)?.trim();
  const visionModelOverride = (formData.get("visionModelOverride") as string | null)?.trim();
  const overrideEnabled = formData.get("overrideEnabled") === "on";
  const enabled = formData.get("enabled") === "on";

  const fallback = AGENT_PROMPTS.find((agent) => agent.agentId === agentId);
  const modelToUse = model || fallback?.defaultModel || "llama3.1";
  const visionModelToUse = visionModel || fallback?.defaultVisionModel || modelToUse;
  const promptToUse = fallback?.defaultPrompt || "";
  const existing = await prisma.agentConfig.findUnique({ where: { agentId } });
  const systemPromptToUse = existing?.systemPrompt || promptToUse;
  const userPromptToUse = userPrompt.trim();

  await prisma.agentConfig.upsert({
    where: { agentId },
    create: {
      agentId,
      model: modelToUse,
      visionModel: visionModelToUse,
      prompt: systemPromptToUse,
      systemPrompt: systemPromptToUse,
      userPrompt: userPromptToUse,
      providerOverride: providerOverride || null,
      modelOverride: modelOverride || null,
      visionModelOverride: visionModelOverride || null,
      overrideEnabled,
      enabled,
    },
    update: {
      model: modelToUse,
      visionModel: visionModelToUse,
      prompt: systemPromptToUse,
      systemPrompt: systemPromptToUse,
      userPrompt: userPromptToUse,
      providerOverride: providerOverride || null,
      modelOverride: modelOverride || null,
      visionModelOverride: visionModelOverride || null,
      overrideEnabled,
      enabled,
    },
  });

  revalidatePath("/settings");
}
