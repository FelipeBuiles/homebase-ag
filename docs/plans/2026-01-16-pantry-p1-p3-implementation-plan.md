# Pantry P1–P3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver pantry tracking, expiration awareness, and maintenance agent with agent-first wiring and UI updates, including cross-communication with groceries, meal plans, and inventory.

**Architecture:** Extend the pantry data model (status, opened date, location, inventory link, warning window) and centralize expiration logic in shared helpers used by UI and agents. Agents emit proposals through the review framework and rely on shared filters for status + warning window. UI surfaces include pantry list, expiring view, and pantry settings with utility-first styling per @design-principles.

**Tech Stack:** Next.js App Router, Prisma, BullMQ, Vitest, shadcn/ui components.

---

### Task 1: Add pantry warning window config default

**Files:**
- Create: `client/tests/settings/pantry-warning-window.test.ts`
- Modify: `client/lib/settings.ts`
- Modify: `client/prisma/schema.prisma`

**Step 1: Write the failing test**

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";
import { getAppConfig } from "@/lib/settings";

const ORIGINAL_ENV = { ...process.env };

describe("pantry warning window defaults", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    await resetDb();
  });

  afterEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    await resetDb();
  });

  it("sets default warning days when config is missing", async () => {
    const config = await getAppConfig();
    expect((config as Record<string, unknown>).pantryWarningDays).toBe(7);
  });

  it("does not override existing warning window", async () => {
    await prisma.appConfig.create({
      data: { id: "app", pantryWarningDays: 3 },
    });

    const config = await getAppConfig();
    expect((config as Record<string, unknown>).pantryWarningDays).toBe(3);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/settings/pantry-warning-window.test.ts`
Expected: FAIL because `pantryWarningDays` does not exist / is undefined.

**Step 3: Write minimal implementation**

```prisma
model AppConfig {
  id                String   @id
  setupComplete     Boolean  @default(false)
  passwordHash      String?
  passwordSalt      String?
  llmProvider       String?  @default("ollama")
  llmBaseUrl        String?  @default("http://localhost:11434")
  llmApiKey         String?
  llmModel          String?
  llmVisionModel    String?
  pantryWarningDays Int      @default(7)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

```ts
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
```

Run migration: `npm --prefix client run prisma:migrate -- --name pantry-warning-window`

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/settings/pantry-warning-window.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/prisma/schema.prisma client/lib/settings.ts client/tests/settings/pantry-warning-window.test.ts
git commit -m "pantry warning window config"
```

---

### Task 2: Add pantry item status + linkage fields to schema

**Files:**
- Modify: `client/prisma/schema.prisma`

**Step 1: Write the failing test**

```ts
// client/tests/pantry/pantry-schema.test.ts
import { describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";

// Ensures runtime reads include the new fields.
// This will fail until the migration adds the columns.

describe("pantry schema", () => {
  it("reads status and location fields", async () => {
    const item = await prisma.pantryItem.create({
      data: {
        name: "Rice",
        quantity: "1",
        unit: "bag",
        location: "Pantry",
        status: "in_stock",
      },
    });

    const fetched = await prisma.pantryItem.findUnique({ where: { id: item.id } });
    expect(fetched?.status).toBe("in_stock");
    expect(fetched?.location).toBe("Pantry");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-schema.test.ts`
Expected: FAIL because columns do not exist.

**Step 3: Write minimal implementation**

```prisma
model PantryItem {
  id             String   @id @default(uuid())
  name           String
  description    String?
  quantity       String?
  unit           String?
  location       String
  expirationDate DateTime?
  openedDate     DateTime?
  category       String?
  status         String   @default("in_stock")
  statusUpdatedAt DateTime @default(now())

  inventoryItemId String?
  inventoryItem   InventoryItem? @relation(fields: [inventoryItemId], references: [id])

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model GroceryItem {
  id          String   @id @default(uuid())
  name        String
  category    String?
  quantity    String?
  isChecked   Boolean  @default(false)
  normalizedName    String?
  canonicalKey      String?
  source            GroceryItemSource @default(manual)
  suggestedCategory String?
  mergedFrom        Json?

  pantryItemId String?
  pantryItem   PantryItem? @relation(fields: [pantryItemId], references: [id])

  listId      String
  list        GroceryList @relation(fields: [listId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Run migration: `npm --prefix client run prisma:migrate -- --name pantry-status-and-links`

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/prisma/schema.prisma client/tests/pantry/pantry-schema.test.ts
git commit -m "pantry item status and links"
```

---

### Task 3: Add shared expiration helpers

**Files:**
- Create: `client/lib/pantry/expiration.ts`
- Create: `client/tests/pantry/pantry-expiration.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getEffectiveExpirationDate, getExpirationStatus } from "@/lib/pantry/expiration";

const today = new Date("2026-01-01T00:00:00.000Z");

describe("pantry expiration helpers", () => {
  it("prefers opened date when provided", () => {
    const expiration = new Date("2026-01-10T00:00:00.000Z");
    const opened = new Date("2025-12-28T00:00:00.000Z");
    expect(getEffectiveExpirationDate(expiration, opened)?.toISOString()).toBe(opened.toISOString());
  });

  it("returns expiring soon status", () => {
    const expiration = new Date("2026-01-03T00:00:00.000Z");
    const status = getExpirationStatus(expiration, today, 3);
    expect(status.label).toBe("Expiring Soon");
    expect(status.level).toBe("warning");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-expiration.test.ts`
Expected: FAIL because helper does not exist.

**Step 3: Write minimal implementation**

```ts
export type ExpirationStatusLevel = "good" | "warning" | "expired" | "unknown";

export const getEffectiveExpirationDate = (expirationDate?: Date | null, openedDate?: Date | null) => {
  if (openedDate) return openedDate;
  return expirationDate ?? null;
};

export const getExpirationStatus = (expirationDate: Date | null, now: Date, warningDays: number) => {
  if (!expirationDate) return { label: "Unknown", level: "unknown" as ExpirationStatusLevel, days: null };
  const diffMs = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", level: "expired" as const, days: diffDays };
  if (diffDays <= warningDays) return { label: "Expiring Soon", level: "warning" as const, days: diffDays };
  return { label: "Good", level: "good" as const, days: diffDays };
};
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-expiration.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/lib/pantry/expiration.ts client/tests/pantry/pantry-expiration.test.ts
git commit -m "pantry expiration helpers"
```

---

### Task 4: Add pantry grouping helper

**Files:**
- Create: `client/lib/pantry/grouping.ts`
- Create: `client/tests/pantry/pantry-grouping.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { groupPantryItemsByCategory } from "@/lib/pantry/grouping";

describe("groupPantryItemsByCategory", () => {
  it("groups by category with fallback", () => {
    const grouped = groupPantryItemsByCategory([
      { id: "1", name: "Rice", category: "Grains" },
      { id: "2", name: "Salt", category: null },
    ]);

    expect(grouped[0].category).toBe("Grains");
    expect(grouped[1].category).toBe("Uncategorized");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-grouping.test.ts`
Expected: FAIL because helper does not exist.

**Step 3: Write minimal implementation**

```ts
type PantryGroupItem = { id: string; name: string; category: string | null };

type PantryGroup = { category: string; items: PantryGroupItem[] };

export const groupPantryItemsByCategory = (items: PantryGroupItem[]): PantryGroup[] => {
  const groups = new Map<string, PantryGroupItem[]>();
  for (const item of items) {
    const category = item.category?.trim() || "Uncategorized";
    const list = groups.get(category) ?? [];
    list.push(item);
    groups.set(category, list);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, groupItems]) => ({ category, items: groupItems }));
};
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-grouping.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/lib/pantry/grouping.ts client/tests/pantry/pantry-grouping.test.ts
git commit -m "pantry grouping helper"
```

---

### Task 5: Expand pantry actions for create/update/status

**Files:**
- Modify: `client/app/(protected)/pantry/actions.ts`
- Create: `client/tests/pantry/pantry-actions.test.ts`

**Step 1: Write the failing test**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { createPantryItem, updatePantryItemStatus } from "@/app/(protected)/pantry/actions";

describe("pantry actions", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("creates pantry items with status and location", async () => {
    const form = new FormData();
    form.set("name", "Rice");
    form.set("quantity", "1");
    form.set("unit", "bag");
    form.set("location", "Pantry");
    form.set("status", "in_stock");

    await createPantryItem(form);

    const item = await prisma.pantryItem.findFirst();
    expect(item?.status).toBe("in_stock");
    expect(item?.location).toBe("Pantry");
  });

  it("updates pantry status and timestamp", async () => {
    const item = await prisma.pantryItem.create({
      data: {
        name: "Milk",
        quantity: "1",
        unit: "carton",
        location: "Fridge",
        status: "in_stock",
      },
    });

    await updatePantryItemStatus(item.id, "consumed");

    const updated = await prisma.pantryItem.findUnique({ where: { id: item.id } });
    expect(updated?.status).toBe("consumed");
    expect(updated?.statusUpdatedAt).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-actions.test.ts`
Expected: FAIL because action fields are missing.

**Step 3: Write minimal implementation**

```ts
export async function createPantryItem(formData: FormData) {
  const name = formData.get("name") as string;
  const quantity = formData.get("quantity") as string;
  const unit = formData.get("unit") as string;
  const expirationDateStr = formData.get("expirationDate") as string;
  const openedDateStr = formData.get("openedDate") as string;
  const category = formData.get("category") as string;
  const location = formData.get("location") as string;
  const status = (formData.get("status") as string) || "in_stock";
  const inventoryItemId = formData.get("inventoryItemId") as string;

  if (!name || !location) return;

  await prisma.pantryItem.create({
    data: {
      name,
      quantity: quantity || null,
      unit: unit || null,
      category: category || null,
      location,
      status,
      inventoryItemId: inventoryItemId || null,
      expirationDate: expirationDateStr ? new Date(expirationDateStr) : null,
      openedDate: openedDateStr ? new Date(openedDateStr) : null,
    },
  });

  revalidatePath("/pantry");
  redirect("/pantry");
}

export async function updatePantryItemStatus(id: string, status: string) {
  await prisma.pantryItem.update({
    where: { id },
    data: { status, statusUpdatedAt: new Date() },
  });
  revalidatePath("/pantry");
  revalidatePath("/pantry/expiring");
}
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-actions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/app/(protected)/pantry/actions.ts client/tests/pantry/pantry-actions.test.ts
git commit -m "pantry actions update"
```

---

### Task 6: Add expiring pantry query helper

**Files:**
- Create: `client/lib/pantry/queries.ts`
- Create: `client/tests/pantry/pantry-queries.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getExpiringWindow } from "@/lib/pantry/queries";

const now = new Date("2026-01-01T00:00:00.000Z");

describe("getExpiringWindow", () => {
  it("returns date range for warning days", () => {
    const { start, end } = getExpiringWindow(now, 3);
    expect(start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-01-04T00:00:00.000Z");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-queries.test.ts`
Expected: FAIL because helper does not exist.

**Step 3: Write minimal implementation**

```ts
export const getExpiringWindow = (now: Date, warningDays: number) => {
  const start = new Date(now);
  const end = new Date(now);
  end.setDate(end.getDate() + warningDays);
  return { start, end };
};
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-queries.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/lib/pantry/queries.ts client/tests/pantry/pantry-queries.test.ts
git commit -m "pantry expiring window helper"
```

---

### Task 7: Update expiration agent to use warning window + status

**Files:**
- Modify: `client/agents/expiration.ts`
- Modify: `client/lib/agent-prompts.ts`
- Modify: `client/lib/ai.ts`
- Modify: `client/tests/ai/ai.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { parseAgentResponse } from "@/lib/ai";

describe("parseAgentResponse", () => {
  it("parses pantry maintenance payload", () => {
    const raw = `{"actions":[{"type":"mark","pantryItemId":"p1","status":"out_of_stock","confidence":0.8,"rationale":"stale"}]}`;
    const result = parseAgentResponse("agent_pantry_maintenance" as never, raw);
    expect(result).toEqual({
      actions: [
        { type: "mark", pantryItemId: "p1", status: "out_of_stock", confidence: 0.8, rationale: "stale" },
      ],
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/ai/ai.test.ts`
Expected: FAIL because agent is unknown.

**Step 3: Write minimal implementation**

```ts
export type AgentId =
  | "agent_normalization"
  | "agent_enrichment"
  | "agent_chef"
  | "agent_expiration"
  | "agent_pantry_maintenance"
  | "agent_recipe_parser";
```

```ts
{
  agentId: "agent_pantry_maintenance",
  label: "Pantry Maintenance",
  defaultModel: "qwen3:8b",
  defaultPrompt: `You suggest pantry maintenance actions.
Return JSON only: {"actions":[{"type":"mark","pantryItemId":string,"status":"out_of_stock"|"discarded","confidence":number,"rationale":string}]}.`
}
```

```ts
case "agent_pantry_maintenance": {
  const actions = (data as { actions?: unknown }).actions;
  if (!Array.isArray(actions)) return null;
  const normalized = actions
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      type: typeof (entry as { type?: unknown }).type === "string" ? (entry as { type: string }).type : null,
      pantryItemId:
        typeof (entry as { pantryItemId?: unknown }).pantryItemId === "string"
          ? (entry as { pantryItemId: string }).pantryItemId
          : null,
      status:
        typeof (entry as { status?: unknown }).status === "string"
          ? (entry as { status: string }).status
          : null,
      confidence:
        typeof (entry as { confidence?: unknown }).confidence === "number"
          ? (entry as { confidence: number }).confidence
          : undefined,
      rationale:
        typeof (entry as { rationale?: unknown }).rationale === "string"
          ? (entry as { rationale: string }).rationale
          : undefined,
    }))
    .filter((entry) => entry.type && entry.pantryItemId && entry.status);

  return { actions: normalized };
}
```

Update `client/agents/expiration.ts` to use `pantryWarningDays`, filter `status=in_stock`, and include `openedDate` in prompt input.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/ai/ai.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/lib/agent-prompts.ts client/lib/ai.ts client/tests/ai/ai.test.ts client/agents/expiration.ts
git commit -m "pantry maintenance agent prompt"
```

---

### Task 8: Add pantry maintenance agent worker + queue

**Files:**
- Create: `client/agents/pantry-maintenance.ts`
- Modify: `client/lib/queue.ts`
- Create: `client/lib/pantry/maintenance.ts`
- Create: `client/tests/pantry/pantry-maintenance.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildPantryMaintenanceInput } from "@/lib/pantry/maintenance";

describe("pantry maintenance input", () => {
  it("builds a compact summary", () => {
    const input = buildPantryMaintenanceInput([
      { id: "1", name: "Rice", status: "out_of_stock" },
    ]);
    expect(input).toContain("Rice");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-maintenance.test.ts`
Expected: FAIL because helper does not exist.

**Step 3: Write minimal implementation**

```ts
type MaintenanceInputItem = { id: string; name: string; status: string };

export const buildPantryMaintenanceInput = (items: MaintenanceInputItem[]) => {
  return items.map((item) => `${item.id}: ${item.name} (${item.status})`).join("\n");
};
```

Create `client/agents/pantry-maintenance.ts` with a BullMQ worker that:
- loads stale/out-of-stock items
- runs `runAgentPrompt("agent_pantry_maintenance", input)`
- creates proposals for each action in response

Add `maintenanceQueue` export in `client/lib/queue.ts`.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-maintenance.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/agents/pantry-maintenance.ts client/lib/queue.ts client/lib/pantry/maintenance.ts client/tests/pantry/pantry-maintenance.test.ts
git commit -m "pantry maintenance worker"
```

---

### Task 9: Wire scheduled + manual maintenance triggers

**Files:**
- Modify: `client/app/(protected)/pantry/actions.ts`
- Modify: `client/app/(protected)/pantry/page.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/queue", () => ({ maintenanceQueue: { add: vi.fn() } }));

import { runPantryMaintenance } from "@/app/(protected)/pantry/actions";

it("queues a maintenance job", async () => {
  await runPantryMaintenance();
  const { maintenanceQueue } = await import("@/lib/queue");
  expect(maintenanceQueue.add).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-actions.test.ts`
Expected: FAIL because action does not exist.

**Step 3: Write minimal implementation**

```ts
import { maintenanceQueue } from "@/lib/queue";

export async function runPantryMaintenance() {
  await maintenanceQueue.add("pantry-maintenance", {}, { removeOnComplete: true });
  revalidatePath("/pantry");
}
```

Add a "Run maintenance" button on `/pantry` that posts to `runPantryMaintenance`.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-actions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/app/(protected)/pantry/actions.ts client/app/(protected)/pantry/page.tsx
git commit -m "pantry maintenance trigger"
```

---

### Task 10: Update pantry list UI to new model + grouping

**Files:**
- Modify: `client/app/(protected)/pantry/page.tsx`
- Create: `client/components/pantry/PantryStatusBadge.tsx`
- Create: `client/components/pantry/PantryItemRow.tsx`
- Modify: `client/components/ui/badge.tsx`

**Step 1: Write the failing test**

```ts
// client/tests/pantry/pantry-ui.test.ts
import { describe, expect, it } from "vitest";
import { groupPantryItemsByCategory } from "@/lib/pantry/grouping";

describe("pantry UI grouping", () => {
  it("puts uncategorized last", () => {
    const grouped = groupPantryItemsByCategory([
      { id: "1", name: "Rice", category: "Grains" },
      { id: "2", name: "Salt", category: null },
    ]);

    expect(grouped[grouped.length - 1]?.category).toBe("Uncategorized");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-ui.test.ts`
Expected: FAIL until helper ordering is updated in Task 4.

**Step 3: Write minimal implementation**

Update `groupPantryItemsByCategory` to sort so `Uncategorized` is last.

Update pantry UI to:
- Group by category
- Use `PantryStatusBadge`
- Use expiration helpers
- Provide inline quick actions

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-ui.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/app/(protected)/pantry/page.tsx client/components/pantry/PantryStatusBadge.tsx client/components/pantry/PantryItemRow.tsx client/components/ui/badge.tsx client/tests/pantry/pantry-ui.test.ts
git commit -m "pantry list ui refresh"
```

---

### Task 11: Add pantry create/edit form updates

**Files:**
- Modify: `client/app/(protected)/pantry/new/page.tsx`
- Create: `client/app/(protected)/pantry/[id]/edit/page.tsx`
- Modify: `client/app/(protected)/pantry/actions.ts`
- Create: `client/components/pantry/PantryForm.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildPantryFormDefaults } from "@/components/pantry/PantryForm";

describe("pantry form defaults", () => {
  it("defaults status to in_stock", () => {
    expect(buildPantryFormDefaults(null).status).toBe("in_stock");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-form.test.ts`
Expected: FAIL because form helper does not exist.

**Step 3: Write minimal implementation**

Create `PantryForm` component with fields:
- name, quantity, unit, location (required)
- status select (custom select, not native)
- category select/text
- expiration date, opened date
- optional inventory link select

Add edit route and update action.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-form.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/app/(protected)/pantry/new/page.tsx client/app/(protected)/pantry/[id]/edit/page.tsx client/app/(protected)/pantry/actions.ts client/components/pantry/PantryForm.tsx client/tests/pantry/pantry-form.test.ts
git commit -m "pantry create edit form"
```

---

### Task 12: Add expiring view + warning window settings UI

**Files:**
- Create: `client/app/(protected)/pantry/expiring/page.tsx`
- Modify: `client/app/(protected)/pantry/page.tsx`
- Create: `client/components/pantry/PantryWarningWindowForm.tsx`
- Modify: `client/app/(protected)/pantry/actions.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updatePantryWarningWindow } from "@/app/(protected)/pantry/actions";

it("updates pantry warning window", async () => {
  const form = new FormData();
  form.set("pantryWarningDays", "5");
  await updatePantryWarningWindow(form);
  const prisma = (await import("@/lib/prisma")).default;
  const config = await prisma.appConfig.findFirst();
  expect(config?.pantryWarningDays).toBe(5);
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-settings.test.ts`
Expected: FAIL because action does not exist.

**Step 3: Write minimal implementation**

Add action:
```ts
export async function updatePantryWarningWindow(formData: FormData) {
  const value = Number(formData.get("pantryWarningDays"));
  await prisma.appConfig.upsert({
    where: { id: "app" },
    create: { id: "app", pantryWarningDays: Number.isFinite(value) ? value : 7 },
    update: { pantryWarningDays: Number.isFinite(value) ? value : 7 },
  });
  revalidatePath("/pantry");
  revalidatePath("/pantry/expiring");
}
```

Create expiring page and add header action to open settings form.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-settings.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/app/(protected)/pantry/expiring/page.tsx client/app/(protected)/pantry/page.tsx client/components/pantry/PantryWarningWindowForm.tsx client/app/(protected)/pantry/actions.ts client/tests/pantry/pantry-settings.test.ts
git commit -m "pantry expiring view"
```

---

### Task 13: Cross-communication updates

**Files:**
- Modify: `client/agents/chef.ts`
- Modify: `client/app/(protected)/groceries/GroceriesListClient.tsx`
- Modify: `client/app/(protected)/inventory/page.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { filterInStockPantryItems } from "@/lib/pantry/filters";

describe("filterInStockPantryItems", () => {
  it("filters consumed items", () => {
    const result = filterInStockPantryItems([
      { id: "1", status: "in_stock" },
      { id: "2", status: "consumed" },
    ]);
    expect(result).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-filters.test.ts`
Expected: FAIL because helper does not exist.

**Step 3: Write minimal implementation**

Create `client/lib/pantry/filters.ts` with `filterInStockPantryItems` and use it in `chef.ts` and `expiration.ts` filters.

Add “From pantry” tag in grocery list rows when `pantryItemId` exists, linking to pantry detail.

Add inventory link display for linked pantry items in the inventory list (simple badge).

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-filters.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/lib/pantry/filters.ts client/agents/chef.ts client/app/(protected)/groceries/GroceriesListClient.tsx client/app/(protected)/inventory/page.tsx client/tests/pantry/pantry-filters.test.ts
git commit -m "pantry cross communication"
```

---

### Task 14: Visual polish and layout alignment (@design-principles)

**Files:**
- Modify: `client/app/(protected)/pantry/page.tsx`
- Modify: `client/app/(protected)/pantry/expiring/page.tsx`
- Modify: `client/components/pantry/PantryStatusBadge.tsx`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getExpirationStatus } from "@/lib/pantry/expiration";

describe("expiration status levels", () => {
  it("labels unknown expiration", () => {
    const status = getExpirationStatus(null, new Date("2026-01-01T00:00:00Z"), 7);
    expect(status.label).toBe("Unknown");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-expiration.test.ts`
Expected: FAIL if labels differ.

**Step 3: Write minimal implementation**

Ensure typography, spacing, and badge styles follow 4px grid, borders-only depth, and utility tone.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- client/tests/pantry/pantry-expiration.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add client/app/(protected)/pantry/page.tsx client/app/(protected)/pantry/expiring/page.tsx client/components/pantry/PantryStatusBadge.tsx
git commit -m "pantry ui polish"
```

---

## Notes
- Use @superpowers:test-driven-development when implementing tests for new helpers/actions.
- For UI components, prefer shadcn `Select` over native select elements.
- Keep new code in ASCII; avoid non-ASCII in labels unless required.

