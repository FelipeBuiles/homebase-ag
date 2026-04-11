"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createPantryItem,
  updatePantryItem,
  deletePantryItem,
} from "@/lib/db/queries/pantry";
import { addGroceryItem, buildCanonicalKey, getDefaultGroceryList, getGroceryListItems } from "@/lib/db/queries/groceries";
import { executeExpirationScanAgent } from "@/lib/agents/execute";
import { action } from "@/lib/auth/action";
import { encodePantryRestockSource } from "@/lib/grocery-source";

const PantryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brand: z.string().optional(),
  location: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  expiresAt: z.string().optional(), // ISO date string
  openedAt: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["in_stock", "out_of_stock", "consumed", "discarded"]).optional(),
  inventoryItemId: z.string().optional(),
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
      status: parsedInput.status,
      inventoryItemId: parsedInput.inventoryItemId || undefined,
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
      status: data.status,
      inventoryItemId: data.inventoryItemId || null,
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
    const result = await executeExpirationScanAgent();
    revalidatePath("/pantry");
    revalidatePath("/review");
    return { success: true, proposalCount: result.proposalCount };
  });

export const updatePantryStatusAction = action
  .schema(
    z.object({
      id: z.string(),
      status: z.enum(["in_stock", "out_of_stock", "consumed", "discarded"]),
    })
  )
  .action(async ({ parsedInput }) => {
    const item = await updatePantryItem(parsedInput.id, {
      status: parsedInput.status,
      statusUpdatedAt: new Date(),
    });
    revalidatePath("/pantry");
    revalidatePath(`/pantry/${parsedInput.id}`);
    return { item };
  });

export const addPantryRestockToGroceriesAction = action
  .schema(
    z.object({
      pantryItemId: z.string(),
      name: z.string().min(1),
      quantity: z.number().optional(),
      unit: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const list = await getDefaultGroceryList();
    const existingItems = await getGroceryListItems(list.id);
    const canonicalKey = buildCanonicalKey(parsedInput.name);
    const alreadyExists = existingItems.some(
      (item) => (item.canonicalKey ?? buildCanonicalKey(item.name)) === canonicalKey
    );

    if (!alreadyExists) {
      await addGroceryItem(list.id, {
        name: parsedInput.name,
        unit: parsedInput.unit || undefined,
        source: encodePantryRestockSource(parsedInput.name),
        canonicalKey,
      });
    }

    revalidatePath("/groceries");
    revalidatePath(`/groceries/${list.id}`);
    revalidatePath("/pantry");
    revalidatePath(`/pantry/${parsedInput.pantryItemId}`);
    return { listId: list.id, added: !alreadyExists };
  });
