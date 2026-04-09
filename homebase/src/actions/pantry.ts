"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createPantryItem,
  updatePantryItem,
  deletePantryItem,
} from "@/lib/db/queries/pantry";
import { agentQueue } from "@/lib/agents/runner";

const action = createSafeActionClient();

const PantryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  location: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  expiresAt: z.string().optional(), // ISO date string
  openedAt: z.string().optional(),
  notes: z.string().optional(),
});

export const createPantryItemAction = action
  .schema(PantryItemSchema)
  .action(async ({ parsedInput }) => {
    const item = await createPantryItem({
      name: parsedInput.name,
      brand: parsedInput.brand || undefined,
      location: parsedInput.location || undefined,
      quantity: parsedInput.quantity,
      unit: parsedInput.unit || undefined,
      expiresAt: parsedInput.expiresAt ? new Date(parsedInput.expiresAt) : undefined,
      openedAt: parsedInput.openedAt ? new Date(parsedInput.openedAt) : undefined,
      notes: parsedInput.notes || undefined,
    });
    revalidatePath("/pantry");
    return { item };
  });

export const updatePantryItemAction = action
  .schema(PantryItemSchema.extend({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const item = await updatePantryItem(id, {
      name: data.name,
      brand: data.brand || null,
      location: data.location || null,
      quantity: data.quantity,
      unit: data.unit || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      openedAt: data.openedAt ? new Date(data.openedAt) : null,
      notes: data.notes || null,
    });
    revalidatePath("/pantry");
    revalidatePath(`/pantry/${id}`);
    return { item };
  });

export const deletePantryItemAction = action
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await deletePantryItem(parsedInput.id);
    revalidatePath("/pantry");
    return { success: true };
  });

export const markOpenedAction = action
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const item = await updatePantryItem(parsedInput.id, { openedAt: new Date() });
    revalidatePath("/pantry");
    revalidatePath(`/pantry/${parsedInput.id}`);
    return { item };
  });

export const triggerExpirationScanAction = action
  .schema(z.object({}))
  .action(async () => {
    await agentQueue.add("expiration", { entityId: "all" });
    return { queued: true };
  });
