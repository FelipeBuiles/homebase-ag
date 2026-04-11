"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { action } from "@/lib/auth/action";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { clearDomainData, seedDemoData } from "@/lib/dev/demo-data";

export const updateLlmConfigAction = action
  .schema(
    z.object({
      llmProvider: z.enum(["openrouter", "openai", "anthropic", "google", "deepseek", "ollama"]),
      textModel: z.string().min(1),
      visionModel: z.string().min(1),
      ollamaBaseUrl: z.string().optional(),
      ollamaModel: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    await prisma.appConfig.upsert({
      where: { id: "singleton" },
      create: { ...parsedInput },
      update: { ...parsedInput },
    });
    revalidatePath("/settings");
    return { success: true };
  });

export const updateAgentConfigAction = action
  .schema(
    z.object({
      agentId: z.string(),
      enabled: z.boolean(),
      llmOverride: z.string().optional(),
      modelOverride: z.string().optional(),
      userPrompt: z.string().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    await prisma.agentConfig.upsert({
      where: { agentId: parsedInput.agentId },
      create: {
        agentId: parsedInput.agentId,
        enabled: parsedInput.enabled,
        llmOverride: parsedInput.llmOverride || null,
        modelOverride: parsedInput.modelOverride || null,
        userPrompt: parsedInput.userPrompt || null,
      },
      update: {
        enabled: parsedInput.enabled,
        llmOverride: parsedInput.llmOverride || null,
        modelOverride: parsedInput.modelOverride || null,
        userPrompt: parsedInput.userPrompt || null,
      },
    });
    revalidatePath("/settings");
    return { success: true };
  });

export const updatePantryWarnDaysAction = action
  .schema(z.object({ days: z.number().int().min(1).max(365) }))
  .action(async ({ parsedInput }) => {
    await prisma.appConfig.upsert({
      where: { id: "singleton" },
      create: { pantryWarnDays: parsedInput.days },
      update: { pantryWarnDays: parsedInput.days },
    });
    revalidatePath("/settings");
    revalidatePath("/pantry");
    return { success: true };
  });

export const updateLocaleAction = action
  .schema(z.object({ locale: z.enum(["en", "es", "fr"]) }))
  .action(async ({ parsedInput }) => {
    await prisma.appConfig.upsert({
      where: { id: "singleton" },
      create: {},
      update: {},
    });

    try {
      await prisma.$executeRaw`
        UPDATE "AppConfig"
        SET "appLocale" = ${parsedInput.locale}
        WHERE "id" = 'singleton'
      `;
    } catch {
      throw new Error("Locale column is not available yet. Apply the latest Prisma migration and restart the app.");
    }

    revalidatePath("/", "layout");
    revalidatePath("/settings");
    return { success: true };
  });

export const changePasswordAction = action
  .schema(
    z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(4, "Password must be at least 4 characters"),
    })
  )
  .action(async ({ parsedInput }) => {
    const user = await prisma.user.findFirst();
    if (!user) return { error: "No user found" };

    const valid = await verifyPassword(parsedInput.currentPassword, user.passwordHash ?? "");
    if (!valid) {
      return { error: "Current password is incorrect" };
    }

    const passwordHash = await hashPassword(parsedInput.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate session so user must log in again
    const session = await getSession();
    session.destroy();
    redirect("/login");
  });

export const seedDemoDataAction = action
  .schema(z.void())
  .action(async () => {
    await prisma.$transaction(async (tx) => {
      await clearDomainData(tx);
      await seedDemoData(tx);
    });

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/pantry");
    revalidatePath("/recipes");
    revalidatePath("/meal-plans");
    revalidatePath("/groceries");
    revalidatePath("/review");
    revalidatePath("/activity");
    revalidatePath("/settings");
    return { success: true };
  });

export const clearAllDataAction = action
  .schema(z.object({ confirmation: z.literal("CLEAR") }))
  .action(async () => {
    await prisma.$transaction(async (tx) => {
      await clearDomainData(tx);
    });

    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/inventory");
    revalidatePath("/pantry");
    revalidatePath("/recipes");
    revalidatePath("/meal-plans");
    revalidatePath("/groceries");
    revalidatePath("/review");
    revalidatePath("/activity");
    revalidatePath("/settings");
    return { success: true };
  });
