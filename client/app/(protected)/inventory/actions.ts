'use server';

import prisma from "@/lib/prisma";
import { inventoryQueue } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEFAULT_INVENTORY_CATEGORIES, normalizeCategories, normalizeRoomName, normalizeTagName } from "@/lib/inventory";
import { getAttachmentKind } from "@/lib/attachments";
import { resolvePublicUploadPath } from "@/lib/uploads";
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

const ensureUploadDir = async () => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "inventory");
    await fs.mkdir(uploadDir, { recursive: true });
    return uploadDir;
};

const saveInventoryAttachments = async (itemId: string, files: File[]) => {
    const validFiles = files.filter((file) => file && file.size > 0 && file.size <= MAX_ATTACHMENT_BYTES);
    if (validFiles.length === 0) return;

    const uploadDir = await ensureUploadDir();
    const lastAttachment = await prisma.inventoryAttachment.findFirst({
        where: { itemId },
        orderBy: { order: "desc" },
    });
    let order = lastAttachment ? lastAttachment.order + 1 : 1;

    const attachments = [];
    for (const file of validFiles) {
        const kind = getAttachmentKind(file.type);
        if (!kind) continue;
        const ext = path.extname(file.name || "").toLowerCase() || (kind === "photo" ? ".jpg" : ".mp4");
        const filename = `${itemId}-${Date.now()}-${crypto.randomUUID()}${ext}`;
        const filePath = path.join(uploadDir, filename);
        const buffer = Buffer.from(await file.arrayBuffer());
        if (kind === "photo") {
            const optimizedName = `${itemId}-${Date.now()}-${crypto.randomUUID()}.webp`;
            const optimizedPath = path.join(uploadDir, optimizedName);
            await sharp(buffer)
                .rotate()
                .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(optimizedPath);
            attachments.push({
                itemId,
                kind,
                url: `/uploads/inventory/${optimizedName}`,
                order: order++,
            });
        } else {
            await fs.writeFile(filePath, buffer);
            attachments.push({
                itemId,
                kind,
                url: `/uploads/inventory/${filename}`,
                order: order++,
            });
        }
    }

    if (attachments.length > 0) {
        await prisma.inventoryAttachment.createMany({ data: attachments });
    }
};

export async function createInventoryItem(formData: FormData) {
    const mode = formData.get("mode");
    const wantsPhotoOnly = mode === "photo-only";
    const nameInput = (formData.get("name") as string | null) ?? "";
    const name = nameInput.trim();
    const description = (formData.get("description") as string | null) ?? "";
    const brandInput = (formData.get("brand") as string | null) ?? "";
    const modelInput = (formData.get("model") as string | null) ?? "";
    const conditionInput = (formData.get("condition") as string | null) ?? "";
    const serialInput = (formData.get("serialNumber") as string | null) ?? "";
    const categories = normalizeCategories(formData.getAll("categories"))
        .filter((category) => DEFAULT_INVENTORY_CATEGORIES.includes(category));
    const roomIds = formData.getAll("rooms").map((value) => value.toString());
    const tagIds = formData.getAll("tags").map((value) => value.toString());
    const newRoom = normalizeRoomName(formData.get("newRoom"));
    const newTag = normalizeTagName(formData.get("newTag"));
    const attachments = formData.getAll("attachments") as File[];

    const hasAttachments = attachments.some((file) => file && file.size > 0);
    const resolvedName = name || (wantsPhotoOnly && hasAttachments ? "New item" : "");

    if (!resolvedName || (wantsPhotoOnly && !hasAttachments)) return;

    const createdRoom = newRoom
        ? await prisma.room.upsert({
            where: { name: newRoom },
            create: { name: newRoom },
            update: {},
        })
        : null;
    const createdTag = newTag
        ? await prisma.tag.upsert({
            where: { name: newTag },
            create: { name: newTag },
            update: {},
        })
        : null;

    const item = await prisma.inventoryItem.create({
        data: {
            name: resolvedName,
            description: description.trim() ? description : null,
            brand: brandInput.trim() ? brandInput.trim() : null,
            model: modelInput.trim() ? modelInput.trim() : null,
            condition: conditionInput.trim() ? conditionInput.trim() : null,
            serialNumber: serialInput.trim() ? serialInput.trim() : null,
            categories,
            enrichmentStatus: hasAttachments ? "pending" : "idle",
            rooms: {
                connect: [...roomIds, createdRoom?.id].filter(Boolean).map((id) => ({ id: id as string })),
            },
            tags: {
                connect: [...tagIds, createdTag?.id].filter(Boolean).map((id) => ({ id: id as string })),
            },
        },
    });

    await saveInventoryAttachments(item.id, attachments);

    // Trigger Agent
    await inventoryQueue.add("created", {
        itemId: item.id,
        name: item.name,
        description: item.description,
    });

    revalidatePath("/inventory");
    if (wantsPhotoOnly || !name) {
        redirect(`/inventory/${item.id}?quick=1`);
    }
    redirect("/inventory");
}

