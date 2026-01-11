'use server';

import prisma from "@/lib/prisma";
import { hashPassword, setSessionCookie, verifyPassword, clearSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

type PasswordState = {
  error?: string;
  success?: string;
};

const getConfig = async () => {
  return prisma.appConfig.findFirst();
};

export async function updatePassword(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const current = (formData.get("current") as string | null) ?? "";
  const next = (formData.get("next") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  if (!next) {
    return { error: "Enter a new password." };
  }
  if (next !== confirm) {
    return { error: "New password and confirmation do not match." };
  }

  const config = await getConfig();
  if (config?.passwordHash) {
    if (!current) return { error: "Current password is required." };
    const valid = await verifyPassword(current, config.passwordSalt ?? "", config.passwordHash);
    if (!valid) return { error: "Current password is incorrect." };
  }

  const hashed = await hashPassword(next);
  await prisma.appConfig.upsert({
    where: { id: config?.id ?? "app" },
    create: {
      id: "app",
      setupComplete: true,
      passwordHash: hashed.hash,
      passwordSalt: hashed.salt,
    },
    update: {
      passwordHash: hashed.hash,
      passwordSalt: hashed.salt,
    },
  });

  await setSessionCookie("owner");
  return { success: "Password updated." };
}

export async function removePassword(_: PasswordState, formData: FormData): Promise<PasswordState> {
  const current = (formData.get("current") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  if (confirm !== "REMOVE") {
    return { error: "Type REMOVE to confirm password removal." };
  }

  const config = await getConfig();
  if (config?.passwordHash) {
    if (!current) return { error: "Current password is required." };
    const valid = await verifyPassword(current, config.passwordSalt ?? "", config.passwordHash);
    if (!valid) return { error: "Current password is incorrect." };
  }

  await prisma.appConfig.upsert({
    where: { id: config?.id ?? "app" },
    create: {
      id: "app",
      setupComplete: true,
      passwordHash: null,
      passwordSalt: null,
    },
    update: {
      passwordHash: null,
      passwordSalt: null,
    },
  });

  await clearSessionCookie();
  redirect("/");
}
