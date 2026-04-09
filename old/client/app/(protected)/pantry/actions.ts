'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { maintenanceQueue } from "@/lib/queue";

export async function createPantryItem(formData: FormData) {
  const name = formData.get("name") as string;
  const quantity = formData.get("quantity") as string;
  const unit = formData.get("unit") as string;
  const expirationDateStr = formData.get("expirationDate") as string;
  const openedDateStr = formData.get("openedDate") as string;
  const category = formData.get("category") as string;
  const location = formData.get("location") as string;
  const status = (formData.get("status") as string) || "in_stock";
  const inventoryItemId = formData.get("inventoryItemId") as string;
  const normalizedInventoryItemId =
    inventoryItemId && inventoryItemId !== "none" ? inventoryItemId : null;

  if (!name || !location) return;

  await prisma.pantryItem.create({
    data: {
      name,
      quantity: quantity || null,
      unit: unit || null,
      category: category || null,
      location,
      status,
      inventoryItemId: normalizedInventoryItemId,
      expirationDate: expirationDateStr ? new Date(expirationDateStr) : null,
      openedDate: openedDateStr ? new Date(openedDateStr) : null,
    },
  });

  revalidatePath("/pantry");
  redirect("/pantry");
}

export async function deletePantryItem(id: string) {
  await prisma.pantryItem.delete({ where: { id } });
  revalidatePath("/pantry");
}

export async function updatePantryItemStatus(id: string, status: string) {
  await prisma.pantryItem.update({
    where: { id },
    data: { status, statusUpdatedAt: new Date() },
  });
  revalidatePath("/pantry");
  revalidatePath("/pantry/expiring");
}

export async function updatePantryItem(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const quantity = formData.get("quantity") as string;
  const unit = formData.get("unit") as string;
  const expirationDateStr = formData.get("expirationDate") as string;
  const openedDateStr = formData.get("openedDate") as string;
  const category = formData.get("category") as string;
  const location = formData.get("location") as string;
  const status = (formData.get("status") as string) || "in_stock";
  const inventoryItemId = formData.get("inventoryItemId") as string;
  const normalizedInventoryItemId =
    inventoryItemId && inventoryItemId !== "none" ? inventoryItemId : null;

  if (!name || !location) return;

  await prisma.pantryItem.update({
    where: { id },
    data: {
      name,
      quantity: quantity || null,
      unit: unit || null,
      category: category || null,
      location,
      status,
      statusUpdatedAt: new Date(),
      inventoryItemId: normalizedInventoryItemId,
      expirationDate: expirationDateStr ? new Date(expirationDateStr) : null,
      openedDate: openedDateStr ? new Date(openedDateStr) : null,
    },
  });

  revalidatePath("/pantry");
  revalidatePath("/pantry/expiring");
  redirect("/pantry");
}

export async function runPantryMaintenance() {
  await maintenanceQueue.add("pantry-maintenance", {}, { removeOnComplete: true });
  revalidatePath("/pantry");
}

export async function updatePantryWarningWindow(formData: FormData) {
  const value = Number(formData.get("pantryWarningDays"));
  const pantryWarningDays = Number.isFinite(value) ? value : 7;

  await prisma.appConfig.upsert({
    where: { id: "app" },
    create: { id: "app", pantryWarningDays },
    update: { pantryWarningDays },
  });

  revalidatePath("/pantry");
  revalidatePath("/pantry/expiring");
}
