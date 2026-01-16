import prisma from "@/lib/prisma";
import { runAgentPrompt } from "@/lib/ai";
import { buildCanonicalKey } from "@/lib/groceries";

export async function normalizeGroceryItem(itemId: string, name: string) {
  const { data } = await runAgentPrompt(
    "agent_normalization",
    `Grocery item name: ${name}`
  );

  const normalizedName = data?.normalizedName?.trim() || name;
  const canonicalKey = buildCanonicalKey(normalizedName);

  await prisma.groceryItem.update({
    where: { id: itemId },
    data: { normalizedName, canonicalKey },
  });
}
