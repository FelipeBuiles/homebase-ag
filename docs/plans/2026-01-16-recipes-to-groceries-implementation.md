# Recipes → Groceries Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an explicit “Add ingredients to groceries” action on recipe cards and recipe detail pages, merging ingredients into the default grocery list by canonical key.

**Architecture:** Implement a domain helper that converts recipe ingredients into grocery items, using `buildCanonicalKey` and the default grocery list. A server action calls this helper and returns summary counts. A client button component triggers the action with toast feedback, used in both list and detail UIs.

**Tech Stack:** Next.js App Router (server actions + client components), Prisma/Postgres, Vitest, Sonner.

### Task 1: Domain helper for recipe → groceries merge

**Files:**
- Create: `client/lib/recipes-to-groceries.ts`
- Test: `client/tests/recipes-to-groceries.test.ts`

**Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";
import { addRecipeIngredientsToGroceries } from "../lib/recipes-to-groceries";

describe("addRecipeIngredientsToGroceries", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("merges ingredients by canonical key", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "Soup",
        status: "ready",
        ingredients: { create: [{ name: "Green onions" }] },
      },
      include: { ingredients: true },
    });

    const list = await prisma.groceryList.create({ data: { name: "Groceries", isDefault: true } });
    await prisma.groceryItem.create({
      data: { name: "Scallion", canonicalKey: "scallion", listId: list.id, source: "manual" },
    });

    const result = await addRecipeIngredientsToGroceries(recipe.id);

    const items = await prisma.groceryItem.findMany({ where: { listId: list.id } });
    expect(items).toHaveLength(1);
    expect(result.addedCount).toBe(0);
    expect(result.mergedCount).toBe(1);
  });

  it("no-ops when recipe has no ingredients", async () => {
    const recipe = await prisma.recipe.create({ data: { name: "Toast", status: "ready" } });
    const result = await addRecipeIngredientsToGroceries(recipe.id);
    expect(result.addedCount).toBe(0);
    expect(result.mergedCount).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- recipes-to-groceries.test.ts`
Expected: FAIL with missing module/function.

**Step 3: Write minimal implementation**

```ts
import prisma from "@/lib/prisma";
import { getOrCreateDefaultGroceryList, buildCanonicalKey } from "@/lib/groceries";

export async function addRecipeIngredientsToGroceries(recipeId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: true },
  });
  if (!recipe || recipe.ingredients.length === 0) {
    return { addedCount: 0, mergedCount: 0 };
  }

  const list = await getOrCreateDefaultGroceryList();

  let addedCount = 0;
  let mergedCount = 0;

  for (const ingredient of recipe.ingredients) {
    const name = ingredient.name?.trim() || "";
    if (!name) continue;

    const canonicalKey = buildCanonicalKey(name);
    const existing = await prisma.groceryItem.findFirst({
      where: { listId: list.id, canonicalKey },
    });

    const quantity = [ingredient.quantity, ingredient.unit].filter(Boolean).join(" ").trim();

    if (existing) {
      mergedCount += 1;
      const mergedFrom = [
        ...(Array.isArray(existing.mergedFrom) ? existing.mergedFrom : []),
        { recipeId, name, quantity },
      ];
      await prisma.groceryItem.update({
        where: { id: existing.id },
        data: {
          mergedFrom,
          quantity: existing.quantity || quantity || null,
        },
      });
      continue;
    }

    await prisma.groceryItem.create({
      data: {
        name,
        normalizedName: name,
        canonicalKey,
        quantity: quantity || null,
        listId: list.id,
        source: "recipe",
      },
    });

    addedCount += 1;
  }

  return { addedCount, mergedCount };
}
```

**Step 4: Run test to verify it passes**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- recipes-to-groceries.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/lib/recipes-to-groceries.ts client/tests/recipes-to-groceries.test.ts

git commit -m "recipes add ingredients to groceries helper"
```

### Task 2: Server action wrapper

**Files:**
- Modify: `client/app/(protected)/recipes/actions.ts`
- Test: `client/tests/recipes-to-groceries-actions.test.ts`

**Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";
import { addRecipeIngredientsToGroceriesAction } from "../app/(protected)/recipes/actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("addRecipeIngredientsToGroceriesAction", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("adds ingredients to the default list", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "Pasta",
        status: "ready",
        ingredients: { create: [{ name: "Tomatoes" }] },
      },
    });

    const result = await addRecipeIngredientsToGroceriesAction(recipe.id);

    const list = await prisma.groceryList.findFirst({ where: { isDefault: true } });
    const items = await prisma.groceryItem.findMany({ where: { listId: list!.id } });
    expect(items).toHaveLength(1);
    expect(result.addedCount).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- recipes-to-groceries-actions.test.ts`
Expected: FAIL with missing export.

**Step 3: Implement server action**

```ts
import { addRecipeIngredientsToGroceries } from "@/lib/recipes-to-groceries";

export async function addRecipeIngredientsToGroceriesAction(recipeId: string) {
  const result = await addRecipeIngredientsToGroceries(recipeId);
  revalidatePath("/groceries");
  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- recipes-to-groceries-actions.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/app/(protected)/recipes/actions.ts client/tests/recipes-to-groceries-actions.test.ts

git commit -m "recipes add to groceries action"
```

### Task 3: Client button + recipes list wiring

**Files:**
- Create: `client/app/(protected)/recipes/AddToGroceriesButton.tsx`
- Modify: `client/app/(protected)/recipes/page.tsx`
- Test: `client/tests/recipes-add-to-groceries-button.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { AddToGroceriesButton } from "../app/(protected)/recipes/AddToGroceriesButton";

vi.mock("../app/(protected)/recipes/actions", () => ({
  addRecipeIngredientsToGroceriesAction: vi.fn(),
}));

describe("AddToGroceriesButton", () => {
  it("renders the add button", () => {
    render(<AddToGroceriesButton recipeId="abc" />);
    expect(screen.getByRole("button", { name: /add to groceries/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-add-to-groceries-button.test.tsx`
Expected: FAIL with missing module.

**Step 3: Implement client button and wire list page**

```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { addRecipeIngredientsToGroceriesAction } from "./actions";

export function AddToGroceriesButton({ recipeId, label = "Add to groceries" }: { recipeId: string; label?: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const result = await addRecipeIngredientsToGroceriesAction(recipeId);
        toast.success("Added to groceries", {
          description: `Added ${result.addedCount}, merged ${result.mergedCount}.`,
        });
      } catch {
        toast.error("Could not add ingredients");
      }
    });
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={isPending}>
      {label}
    </Button>
  );
}
```

Update `client/app/(protected)/recipes/page.tsx` (non-plan selection branch) to render this button in each card, e.g., under the ingredient count.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-add-to-groceries-button.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/app/(protected)/recipes/AddToGroceriesButton.tsx client/app/(protected)/recipes/page.tsx client/tests/recipes-add-to-groceries-button.test.tsx

git commit -m "recipes add to groceries button"
```

### Task 4: Recipe detail wiring

**Files:**
- Modify: `client/app/(protected)/recipes/[id]/page.tsx`
- Test: `client/tests/recipes-detail-add-to-groceries.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import RecipeDetailPage from "../app/(protected)/recipes/[id]/page";

vi.mock("../app/(protected)/recipes/actions", () => ({
  deleteRecipe: vi.fn(),
}));

vi.mock("../app/(protected)/recipes/AddToGroceriesButton", () => ({
  AddToGroceriesButton: () => <button>Add to groceries</button>,
}));

vi.mock("../lib/prisma", () => ({
  default: {
    recipe: {
      findUnique: vi.fn(async () => ({
        id: "r1",
        name: "Soup",
        status: "ready",
        parsingStatus: "filled",
        ingredients: [],
      })),
    },
  },
}));

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));

it("renders add to groceries action", async () => {
  render(await RecipeDetailPage({ params: Promise.resolve({ id: "r1" }) }));
  expect(screen.getByRole("button", { name: /add to groceries/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-detail-add-to-groceries.test.tsx`
Expected: FAIL with missing button.

**Step 3: Update detail page UI**

Add `<AddToGroceriesButton recipeId={recipe.id} />` in the header actions when the recipe is not pending.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-detail-add-to-groceries.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/app/(protected)/recipes/[id]/page.tsx client/tests/recipes-detail-add-to-groceries.test.tsx

git commit -m "recipes detail add to groceries action"
```

### Task 5: Full test run

**Step 1: Run targeted tests**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- recipes-to-groceries.test.ts recipes-to-groceries-actions.test.ts recipes-add-to-groceries-button.test.tsx recipes-detail-add-to-groceries.test.tsx`
Expected: PASS.

**Step 2: Commit any final fixes**

```bash
git add client/app client/lib client/tests

git commit -m "recipes to groceries polish"
```