export async function quickAddInventoryItem(formData: FormData) {
    const name = formData.get("name") as string;
    const attachments = formData.getAll("attachments") as File[];
    if (!name) return;

    const hasAttachments = attachments.some((file) => file && file.size > 0);
    const item = await prisma.inventoryItem.create({
        data: {
            name,
            description: null,
            categories: [],
            enrichmentStatus: hasAttachments ? "pending" : "idle",
        },
    });

    await saveInventoryAttachments(item.id, attachments);

    await inventoryQueue.add("created", {
        itemId: item.id,
        name: item.name,
        description: item.description,
    });

    revalidatePath("/inventory");
    redirect(`/inventory/${item.id}?quick=1`);
}

export async function updateInventoryItem(itemId: string, formData: FormData) {
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string | null) ?? "";
    const brandInput = (formData.get("brand") as string | null) ?? "";
    const modelInput = (formData.get("model") as string | null) ?? "";
    const conditionInput = (formData.get("condition") as string | null) ?? "";
    const serialInput = (formData.get("serialNumber") as string | null) ?? "";
    const categories = normalizeCategories(formData.getAll("categories"))
        .filter((category) => DEFAULT_INVENTORY_CATEGORIES.includes(category));
    const roomIds = formData.getAll("rooms").map((value) => value.toString());
    const tagIds = formData.getAll("tags").map((value) => value.toString());
    const newRoom = normalizeRoomName(formData.get("newRoom"));
    const newTag = normalizeTagName(formData.get("newTag"));
    const attachments = formData.getAll("attachments") as File[];

    if (!name) return;

    const createdRoom = newRoom
        ? await prisma.room.upsert({
            where: { name: newRoom },
            create: { name: newRoom },
            update: {},
        })
        : null;
    const createdTag = newTag
        ? await prisma.tag.upsert({
            where: { name: newTag },
            create: { name: newTag },
            update: {},
        })
        : null;

    await prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
            name,
            description: description.trim() ? description : null,
            brand: brandInput.trim() ? brandInput.trim() : null,
            model: modelInput.trim() ? modelInput.trim() : null,
            condition: conditionInput.trim() ? conditionInput.trim() : null,
            serialNumber: serialInput.trim() ? serialInput.trim() : null,
            categories,
            rooms: {
                set: [...roomIds, createdRoom?.id].filter(Boolean).map((id) => ({ id: id as string })),
            },
            tags: {
                set: [...tagIds, createdTag?.id].filter(Boolean).map((id) => ({ id: id as string })),
            },
        },
    });

    await saveInventoryAttachments(itemId, attachments);

    revalidatePath(`/inventory/${itemId}`);
    revalidatePath("/inventory");
    redirect(`/inventory/${itemId}`);
}

export async function deleteInventoryItem(itemId: string) {
    const attachments = await prisma.inventoryAttachment.findMany({
        where: { itemId },
    });
    await prisma.inventoryItem.delete({
        where: { id: itemId },
    });
    await Promise.all(
        attachments.map(async (attachment) => {
            if (!attachment.url.startsWith("/uploads/")) return;
            const absolutePath = resolvePublicUploadPath(attachment.url);
            if (!absolutePath) return;
            try {
                await fs.unlink(absolutePath);
            } catch {
                // Ignore missing files.
            }
        })
    );
    revalidatePath("/inventory");
    redirect("/inventory");
}

