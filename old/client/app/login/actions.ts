"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

type LoginState = {
  error?: string;
};

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const password = (formData.get("password") as string | null) ?? "";
  if (!password) {
    return { error: "Enter your password to continue." };
  }

  const config = await prisma.appConfig.findFirst();
  if (!config?.passwordHash || !config.passwordSalt) {
    redirect("/");
  }

  const isValid = await verifyPassword(password, config.passwordSalt, config.passwordHash);
  if (!isValid) {
    return { error: "Incorrect password." };
  }

  await setSessionCookie("owner");
  redirect("/");
}
