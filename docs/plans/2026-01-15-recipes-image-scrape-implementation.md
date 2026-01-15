# Recipes Image Scrape Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Automatically scrape a recipe image from imported URLs and display it on recipe cards and detail headers.

**Architecture:** Extend the recipe parser agent to extract image metadata from HTML (JSON-LD → OpenGraph → content image) and store `imageUrl` on the recipe. Update UI to render images in list cards and detail header with placeholders when missing.

**Tech Stack:** Next.js (App Router), Prisma, BullMQ worker, Vitest/JSDOM, shadcn/ui.

## Task 1: Add image extraction helper with tests

**Files:**
- Create: `client/lib/recipe-image.ts`
- Create: `client/tests/recipe-image.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { extractRecipeImageUrl } from "../lib/recipe-image";

describe("extractRecipeImageUrl", () => {
  it("prefers JSON-LD image over og:image", () => {
    const html = `
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "Recipe",
        "image": "https://example.com/schema.jpg"
      }</script>
      <meta property="og:image" content="https://example.com/og.jpg" />
    `;

    expect(extractRecipeImageUrl(html, "https://example.com"))
      .toBe("https://example.com/schema.jpg");
  });

  it("falls back to og:image when JSON-LD missing", () => {
    const html = `<meta property="og:image" content="https://example.com/og.jpg" />`;

    expect(extractRecipeImageUrl(html, "https://example.com"))
      .toBe("https://example.com/og.jpg");
  });

  it("uses the first large content image when metadata missing", () => {
    const html = `
      <article>
        <img src="https://example.com/small.jpg" width="10" height="10" />
        <img src="/images/hero.jpg" width="900" height="600" />
      </article>
    `;

    expect(extractRecipeImageUrl(html, "https://example.com/recipes/1"))
      .toBe("https://example.com/images/hero.jpg");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipe-image.test.ts`
Expected: FAIL with "extractRecipeImageUrl is not a function" or module not found.

**Step 3: Write minimal implementation**

```ts
export function extractRecipeImageUrl(html: string, baseUrl?: string) {
  // parse JSON-LD for image, then og:image, then large <img>
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipe-image.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/lib/recipe-image.ts client/tests/recipe-image.test.ts
git commit -m "recipes image scrape helper"
```

## Task 2: Persist imageUrl during parsing

**Files:**
- Modify: `client/agents/recipe-parser.ts`
- Modify: `client/lib/recipes.ts`
- Modify: `client/tests/recipes-parser.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { applyParsedRecipe } from "../lib/recipes";

it("stores imageUrl when provided", async () => {
  // mock prisma update and assert imageUrl written
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-parser.test.ts`
Expected: FAIL because `imageUrl` not written.

**Step 3: Write minimal implementation**

- Add `imageUrl` to parsed payload type.
- In `applyParsedRecipe`, include `imageUrl` in `data` (only if current imageUrl is empty).
- In `recipe-parser`, call `extractRecipeImageUrl` and pass through to `applyParsedRecipe`.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-parser.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/agents/recipe-parser.ts client/lib/recipes.ts client/tests/recipes-parser.test.ts
git commit -m "recipes store scraped image"
```

## Task 3: Surface imageUrl in API and UI

**Files:**
- Modify: `client/app/api/recipes/[id]/route.ts`
- Modify: `client/app/(protected)/recipes/page.tsx`
- Modify: `client/app/(protected)/recipes/[id]/page.tsx`
- Create: `client/tests/recipes-images.test.tsx`

**Step 1: Write the failing test**

```ts
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

it("renders recipe image in list and detail", () => {
  // render list card and detail header with imageUrl
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-images.test.tsx`
Expected: FAIL (image not rendered).

**Step 3: Write minimal implementation**

- Include `imageUrl` in API response.
- Add thumbnail to recipe cards in list view.
- Add hero image block in detail header.
- Add placeholder block when no imageUrl.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-images.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add client/app/api/recipes/[id]/route.ts client/app/(protected)/recipes/page.tsx client/app/(protected)/recipes/[id]/page.tsx client/tests/recipes-images.test.tsx
git commit -m "recipes show scraped images"
```

## Task 4: Update polling behavior (if needed)

**Files:**
- Modify: `client/app/(protected)/recipes/RecipeModalForm.tsx`
- Modify: `client/app/(protected)/recipes/RecipesPolling.tsx`
- Test: `client/tests/recipes-polling.test.tsx`

**Step 1: Write the failing test**

```ts
// Add expectation that imageUrl update triggers UI refresh.
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- recipes-polling.test.tsx`
Expected: FAIL if polling ignores imageUrl updates.

**Step 3: Write minimal implementation**

- Ensure `imageUrl` is part of the response and UI uses it.
- No additional polling changes expected if current refresh is working.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- recipes-polling.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add client/app/(protected)/recipes/RecipeModalForm.tsx client/app/(protected)/recipes/RecipesPolling.tsx client/tests/recipes-polling.test.tsx
git commit -m "recipes refresh image state"
```
