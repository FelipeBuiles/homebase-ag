import prisma from "@/lib/prisma";

export async function getAppConfig() {
  const existing = await prisma.appConfig.findFirst();
  if (existing) {
    return existing;
  }

  const defaultProvider = process.env.DEFAULT_PROVIDER?.trim();
  const defaultApiKey = process.env.DEFAULT_API_KEY?.trim();
  const defaultTextModel = process.env.DEFAULT_TEXT_MODEL?.trim();
  const defaultVisionModel = process.env.DEFAULT_VISION_MODEL?.trim();

  return prisma.appConfig.create({
    data: {
      id: "app",
      llmProvider: defaultProvider || undefined,
      llmApiKey: defaultApiKey || null,
      llmModel: defaultTextModel || null,
      llmVisionModel: defaultVisionModel || null,
      pantryWarningDays: 7,
    },
  });
}
