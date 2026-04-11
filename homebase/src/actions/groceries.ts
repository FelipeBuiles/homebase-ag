"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createGroceryList,
  deleteGroceryList,
  addGroceryItem,
  removeGroceryItem,
  toggleGroceryItem,
  findDuplicatesInList,
  mergeGroceryItems,
  setDefaultGroceryList,
} from "@/lib/db/queries/groceries";
import { executeNormalizationAgent } from "@/lib/agents/execute";
import { action } from "@/lib/auth/action";

export const createGroceryListAction = action
  .schema(z.object({ name: z.string().min(1, "Name is required"), isDefault: z.boolean().optional() }))
  .action(async ({ parsedInput }) => {
    const list = await createGroceryList(parsedInput.name, parsedInput.isDefault);
    revalidatePath("/groceries");
    return { list };
  });

export const deleteGroceryListAction = action
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await deleteGroceryList(parsedInput.id);
    revalidatePath("/groceries");
    return { success: true };
  });

export const setDefaultListAction = action
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await setDefaultGroceryList(parsedInput.id);
    revalidatePath("/groceries");
    return { success: true };
  });

export const addGroceryItemAction = action
  .schema(
    z.object({
      listId: z.string(),
      name: z.string().min(1, "Item name is required"),
      quantity: z.string().optional(),
      unit: z.string().optional(),
      source: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    const { listId, ...data } = parsedInput;
    const item = await addGroceryItem(listId, data);
    revalidatePath(`/groceries/${listId}`);
    return { item };
  });

export const removeGroceryItemAction = action
  .schema(z.object({ id: z.string(), listId: z.string() }))
  .action(async ({ parsedInput }) => {
    await removeGroceryItem(parsedInput.id);
    revalidatePath(`/groceries/${parsedInput.listId}`);
    return { success: true };
  });

export const toggleGroceryItemAction = action
  .schema(z.object({ id: z.string(), listId: z.string() }))
  .action(async ({ parsedInput }) => {
    const item = await toggleGroceryItem(parsedInput.id);
    revalidatePath(`/groceries/${parsedInput.listId}`);
    return { item };
  });

export const normalizeListAction = action
  .schema(z.object({ listId: z.string() }))
  .action(async ({ parsedInput }) => {
    const result = await executeNormalizationAgent(parsedInput.listId);
    revalidatePath(`/groceries/${parsedInput.listId}`);
    return { success: true, proposalCount: result.proposalCount };
  });

export const checkDuplicatesAction = action
  .schema(z.object({ listId: z.string() }))
  .action(async ({ parsedInput }) => {
    const groups = await findDuplicatesInList(parsedInput.listId);
    return { groups };
  });

export const mergeDuplicatesAction = action
  .schema(z.object({ keepId: z.string(), mergeIds: z.array(z.string()), listId: z.string() }))
  .action(async ({ parsedInput }) => {
    await mergeGroceryItems(parsedInput.keepId, parsedInput.mergeIds);
    revalidatePath(`/groceries/${parsedInput.listId}`);
    return { success: true };
  });
