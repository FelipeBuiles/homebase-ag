# Recipes R1–R3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an import-first Recipes modal with draft records, agent parsing, and structured ingredients/instructions.

**Architecture:** Create a draft Recipe record immediately on URL submit, enqueue a recipe-parser job, persist parsed fields back onto the recipe, and let the modal poll + auto-fill until the user edits. Final save promotes the draft to ready.

**Tech Stack:** Next.js App Router, Prisma (Postgres), BullMQ workers, Vitest.

---

### Task 1: Draft Recipe creation + queue integration

**Files:**
- Modify: `client/prisma/schema.prisma`
- Modify: `client/app/(protected)/recipes/actions.ts`
- Modify: `client/lib/queue.ts`
- Create: `client/tests/recipes-draft.test.ts`

**Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../lib/queue", () => ({ recipeQueue: { add: vi.fn() } }));

import { createRecipeDraft } from "../app/(protected)/recipes/actions";

describe("recipe drafts", () => {
  afterEach(async () => {
    const { recipeQueue } = await import("../lib/queue");
    vi.mocked(recipeQueue.add).mockClear();
    await resetDb();
  });

  it("creates a draft recipe and enqueues parsing", async () => {
    const recipe = await createRecipeDraft({
      sourceUrl: "https://example.com/recipe",
    });

    const stored = await prisma.recipe.findUnique({ where: { id: recipe.id } });
    expect(stored?.status).toBe("draft");
    expect(stored?.parsingStatus).toBe("pending");
    expect(stored?.sourceUrl).toBe("https://example.com/recipe");

    const { recipeQueue } = await import("../lib/queue");
    expect(vi.mocked(recipeQueue.add)).toHaveBeenCalledWith("parse", {
      recipeId: recipe.id,
      sourceUrl: "https://example.com/recipe",
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-draft.test.ts`
Expected: FAIL with "createRecipeDraft is not a function" and missing model fields.

**Step 3: Write minimal implementation**

- Update `client/prisma/schema.prisma`:
  - Add fields to `Recipe`:
    - `status String @default("draft")`
    - `parsingStatus String @default("idle")`
    - `parsingError String?`
    - `parsingUpdatedAt DateTime?`
- Add `createRecipeDraft` in `client/app/(protected)/recipes/actions.ts`:
  - Create recipe with `status: "draft"`, `parsingStatus: "pending"`, `sourceUrl`.
  - Enqueue `recipeQueue.add("parse", { recipeId, sourceUrl })`.
  - Return the recipe.
- Run prisma migration:
  - `npm --prefix client exec prisma migrate dev --name recipe-draft-status --schema client/prisma/schema.prisma`

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-draft.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/prisma/schema.prisma client/app/(protected)/recipes/actions.ts client/tests/recipes-draft.test.ts

git commit -m "recipes draft create"
```

---

### Task 2: Finalize Recipe + validation rules

**Files:**
- Modify: `client/app/(protected)/recipes/actions.ts`
- Create: `client/tests/recipes-finalize.test.ts`

**Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

import { finalizeRecipe } from "../app/(protected)/recipes/actions";

describe("recipe finalize", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("marks recipe ready when required fields exist", async () => {
    const recipe = await prisma.recipe.create({
      data: {
        name: "Test",
        instructions: "Step 1",
        ingredients: { create: [{ name: "Flour" }] },
        status: "draft",
      },
    });

    await finalizeRecipe(recipe.id);

    const stored = await prisma.recipe.findUnique({ where: { id: recipe.id } });
    expect(stored?.status).toBe("ready");
  });

  it("throws if required fields missing", async () => {
    const recipe = await prisma.recipe.create({
      data: { name: "Test", status: "draft" },
    });

    await expect(finalizeRecipe(recipe.id)).rejects.toThrow(/ingredients/i);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-finalize.test.ts`
Expected: FAIL with "finalizeRecipe is not a function".

**Step 3: Write minimal implementation**

- Add `finalizeRecipe(recipeId)` to `client/app/(protected)/recipes/actions.ts`:
  - Fetch recipe with ingredients.
  - Validate: name + at least 1 ingredient + instructions non-empty.
  - Update `status` to `"ready"`.
  - Revalidate `/recipes` and redirect to `/recipes/:id`.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-finalize.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/app/(protected)/recipes/actions.ts client/tests/recipes-finalize.test.ts

git commit -m "recipes finalize"
```

---

### Task 3: Parse persistence helper (auto-fill until edited)

**Files:**
- Create: `client/lib/recipes.ts`
- Create: `client/tests/recipes-merge.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { mergeParsedRecipe } from "../lib/recipes";

describe("mergeParsedRecipe", () => {
  it("applies parsed fields unless edited", () => {
    const current = {
      name: "",
      description: "",
      instructions: "",
      ingredients: [],
    };
    const parsed = {
      name: "Pasta",
      description: "Quick dinner",
      instructions: "Boil",
      ingredients: [{ name: "Pasta" }],
    };

    const result = mergeParsedRecipe(current, parsed, { name: true });
    expect(result.name).toBe("");
    expect(result.description).toBe("Quick dinner");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-merge.test.ts`
Expected: FAIL with "mergeParsedRecipe is not a function".

**Step 3: Write minimal implementation**

- Add `mergeParsedRecipe` in `client/lib/recipes.ts`:
  - Accept current values, parsed values, and an edited map.
  - For each field, apply parsed only when `edited[field] !== true`.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-merge.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/lib/recipes.ts client/tests/recipes-merge.test.ts

git commit -m "recipes merge helper"
```

---

### Task 4: Recipe parser worker updates

**Files:**
- Modify: `client/agents/recipe-parser.ts`
- Create: `client/tests/recipes-parser.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("../lib/ai", () => ({ runAgentPrompt: vi.fn() }));

import { applyParsedRecipe } from "../lib/recipes";

describe("recipe parser", () => {
  it("stores parsed fields and marks parsing filled", async () => {
    const recipe = await prisma.recipe.create({ data: { name: "", status: "draft" } });
    const parsed = {
      name: "Soup",
      description: "Warm",
      ingredients: ["Water"],
      instructions: ["Boil"],
    };

    await applyParsedRecipe(recipe.id, parsed);

    const stored = await prisma.recipe.findUnique({ where: { id: recipe.id }, include: { ingredients: true } });
    expect(stored?.name).toBe("Soup");
    expect(stored?.parsingStatus).toBe("filled");
    expect(stored?.ingredients.length).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-parser.test.ts`
Expected: FAIL with missing `applyParsedRecipe`.

**Step 3: Write minimal implementation**

- Add `applyParsedRecipe` in `client/lib/recipes.ts`:
  - Update recipe name/description/instructions and replace ingredients.
  - Set `parsingStatus` to `"filled"` and `parsingUpdatedAt`.
- Update `client/agents/recipe-parser.ts`:
  - Fetch recipe by ID.
  - Fetch URL content if missing (use `fetch(sourceUrl)` and strip basic text).
  - Call `runAgentPrompt("agent_recipe_parser", content)`.
  - Call `applyParsedRecipe`.
  - On errors, update `parsingStatus: "error"`, set `parsingError`.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-parser.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/agents/recipe-parser.ts client/lib/recipes.ts client/tests/recipes-parser.test.ts

git commit -m "recipes parser persistence"
```

---

### Task 5: Modal UI + polling + routing

**Files:**
- Modify: `client/app/(protected)/recipes/page.tsx`
- Modify: `client/app/(protected)/recipes/[id]/page.tsx`
- Modify: `client/app/(protected)/recipes/new/page.tsx`
- Create: `client/app/(protected)/recipes/RecipeModal.tsx`
- Create: `client/app/(protected)/recipes/RecipeModalForm.tsx`
- Modify: `client/app/globals.css`
- Create: `client/components/ui/dialog.tsx`
- Create: `client/tests/recipes-format.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { formatInstructionSteps } from "../lib/recipes";

describe("formatInstructionSteps", () => {
  it("splits a block into steps", () => {
    const steps = formatInstructionSteps("Mix. Bake.");
    expect(steps).toEqual(["Mix.", "Bake."]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-format.test.ts`
Expected: FAIL with missing `formatInstructionSteps`.

**Step 3: Write minimal implementation**

- Add `formatInstructionSteps` to `client/lib/recipes.ts`.
- Build a centered modal in `client/components/ui/dialog.tsx` (portal + overlay + content).
- Add `RecipeModal` and `RecipeModalForm` client components:
  - URL-first input with “Add without a URL”.
  - Stepper + progress bar states.
  - Poll draft recipe via a simple `/api/recipes/:id` route or server action fetch.
  - Apply `mergeParsedRecipe` results unless field edited.
  - Ingredients hybrid editor and instruction steps list.
- Update `client/app/(protected)/recipes/page.tsx`:
  - Replace `/recipes/new` links with modal trigger.
  - Update empty state with URL input + modal trigger.
- Update `client/app/(protected)/recipes/[id]/page.tsx`:
  - Tighten instruction styling and ingredients list rows.
- Update `client/app/(protected)/recipes/new/page.tsx` to redirect to `/recipes`.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-format.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/app/(protected)/recipes/page.tsx client/app/(protected)/recipes/new/page.tsx client/app/(protected)/recipes/RecipeModal.tsx client/app/(protected)/recipes/RecipeModalForm.tsx client/components/ui/dialog.tsx client/app/globals.css client/lib/recipes.ts client/tests/recipes-format.test.ts

git commit -m "recipes modal ui"
```

---

### Task 6: Recipe polling endpoint

**Files:**
- Create: `client/app/api/recipes/[id]/route.ts`
- Create: `client/tests/recipes-api.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { GET } from "../app/api/recipes/[id]/route";

describe("recipes api", () => {
  it("returns 404 for missing recipe", async () => {
    const request = new Request("http://localhost/api/recipes/missing");
    const res = await GET(request, { params: { id: "missing" } });
    expect(res.status).toBe(404);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-api.test.ts`
Expected: FAIL (route missing).

**Step 3: Write minimal implementation**

- Add route handler that returns recipe + ingredients and parse status.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-api.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/app/api/recipes/[id]/route.ts client/tests/recipes-api.test.ts

git commit -m "recipes poll api"
```

---

## Testing
- Unit tests: `npm --prefix client run test -- recipes-*.test.ts`
- Full suite: `npm --prefix client run test`

## Notes
- This plan assumes auto-fill until edited, with no DB-level field locks.
- `/recipes/new` must redirect to `/recipes`.
- UI should remain warm, centered modal, and consistent with existing dialog styles.
