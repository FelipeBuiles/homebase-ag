# Groceries G1-G3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver single-list groceries with normalization + duplicate merge workflow (G1–G3) ready for future pantry integration.

**Architecture:** Keep `GroceryList`/`GroceryItem` but enforce a single default list via helper. Store normalization outputs (`normalizedName`, `canonicalKey`, `source`) directly on items. Duplicate review is computed on-demand and merges are user-triggered, preserving originals in `mergedFrom`.

**Tech Stack:** Next.js App Router, Prisma/Postgres, BullMQ, Vitest.

### Task 1: Data model + groceries helpers

**Files:**
- Modify: `client/prisma/schema.prisma`
- Create: `client/lib/groceries.ts`
- Test: `client/tests/groceries-helpers.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildCanonicalKey } from "../lib/groceries";

describe("buildCanonicalKey", () => {
  it("normalizes names into stable lowercase keys", () => {
    expect(buildCanonicalKey("  Green Onions ")).toBe("green-onions");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- groceries-helpers.test.ts`
Expected: FAIL with "Cannot find module '../lib/groceries'" or function missing.

**Step 3: Update Prisma schema and add helper implementation**

```prisma
enum GroceryItemSource {
  manual
  recipe
  agent
}

model GroceryItem {
  // existing fields...
  normalizedName    String?
  canonicalKey      String?
  source            GroceryItemSource @default(manual)
  suggestedCategory String?
  mergedFrom        Json?
}
```

```ts
export const buildCanonicalKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "-");
```

**Step 4: Run Prisma migration**

Run: `npx --prefix client prisma migrate dev --name grocery-item-normalization`
Expected: migration generated and applied.

**Step 5: Run test to verify it passes**

Run: `npm --prefix client run test -- groceries-helpers.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add client/prisma/schema.prisma client/lib/groceries.ts client/tests/groceries-helpers.test.ts
# include prisma migration files

git commit -m "groceries item normalization fields"
```

### Task 2: Single default list + add item action

**Files:**
- Modify: `client/app/(protected)/groceries/actions.ts`
- Modify: `client/app/(protected)/groceries/page.tsx`
- Modify: `client/app/(protected)/groceries/[id]/page.tsx`
- Test: `client/tests/groceries-actions.test.ts`

**Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../lib/queue", () => ({ groceryQueue: { add: vi.fn() } }));

import { addGroceryItem } from "../app/(protected)/groceries/actions";

