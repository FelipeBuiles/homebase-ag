"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createHash } from "crypto";
import { cookies } from "next/headers";

const action = createSafeActionClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

const SetupSchema = z.object({
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export const setupPassword = action
  .schema(SetupSchema)
  .action(async ({ parsedInput }) => {
    const existing = await prisma.appConfig.findUnique({
      where: { id: "singleton" },
    });

    if (existing?.isPasswordSet) {
      return { error: "Password already set" };
    }

    const passwordHash = hashPassword(parsedInput.password);

    await prisma.user.create({
      data: { passwordHash },
    });

    await prisma.appConfig.upsert({
      where: { id: "singleton" },
      create: { isPasswordSet: true },
      update: { isPasswordSet: true },
    });

    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();

    // Mark setup as complete so the proxy redirects to /login instead of /setup
    const cookieStore = await cookies();
    cookieStore.set("homebase_setup", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    redirect("/");
  });

const LoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const login = action
  .schema(LoginSchema)
  .action(async ({ parsedInput }) => {
    const user = await prisma.user.findFirst();
    if (!user || !user.passwordHash) {
      return { error: "No account found. Please run setup first." };
    }

    const hash = hashPassword(parsedInput.password);
    if (hash !== user.passwordHash) {
      return { error: "Invalid password" };
    }

    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();

    redirect("/");
  });

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

export async function getAuthState() {
  const config = await prisma.appConfig.findUnique({
    where: { id: "singleton" },
  });
  const session = await getSession();
  return {
    isPasswordSet: config?.isPasswordSet ?? false,
    isLoggedIn: session.isLoggedIn ?? false,
  };
}
