import { prisma } from "@/lib/db/client";

function getEnvBackedDefaults() {
  return {
    appLocale: "en",
    llmProvider: process.env.LLM_PROVIDER ?? "openrouter",
    textModel: process.env.DEFAULT_TEXT_MODEL ?? "google/gemini-2.0-flash-001",
    visionModel: process.env.DEFAULT_VISION_MODEL ?? "google/gemini-2.0-flash-001",
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    ollamaModel: process.env.OLLAMA_MODEL ?? "llama3.2",
  };
}

async function readStoredLocale() {
  try {
    const rows = await prisma.$queryRaw<Array<{ appLocale: string | null }>>`
      SELECT "appLocale"
      FROM "AppConfig"
      WHERE "id" = 'singleton'
      LIMIT 1
    `;
    return rows[0]?.appLocale ?? null;
  } catch {
    return null;
  }
}

export async function getAppConfig() {
  const envDefaults = getEnvBackedDefaults();
  const { appLocale, ...clientDefaults } = envDefaults;
  const config = await prisma.appConfig.upsert({
    where: { id: "singleton" },
    create: clientDefaults,
    update: {},
  });
  const storedLocale = await readStoredLocale();

  // Respect the stored DB config — no silent overrides.
  // Env vars only apply at initial creation time.
  return {
    ...config,
    appLocale: storedLocale ?? appLocale,
  };
}

export async function getAllAgentConfigs() {
  return prisma.agentConfig.findMany();
}

export async function getDbStats() {
  const [inventory, pantry, recipes, groceryLists, mealPlans, proposals] =
    await Promise.all([
      prisma.inventoryItem.count(),
      prisma.pantryItem.count(),
      prisma.recipe.count(),
      prisma.groceryList.count(),
      prisma.mealPlan.count(),
      prisma.proposal.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

  const proposalCounts = Object.fromEntries(
    proposals.map((p) => [p.status, p._count.status])
  );

  return {
    inventory,
    pantry,
    recipes,
    groceryLists,
    mealPlans,
    proposals: {
      pending: proposalCounts.pending ?? 0,
      accepted: proposalCounts.accepted ?? 0,
      rejected: proposalCounts.rejected ?? 0,
    },
  };
}

export async function getActivityMetrics() {
  const [byAgent, byAction] = await Promise.all([
    prisma.auditLog.groupBy({
      by: ["actor"],
      _count: { actor: true },
      orderBy: { _count: { actor: "desc" } },
    }),
    prisma.proposal.groupBy({
      by: ["agentId"],
      _count: { agentId: true },
      orderBy: { _count: { agentId: "desc" } },
    }),
  ]);

  return { byAgent, byAgentProposals: byAction };
}