export async function requestInventoryEnrichment(itemId: string) {
    await prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
            enrichmentStatus: "pending",
            enrichmentError: null,
            enrichmentUpdatedAt: new Date(),
        },
    });
    await inventoryQueue.add("enrich", { itemId });
    revalidatePath(`/inventory/${itemId}`);
}

export async function moveInventoryAttachment(itemId: string, attachmentId: string, direction: "up" | "down") {
    const attachments = await prisma.inventoryAttachment.findMany({
        where: { itemId },
        orderBy: { order: "asc" },
    });
    const index = attachments.findIndex((attachment) => attachment.id === attachmentId);
    if (index === -1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= attachments.length) return;

    const current = attachments[index];
    const swap = attachments[swapIndex];

    await prisma.$transaction([
        prisma.inventoryAttachment.update({ where: { id: current.id }, data: { order: swap.order } }),
        prisma.inventoryAttachment.update({ where: { id: swap.id }, data: { order: current.order } }),
    ]);

    revalidatePath(`/inventory/${itemId}`);
    revalidatePath("/inventory");
}

export async function deleteInventoryAttachment(itemId: string, attachmentId: string) {
    const attachment = await prisma.inventoryAttachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) return;

    await prisma.inventoryAttachment.delete({ where: { id: attachmentId } });
    if (attachment.url.startsWith("/uploads/")) {
        const absolutePath = resolvePublicUploadPath(attachment.url);
        if (!absolutePath) return;
        try {
            await fs.unlink(absolutePath);
        } catch {
            // Ignore missing files.
        }
    }

    revalidatePath(`/inventory/${itemId}`);
    revalidatePath("/inventory");
}

export async function bulkUpdateInventoryItems(formData: FormData) {
    const ids = formData.getAll("itemIds").map((value) => value.toString());
    if (ids.length === 0) return;

    const categories = normalizeCategories(formData.getAll("categories"))
        .filter((category) => DEFAULT_INVENTORY_CATEGORIES.includes(category));
    const roomIds = formData.getAll("rooms").map((value) => value.toString());
    const tagIds = formData.getAll("tags").map((value) => value.toString());
    const newRoom = normalizeRoomName(formData.get("newRoom"));
    const newTag = normalizeTagName(formData.get("newTag"));
    const clearCategories = formData.get("clearCategories") === "on";
    const clearRooms = formData.get("clearRooms") === "on";
    const clearTags = formData.get("clearTags") === "on";
    const addCategories = formData.get("addCategories") === "on";
    const addRooms = formData.get("addRooms") === "on";
    const addTags = formData.get("addTags") === "on";
    const confirmClear = formData.get("confirmClear") === "on";

    if ((clearCategories || clearRooms || clearTags) && !confirmClear) return;

    const createdRoom = newRoom
        ? await prisma.room.upsert({
            where: { name: newRoom },
            create: { name: newRoom },
            update: {},
        })
        : null;
    const createdTag = newTag
        ? await prisma.tag.upsert({
            where: { name: newTag },
            create: { name: newTag },
            update: {},
        })
        : null;

    const roomConnections = [...roomIds, createdRoom?.id].filter(Boolean).map((id) => ({ id: id as string }));
    const tagConnections = [...tagIds, createdTag?.id].filter(Boolean).map((id) => ({ id: id as string }));

    await prisma.$transaction(async (tx) => {
        for (const id of ids) {
            const item = await tx.inventoryItem.findUnique({
                where: { id },
                select: { categories: true },
            });
            const mergedCategories = addCategories && item
                ? Array.from(new Set([...(item.categories ?? []), ...categories]))
                : categories;

            await tx.inventoryItem.update({
                where: { id },
                data: {
                    categories: clearCategories
                        ? []
                        : (categories.length > 0 ? (addCategories ? mergedCategories : categories) : undefined),
                    rooms: clearRooms
                        ? { set: [] }
                        : (roomConnections.length > 0
                            ? (addRooms ? { connect: roomConnections } : { set: roomConnections })
                            : undefined),
                    tags: clearTags
                        ? { set: [] }
                        : (tagConnections.length > 0
                            ? (addTags ? { connect: tagConnections } : { set: tagConnections })
                            : undefined),
                },
            });
        }
    });

    revalidatePath("/inventory");
    redirect("/inventory");
}
