'use server';

import prisma from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";

type SetupState = {
  error?: string;
};

export async function completeSetup(_: SetupState, formData: FormData): Promise<SetupState> {
  const password = (formData.get("password") as string | null) ?? "";
  const confirm = (formData.get("confirm") as string | null) ?? "";

  if (password && password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const existing = await prisma.appConfig.findFirst();
  if (existing?.setupComplete) {
    redirect("/");
  }

  let passwordHash: string | null = null;
  let passwordSalt: string | null = null;

  if (password) {
    const hashed = await hashPassword(password);
    passwordHash = hashed.hash;
    passwordSalt = hashed.salt;
  }

  await prisma.appConfig.upsert({
    where: { id: existing?.id ?? "app" },
    create: {
      id: "app",
      setupComplete: true,
      passwordHash,
      passwordSalt,
    },
    update: {
      setupComplete: true,
      passwordHash,
      passwordSalt,
    },
  });

  await setSessionCookie("owner");
  redirect("/");
}
