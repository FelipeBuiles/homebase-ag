# Grocery Normalization Batch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enqueue normalization for all grocery items missing `normalizedName` or `canonicalKey` and enqueue normalization for new recipe-derived items.

**Architecture:** Add a batch helper that queries unnormalized grocery items and enqueues jobs on the existing grocery queue. Extend the recipe→groceries helper to enqueue normalization for newly created grocery items.

**Tech Stack:** Next.js App Router, Prisma/Postgres, BullMQ, Vitest.

### Task 1: Batch helper to enqueue normalization

**Files:**
- Create: `client/lib/groceries-normalization-batch.ts`
- Test: `client/tests/groceries-normalization-batch.test.ts`

**Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("../lib/queue", () => ({
  groceryQueue: { add: vi.fn() },
}));

import { enqueueMissingGroceryNormalizations } from "../lib/groceries-normalization-batch";

describe("enqueueMissingGroceryNormalizations", () => {
  afterEach(async () => {
    const { groceryQueue } = await import("../lib/queue");
    vi.mocked(groceryQueue.add).mockClear();
    await resetDb();
  });

  it("enqueues items missing normalized fields", async () => {
    const list = await prisma.groceryList.create({ data: { name: "Groceries", isDefault: true } });
    const missing = await prisma.groceryItem.create({ data: { name: "Milk", listId: list.id } });
    await prisma.groceryItem.create({
      data: { name: "Eggs", listId: list.id, normalizedName: "Eggs", canonicalKey: "eggs" },
    });

    const count = await enqueueMissingGroceryNormalizations();

    const { groceryQueue } = await import("../lib/queue");
    expect(count).toBe(1);
    expect(vi.mocked(groceryQueue.add)).toHaveBeenCalledWith("created", {
      itemId: missing.id,
      name: "Milk",
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- groceries-normalization-batch.test.ts`
Expected: FAIL with missing module/function.

**Step 3: Write minimal implementation**

```ts
import prisma from "@/lib/prisma";
import { groceryQueue } from "@/lib/queue";

export async function enqueueMissingGroceryNormalizations() {
  const items = await prisma.groceryItem.findMany({
    where: {
      OR: [{ normalizedName: null }, { canonicalKey: null }],
    },
    select: { id: true, name: true },
  });

  for (const item of items) {
    await groceryQueue.add("created", { itemId: item.id, name: item.name });
  }

  return items.length;
}
```

**Step 4: Run test to verify it passes**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- groceries-normalization-batch.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/lib/groceries-normalization-batch.ts client/tests/groceries-normalization-batch.test.ts

git commit -m "groceries enqueue missing normalizations"
```

### Task 2: Enqueue normalization for new recipe-derived grocery items

**Files:**
- Modify: `client/lib/recipes-to-groceries.ts`
- Test: `client/tests/recipes-to-groceries.test.ts`

**Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("../lib/queue", () => ({
  groceryQueue: { add: vi.fn() },
}));

import { addRecipeIngredientsToGroceries } from "../lib/recipes-to-groceries";

describe("addRecipeIngredientsToGroceries queueing", () => {
  afterEach(async () => {
    const { groceryQueue } = await import("../lib/queue");
    vi.mocked(groceryQueue.add).mockClear();
    await resetDb();
  });

  it("enqueues normalization for new items", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "Soup",
        status: "ready",
        ingredients: { create: [{ name: "Carrots" }] },
      },
    });

    await addRecipeIngredientsToGroceries(recipe.id);

    const { groceryQueue } = await import("../lib/queue");
    expect(vi.mocked(groceryQueue.add)).toHaveBeenCalledWith("created", expect.objectContaining({
      name: "Carrots",
    }));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- recipes-to-groceries.test.ts`
Expected: FAIL with missing queue call.

**Step 3: Update recipe→groceries helper**

Add to the create path:

```ts
import { groceryQueue } from "@/lib/queue";

// after create
await groceryQueue.add("created", { itemId: created.id, name });
```

**Step 4: Run test to verify it passes**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- recipes-to-groceries.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/lib/recipes-to-groceries.ts client/tests/recipes-to-groceries.test.ts

git commit -m "recipes enqueue grocery normalization"
```

### Task 3: Full test run

**Step 1: Run targeted tests**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- groceries-normalization-batch.test.ts recipes-to-groceries.test.ts`
Expected: PASS.

**Step 2: Commit any final fixes**

```bash
git add client/lib client/tests

git commit -m "groceries normalization batch polish"
```
