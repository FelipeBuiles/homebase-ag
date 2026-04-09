"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { createHash } from "crypto";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const action = createSafeActionClient();

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

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
      },
      update: {
        enabled: parsedInput.enabled,
        llmOverride: parsedInput.llmOverride || null,
        modelOverride: parsedInput.modelOverride || null,
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

    if (hashPassword(parsedInput.currentPassword) !== user.passwordHash) {
      return { error: "Current password is incorrect" };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(parsedInput.newPassword) },
    });

    // Invalidate session so user must log in again
    const session = await getSession();
    session.destroy();
    redirect("/login");
  });
