"use server";

import prisma from "@/lib/prisma";
import { normalizeRoomName, normalizeTagName } from "@/lib/inventory";
import { revalidatePath } from "next/cache";

export async function createRoom(formData: FormData) {
  const name = normalizeRoomName(formData.get("name"));
  if (!name) return;

  await prisma.room.upsert({
    where: { name },
    create: { name },
    update: {},
  });

  revalidatePath("/settings");
  revalidatePath("/inventory");
}

export async function updateRoom(roomId: string, formData: FormData) {
  const name = normalizeRoomName(formData.get("name"));
  if (!name) return;

  await prisma.room.update({
    where: { id: roomId },
    data: { name },
  });

  revalidatePath("/settings");
  revalidatePath("/inventory");
}

export async function deleteRoom(roomId: string) {
  await prisma.room.delete({ where: { id: roomId } });
  revalidatePath("/settings");
  revalidatePath("/inventory");
}

export async function createTag(formData: FormData) {
  const name = normalizeTagName(formData.get("name"));
  if (!name) return;

  await prisma.tag.upsert({
    where: { name },
    create: { name },
    update: {},
  });

  revalidatePath("/settings");
  revalidatePath("/inventory");
}

export async function updateTag(tagId: string, formData: FormData) {
  const name = normalizeTagName(formData.get("name"));
  if (!name) return;

  await prisma.tag.update({
    where: { id: tagId },
    data: { name },
  });

  revalidatePath("/settings");
  revalidatePath("/inventory");
}

export async function deleteTag(tagId: string) {
  await prisma.tag.delete({ where: { id: tagId } });
  revalidatePath("/settings");
  revalidatePath("/inventory");
}
