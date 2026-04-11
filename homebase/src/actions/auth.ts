"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { publicAction } from "@/lib/auth/action";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

const SetupSchema = z.object({
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export const setupPassword = publicAction
  .schema(SetupSchema)
  .action(async ({ parsedInput }) => {
    const [config, existingUser] = await Promise.all([
      prisma.appConfig.findUnique({
        where: { id: "singleton" },
      }),
      prisma.user.findFirst({
        where: { passwordHash: { not: null } },
      }),
    ]);

    if (config?.isPasswordSet || existingUser) {
      const cookieStore = await cookies();
      cookieStore.set("homebase_setup", "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 10,
      });
      return { error: "Password already set" };
    }

    const passwordHash = await hashPassword(parsedInput.password);

    // Use transaction to prevent race condition creating multiple users
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { passwordHash: { not: null } },
      });
      if (existing) return;

      await tx.user.create({
        data: { passwordHash },
      });

      await tx.appConfig.upsert({
        where: { id: "singleton" },
        create: { isPasswordSet: true },
        update: { isPasswordSet: true },
      });
    });

    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();

    // Mark setup as complete so the proxy redirects to /login instead of /setup
    const cookieStore = await cookies();
    cookieStore.set("homebase_setup", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    return { success: true };
  });

const LoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const login = publicAction
  .schema(LoginSchema)
  .action(async ({ parsedInput }) => {
    const user = await prisma.user.findFirst();
    if (!user || !user.passwordHash) {
      return { error: "No account found. Please run setup first." };
    }

    const valid = await verifyPassword(parsedInput.password, user.passwordHash);
    if (!valid) {
      return { error: "Invalid password" };
    }

    const session = await getSession();
    session.isLoggedIn = true;
    await session.save();

    const cookieStore = await cookies();
    cookieStore.set("homebase_setup", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10,
    });

    return { success: true };
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
