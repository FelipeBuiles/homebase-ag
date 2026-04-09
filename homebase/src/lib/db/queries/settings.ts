import { prisma } from "@/lib/db/client";

export async function getAppConfig() {
  return prisma.appConfig.upsert({
    where: { id: "singleton" },
    create: {},
    update: {},
  });
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