describe("groceries actions", () => {
  afterEach(async () => {
    const { groceryQueue } = await import("../lib/queue");
    vi.mocked(groceryQueue.add).mockClear();
    await resetDb();
  });

  it("creates a default list and enqueues normalization", async () => {
    const formData = new FormData();
    formData.set("name", "Milk");

    await addGroceryItem(formData);

    const list = await prisma.groceryList.findFirst({ where: { isDefault: true } });
    expect(list).toBeTruthy();

    const items = await prisma.groceryItem.findMany({ where: { listId: list!.id } });
    expect(items).toHaveLength(1);
    expect(items[0].source).toBe("manual");

    const { groceryQueue } = await import("../lib/queue");
    expect(vi.mocked(groceryQueue.add)).toHaveBeenCalledWith("created", {
      itemId: items[0].id,
      name: "Milk",
      listId: list!.id,
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- groceries-actions.test.ts`
Expected: FAIL with missing `addGroceryItem` or default list logic.

**Step 3: Implement single-list helpers + action**

- Add `getOrCreateDefaultGroceryList` to `client/lib/groceries.ts`.
- Replace `createGroceryList`/`addItemToList` with `addGroceryItem` that:
  - fetches/creates default list
  - writes item with `source=manual`
  - enqueues normalization
  - revalidates `/groceries`
- Update `/groceries` page to load the default list and render list view directly.
- Update `/groceries/[id]` to `redirect("/groceries")`.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- groceries-actions.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/app/(protected)/groceries/actions.ts client/app/(protected)/groceries/page.tsx client/app/(protected)/groceries/[id]/page.tsx client/lib/groceries.ts client/tests/groceries-actions.test.ts

git commit -m "groceries single default list"
```

### Task 3: Normalization agent writes fields

**Files:**
- Modify: `client/agents/normalization.ts`
- Create: `client/lib/groceries-normalization.ts`
- Test: `client/tests/groceries-normalization.test.ts`

**Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("../lib/ai", () => ({
  runAgentPrompt: vi.fn(async () => ({
    data: { normalizedName: "Scallion", confidence: 0.9, rationale: "Synonym" },
    raw: "ok",
  })),
}));

import { normalizeGroceryItem } from "../lib/groceries-normalization";

describe("normalizeGroceryItem", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("writes normalized name + canonical key", async () => {
    const list = await prisma.groceryList.create({ data: { name: "Groceries", isDefault: true } });
    const item = await prisma.groceryItem.create({ data: { name: "Green onions", listId: list.id } });

    await normalizeGroceryItem(item.id, item.name);

    const stored = await prisma.groceryItem.findUnique({ where: { id: item.id } });
    expect(stored?.normalizedName).toBe("Scallion");
    expect(stored?.canonicalKey).toBe("scallion");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- groceries-normalization.test.ts`
Expected: FAIL with missing module/function.

**Step 3: Implement normalization helper + agent usage**

```ts
export async function normalizeGroceryItem(itemId: string, name: string) {
  const { data } = await runAgentPrompt("agent_normalization", `Grocery item name: ${name}`);
  const normalizedName = data?.normalizedName?.trim() || name;
  const canonicalKey = buildCanonicalKey(normalizedName);

  await prisma.groceryItem.update({
    where: { id: itemId },
    data: { normalizedName, canonicalKey },
  });
}
```

Update `client/agents/normalization.ts` to call `normalizeGroceryItem` and remove proposal creation for groceries.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- groceries-normalization.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/agents/normalization.ts client/lib/groceries-normalization.ts client/tests/groceries-normalization.test.ts

git commit -m "groceries normalization writes fields"
```

### Task 4: Duplicate detection + merge workflow (G3)

**Files:**
- Create: `client/lib/groceries-duplicates.ts`
- Modify: `client/app/(protected)/groceries/actions.ts`
- Modify: `client/app/(protected)/groceries/ItemRow.tsx`
- Modify: `client/app/(protected)/groceries/page.tsx`
- Test: `client/tests/groceries-duplicates.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { findDuplicateGroups } from "../lib/groceries-duplicates";

describe("findDuplicateGroups", () => {
  it("groups items by canonical key", () => {
    const groups = findDuplicateGroups([
      { id: "1", name: "Milk", canonicalKey: "milk", normalizedName: "Milk" },
      { id: "2", name: "Whole milk", canonicalKey: "milk", normalizedName: "Milk" },
      { id: "3", name: "Bread", canonicalKey: "bread", normalizedName: "Bread" },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((item) => item.id)).toEqual(["1", "2"]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- groceries-duplicates.test.ts`
Expected: FAIL with missing module/function.

**Step 3: Implement duplicate detection + merge action**

```ts
export function findDuplicateGroups(items) {
  const byKey = new Map();
  // group by canonicalKey or normalizedName fallback
}
```

- Add `mergeGroceryItems` server action that:
  - accepts targetId and sourceIds
  - updates target item’s `mergedFrom` JSON to include source info
  - deletes source items
  - revalidates `/groceries`

**Step 4: Add UI wiring**

- Add a "Review duplicates" section in `/groceries` that renders groups.
- Add merge buttons via `<form action={mergeGroceryItems}>` with hidden inputs.
- Update `ItemRow` to show normalized name + source badge when available.

**Step 5: Run test to verify it passes**

Run: `npm --prefix client run test -- groceries-duplicates.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add client/lib/groceries-duplicates.ts client/app/(protected)/groceries/actions.ts client/app/(protected)/groceries/ItemRow.tsx client/app/(protected)/groceries/page.tsx client/tests/groceries-duplicates.test.ts

git commit -m "groceries duplicate review and merge"
```

### Task 5: Full test run

**Step 1: Run targeted test suite**

Run: `npm --prefix client run test -- groceries-helpers.test.ts groceries-actions.test.ts groceries-normalization.test.ts groceries-duplicates.test.ts`
Expected: PASS.

**Step 2: Commit any final fixes**

```bash
git add client/tests client/app client/lib

git commit -m "groceries g1-g3 polish"
```
