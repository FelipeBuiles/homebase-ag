# Groceries Quick Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add top-of-page quick actions for filtering and clearing grocery items.

**Architecture:** Use client-side state for filters and server actions for clear operations. A small client component renders the action bar and filters the visible list.

**Tech Stack:** Next.js App Router, Prisma/Postgres, Vitest.

### Task 1: Clear actions (checked/all)

**Files:**
- Modify: `client/app/(protected)/groceries/actions.ts`
- Test: `client/tests/groceries-clear-actions.test.ts`

**Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";
import { clearCheckedItems, clearAllItems } from "../app/(protected)/groceries/actions";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const createListWithItems = async () => {
  const list = await prisma.groceryList.create({ data: { name: "Groceries", isDefault: true } });
  await prisma.groceryItem.create({ data: { name: "Milk", listId: list.id, isChecked: true } });
  await prisma.groceryItem.create({ data: { name: "Eggs", listId: list.id, isChecked: false } });
  return list;
};

describe("groceries clear actions", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("clears checked items", async () => {
    const list = await createListWithItems();
    await clearCheckedItems();
    const items = await prisma.groceryItem.findMany({ where: { listId: list.id } });
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Eggs");
  });

  it("clears all items", async () => {
    const list = await createListWithItems();
    await clearAllItems();
    const items = await prisma.groceryItem.findMany({ where: { listId: list.id } });
    expect(items).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- groceries-clear-actions.test.ts`
Expected: FAIL with missing exports.

**Step 3: Implement server actions**

Add to `actions.ts`:

```ts
export async function clearCheckedItems() {
  const list = await getOrCreateDefaultGroceryList();
  await prisma.groceryItem.deleteMany({ where: { listId: list.id, isChecked: true } });
  revalidatePath("/groceries");
}

export async function clearAllItems() {
  const list = await getOrCreateDefaultGroceryList();
  await prisma.groceryItem.deleteMany({ where: { listId: list.id } });
  revalidatePath("/groceries");
}
```

**Step 4: Run test to verify it passes**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- groceries-clear-actions.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/app/(protected)/groceries/actions.ts client/tests/groceries-clear-actions.test.ts

git commit -m "groceries clear actions"
```

### Task 2: Quick actions UI (filters + clear buttons)

**Files:**
- Create: `client/app/(protected)/groceries/QuickActions.tsx`
- Modify: `client/app/(protected)/groceries/page.tsx`
- Test: `client/tests/groceries-quick-actions.test.tsx`

**Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QuickActions } from "../app/(protected)/groceries/QuickActions";

describe("QuickActions", () => {
  it("renders clear buttons and filters", () => {
    render(<QuickActions items={[]} onFilterChange={() => {}} />);
    expect(screen.getByRole("button", { name: /clear checked/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /clear all/i })).toBeTruthy();
    expect(screen.getByText(/remaining/i)).toBeTruthy();
    expect(screen.getByText(/checked/i)).toBeTruthy();
    expect(screen.getByText(/source/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- groceries-quick-actions.test.tsx`
Expected: FAIL with missing component.

**Step 3: Implement QuickActions component**

- Render status filter pills (All/Remaining/Checked) with counts.
- Render source filter pills (All/Manual/Recipe/Agent).
- Provide Clear Checked / Clear All buttons (Clear All uses confirm).
- Accept `items` array and `onFilterChange` callback.

**Step 4: Wire into `/groceries` page**

- Add client-side state for filters.
- Filter `list.items` before rendering based on status and source.
- Insert `<QuickActions />` above the add-item form.

**Step 5: Run test to verify it passes**

Run: `npm --prefix client run test -- groceries-quick-actions.test.tsx`
Expected: PASS.

**Step 6: Commit**

```bash
git add client/app/(protected)/groceries/QuickActions.tsx client/app/(protected)/groceries/page.tsx client/tests/groceries-quick-actions.test.tsx

git commit -m "groceries quick actions bar"
```

### Task 3: Full test run

**Step 1: Run targeted tests**

Run: `DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/homebase" npm --prefix client run test -- groceries-clear-actions.test.ts groceries-quick-actions.test.tsx`
Expected: PASS.

**Step 2: Commit any final fixes**

```bash
git add client/app client/tests

git commit -m "groceries quick actions polish"
```
