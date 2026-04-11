"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addInventoryAttachment,
} from "@/lib/db/queries/inventory";
import { executeEnrichmentAgent } from "@/lib/agents/execute";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const action = createSafeActionClient();

const ItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  condition: z.enum(["good", "fair", "poor"]).default("good"),
  quantity: z.number().int().min(1).default(1),
  notes: z.string().optional(),
  categories: z.array(z.string()).default([]),
  rooms: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const createItem = action
  .schema(ItemSchema)
  .action(async ({ parsedInput }) => {
    const item = await createInventoryItem(parsedInput);
    revalidatePath("/inventory");
    return { item };
  });

export const updateItem = action
  .schema(ItemSchema.extend({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const item = await updateInventoryItem(id, data);
    revalidatePath("/inventory");
    revalidatePath(`/inventory/${id}`);
    return { item };
  });

export const deleteItem = action
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await deleteInventoryItem(parsedInput.id);
    revalidatePath("/inventory");
    return { success: true };
  });

export async function quickCreateWithPhoto(
  fields: {
    name: string;
    brand?: string;
    condition: "good" | "fair" | "poor";
    quantity: number;
    categories: string[];
    rooms: string[];
    tags: string[];
  },
  formData: FormData
) {
  // Create the item first
  const item = await createInventoryItem(fields);

  // Then attach the photo (reuse the same upload logic)
  const file = formData.get("file") as File;
  if (file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = join(process.cwd(), "public", "uploads", "inventory");
    await mkdir(uploadsDir, { recursive: true });

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${item.id}-${Date.now()}.${ext}`;
    const thumbFilename = `${item.id}-${Date.now()}-thumb.webp`;

    await writeFile(join(uploadsDir, filename), buffer);

    const meta = await sharp(buffer)
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(join(uploadsDir, thumbFilename));

    await addInventoryAttachment({
      itemId: item.id,
      url: `/uploads/inventory/${filename}`,
      mimeType: file.type,
      width: meta.width,
      height: meta.height,
    });
  }

  revalidatePath("/inventory");
  return { item };
}

export async function uploadAttachment(itemId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = join(process.cwd(), "public", "uploads", "inventory");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${itemId}-${Date.now()}.${ext}`;
  const thumbFilename = `${itemId}-${Date.now()}-thumb.webp`;

  const filePath = join(uploadsDir, filename);
  const thumbPath = join(uploadsDir, thumbFilename);

  await writeFile(filePath, buffer);

  // Generate thumbnail
  const meta = await sharp(buffer)
    .resize(400, 400, { fit: "cover" })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  await addInventoryAttachment({
    itemId,
    url: `/uploads/inventory/${filename}`,
    mimeType: file.type,
    width: meta.width,
    height: meta.height,
  });

  await executeEnrichmentAgent(itemId);

  revalidatePath(`/inventory/${itemId}`);
  revalidatePath("/inventory");

  return { url: `/uploads/inventory/${filename}`, thumb: `/uploads/inventory/${thumbFilename}` };
}
