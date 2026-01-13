"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AGENT_PROMPTS, type AgentId } from "@/lib/agent-prompts";

const getConfigId = async () => {
  const config = await prisma.appConfig.findFirst();
  return config?.id ?? "app";
};

export async function updateAiProvider(formData: FormData) {
  const provider = (formData.get("provider") as string | null) ?? "ollama";
  const baseUrl = (formData.get("baseUrl") as string | null) ?? "";
  const apiKey = (formData.get("apiKey") as string | null) ?? "";
  const id = await getConfigId();

  await prisma.appConfig.upsert({
    where: { id },
    create: {
      id,
      setupComplete: true,
      llmProvider: provider,
      llmBaseUrl: baseUrl || "http://localhost:11434",
      llmApiKey: apiKey || null,
    },
    update: {
      llmProvider: provider,
      llmBaseUrl: baseUrl || "http://localhost:11434",
      llmApiKey: apiKey || null,
    },
  });

  revalidatePath("/settings");
}

export async function updateAgentConfig(agentId: AgentId, formData: FormData) {
  const model = (formData.get("model") as string | null)?.trim();
  const prompt = (formData.get("prompt") as string | null) ?? "";
  const enabled = formData.get("enabled") === "on";

  const fallback = AGENT_PROMPTS.find((agent) => agent.agentId === agentId);
  const modelToUse = model || fallback?.defaultModel || "llama3.1";
  const promptToUse = prompt.trim() || fallback?.defaultPrompt || "";

  await prisma.agentConfig.upsert({
    where: { agentId },
    create: {
      agentId,
      model: modelToUse,
      prompt: promptToUse,
      enabled,
    },
    update: {
      model: modelToUse,
      prompt: promptToUse,
      enabled,
    },
  });

  revalidatePath("/settings");
}
