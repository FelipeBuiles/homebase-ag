"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  createGroceryList,
  deleteGroceryList,
  addGroceryItem,
  removeGroceryItem,
  toggleGroceryItem,
} from "@/lib/db/queries/groceries";
import { agentQueue } from "@/lib/agents/runner";

const action = createSafeActionClient();

export const createGroceryListAction = action
  .schema(z.object({ name: z.string().min(1, "Name is required") }))
  .action(async ({ parsedInput }) => {
    const list = await createGroceryList(parsedInput.name);
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

export const addGroceryItemAction = action
  .schema(
    z.object({
      listId: z.string(),
      name: z.string().min(1, "Item name is required"),
      quantity: z.string().optional(),
      unit: z.string().optional(),
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
    await agentQueue.add("normalization", { entityId: parsedInput.listId });
    return { queued: true };
  });
