# Inventory Test Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full-stack (DB + server actions) test coverage for the inventory feature across create, edit, enrichment lifecycle, bulk updates, and filtering utilities.

**Architecture:** Use Vitest with a real Postgres test DB (`homebase_test`). Add a test setup that loads `.env.test` when present, plus a `resetDb()` helper that truncates all public tables except `_prisma_migrations`. Tests call server actions directly and assert via Prisma reads, while mocking Next.js `redirect`/`revalidatePath` and queue side effects.

**Tech Stack:** Vitest, Prisma, PostgreSQL (docker compose), Next.js server actions.

### Task 1: Test harness for DB reset + env setup

**Files:**
- Create: `client/tests/setup.ts`
- Create: `client/tests/utils/db.ts`
- Modify: `client/vitest.config.ts`

**Step 1: Write the failing test**

Create `client/tests/db-reset.test.ts`:
```ts
import { afterEach, describe, expect, it } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

describe("resetDb", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("clears data between tests", async () => {
    await prisma.room.create({ data: { name: "Kitchen" } });
    const count = await prisma.room.count();
    expect(count).toBe(1);
    await resetDb();
    const nextCount = await prisma.room.count();
    expect(nextCount).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- tests/db-reset.test.ts`
Expected: FAIL with `resetDb is not a function`.

**Step 3: Write minimal implementation**

Create `client/tests/setup.ts`:
```ts
import path from "node:path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "../.env.test");
dotenv.config({ path: envPath });
```

Create `client/tests/utils/db.ts`:
```ts
import prisma from "../../lib/prisma";

export const resetDb = async () => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  const tableNames = tables
    .map((row) => row.tablename)
    .filter((name) => name !== "_prisma_migrations");

  if (tableNames.length === 0) return;

  const truncate = tableNames.map((name) => `"${name}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${truncate} RESTART IDENTITY CASCADE;`);
};
```

Modify `client/vitest.config.ts` to include setup:
```ts
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- tests/db-reset.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/tests/setup.ts client/tests/utils/db.ts client/tests/db-reset.test.ts client/vitest.config.ts
git commit -m "test: add db reset harness"
```

### Task 2: Create inventory items (photo-only + full form)

**Files:**
- Create: `client/tests/inventory-create.test.ts`

**Step 1: Write the failing test**

Create `client/tests/inventory-create.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("../lib/queue", () => ({ inventoryQueue: { add: vi.fn() } }));
vi.mock("node:fs", () => ({ promises: { mkdir: vi.fn(), writeFile: vi.fn(), unlink: vi.fn() } }));

import { createInventoryItem, quickAddInventoryItem } from "../app/(protected)/inventory/actions";

const buildFile = (name: string, type: string) => new File(["content"], name, { type });

describe("inventory create actions", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("creates a photo-only item and sets enrichment pending", async () => {
    const form = new FormData();
    form.set("mode", "photo-only");
    form.set("name", "");
    form.set("attachments", buildFile("clip.mp4", "video/mp4"));

    await createInventoryItem(form);

    const item = await prisma.inventoryItem.findFirst({ include: { attachments: true } });
    expect(item?.name).toBe("New item");
    expect(item?.enrichmentStatus).toBe("pending");
    expect(item?.attachments.length).toBe(1);
  });

  it("creates a full item with metadata", async () => {
    const form = new FormData();
    form.set("name", "Camera");
    form.set("description", "Mirrorless");
    form.set("brand", "Sony");
    form.set("model", "A7");
    form.set("condition", "Good");
    form.set("serialNumber", "123");

    await createInventoryItem(form);

    const item = await prisma.inventoryItem.findFirst();
    expect(item?.name).toBe("Camera");
    expect(item?.brand).toBe("Sony");
    expect(item?.serialNumber).toBe("123");
  });

  it("quick-add creates minimal item", async () => {
    const form = new FormData();
    form.set("name", "Lamp");
    await quickAddInventoryItem(form);

    const item = await prisma.inventoryItem.findFirst();
    expect(item?.name).toBe("Lamp");
    expect(item?.categories.length).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- tests/inventory-create.test.ts`
Expected: FAIL (missing mocks or new test file).

**Step 3: Write minimal implementation**

No production code change expected; fix test issues (imports or mocks) only.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- tests/inventory-create.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/tests/inventory-create.test.ts
git commit -m "test: cover inventory create actions"
```

### Task 3: Edit items + attachment actions

**Files:**
- Create: `client/tests/inventory-edit.test.ts`

**Step 1: Write the failing test**

Create `client/tests/inventory-edit.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("node:fs", () => ({ promises: { mkdir: vi.fn(), writeFile: vi.fn(), unlink: vi.fn() } }));

import { updateInventoryItem, deleteInventoryAttachment } from "../app/(protected)/inventory/actions";

describe("inventory edit actions", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("updates metadata and rooms/tags", async () => {
    const room = await prisma.room.create({ data: { name: "Garage" } });
    const tag = await prisma.tag.create({ data: { name: "Tools" } });
    const item = await prisma.inventoryItem.create({ data: { name: "Saw" } });

    const form = new FormData();
    form.set("name", "Saw Pro");
    form.set("brand", "DeWalt");
    form.set("rooms", room.id);
    form.set("tags", tag.id);

    await updateInventoryItem(item.id, form);

    const updated = await prisma.inventoryItem.findUnique({ where: { id: item.id }, include: { rooms: true, tags: true } });
    expect(updated?.name).toBe("Saw Pro");
    expect(updated?.brand).toBe("DeWalt");
    expect(updated?.rooms[0]?.name).toBe("Garage");
    expect(updated?.tags[0]?.name).toBe("Tools");
  });

  it("deletes an attachment record", async () => {
    const item = await prisma.inventoryItem.create({ data: { name: "Chair" } });
    const attachment = await prisma.inventoryAttachment.create({
      data: { itemId: item.id, kind: "video", url: "/uploads/inventory/test.mp4", order: 1 },
    });

    await deleteInventoryAttachment(item.id, attachment.id);

    const remaining = await prisma.inventoryAttachment.findMany();
    expect(remaining.length).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- tests/inventory-edit.test.ts`
Expected: FAIL before mocks/imports are correct.

**Step 3: Write minimal implementation**

No production code change expected; adjust mocks if required.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- tests/inventory-edit.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/tests/inventory-edit.test.ts
git commit -m "test: cover inventory edit actions"
```

### Task 4: Enrichment lifecycle + proposals

**Files:**
- Create: `client/tests/inventory-enrichment.test.ts`

**Step 1: Write the failing test**

Create `client/tests/inventory-enrichment.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

const addMock = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../lib/queue", () => ({ inventoryQueue: { add: addMock } }));

import { requestInventoryEnrichment } from "../app/(protected)/inventory/actions";
import { approveSelectedChanges } from "../app/(protected)/review/actions";

describe("inventory enrichment", () => {
  afterEach(async () => {
    addMock.mockClear();
    await resetDb();
  });

  it("queues enrichment and updates status", async () => {
    const item = await prisma.inventoryItem.create({ data: { name: "Camera" } });
    await requestInventoryEnrichment(item.id);

    const updated = await prisma.inventoryItem.findUnique({ where: { id: item.id } });
    expect(updated?.enrichmentStatus).toBe("pending");
    expect(addMock).toHaveBeenCalledWith("enrich", { itemId: item.id });
  });

  it("applies enrichment proposal with rooms/tags", async () => {
    const room = await prisma.room.create({ data: { name: "Office" } });
    const tag = await prisma.tag.create({ data: { name: "Electronics" } });
    const item = await prisma.inventoryItem.create({ data: { name: "Laptop" } });
    const proposal = await prisma.proposal.create({
      data: {
        agentId: "agent_enrichment",
        summary: "Set rooms",
        changes: {
          create: {
            entityType: "InventoryItem",
            entityId: item.id,
            confidence: 0.9,
            rationale: "Test",
            diff: [{ op: "replace", path: "/rooms", value: [room.name] }],
            before: { rooms: [] },
            after: { rooms: [room.name] },
          },
        },
      },
      include: { changes: true },
    });

    await approveSelectedChanges(proposal.id, [proposal.changes[0].id]);

    const updated = await prisma.inventoryItem.findUnique({ where: { id: item.id }, include: { rooms: true } });
    expect(updated?.rooms[0]?.name).toBe("Office");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- tests/inventory-enrichment.test.ts`
Expected: FAIL before mocks/imports are correct.

**Step 3: Write minimal implementation**

No production code change expected; adjust mocks if required.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- tests/inventory-enrichment.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/tests/inventory-enrichment.test.ts
git commit -m "test: cover inventory enrichment lifecycle"
```

### Task 5: Bulk updates + filtering utility

**Files:**
- Create: `client/tests/inventory-bulk.test.ts`
- Modify: `client/lib/inventory.ts` (export helper for filtering status)

**Step 1: Write the failing test**

Create `client/tests/inventory-bulk.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import prisma from "../lib/prisma";
import { resetDb } from "./utils/db";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { bulkUpdateInventoryItems } from "../app/(protected)/inventory/actions";
import { isInventoryStatusMatch } from "../lib/inventory";

describe("inventory bulk updates", () => {
  afterEach(async () => {
    await resetDb();
  });

  it("adds categories and rooms", async () => {
    const room = await prisma.room.create({ data: { name: "Basement" } });
    const item = await prisma.inventoryItem.create({ data: { name: "Box", categories: ["Tools"] } });

    const form = new FormData();
    form.append("itemIds", item.id);
    form.append("categories", "Electronics");
    form.append("rooms", room.id);
    form.set("addCategories", "on");
    form.set("addRooms", "on");

    await bulkUpdateInventoryItems(form);

    const updated = await prisma.inventoryItem.findUnique({ where: { id: item.id }, include: { rooms: true } });
    expect(updated?.categories).toEqual(["Tools", "Electronics"]);
    expect(updated?.rooms[0]?.name).toBe("Basement");
  });

  it("clears tags when confirmed", async () => {
    const tag = await prisma.tag.create({ data: { name: "Vintage" } });
    const item = await prisma.inventoryItem.create({
      data: { name: "Radio", tags: { connect: { id: tag.id } } },
    });

    const form = new FormData();
    form.append("itemIds", item.id);
    form.set("clearTags", "on");
    form.set("confirmClear", "on");

    await bulkUpdateInventoryItems(form);

    const updated = await prisma.inventoryItem.findUnique({ where: { id: item.id }, include: { tags: true } });
    expect(updated?.tags.length).toBe(0);
  });
});

describe("inventory status filter helper", () => {
  it("matches needs-enrichment status", () => {
    const item = {
      name: "Chair",
      categories: [],
      rooms: [],
      attachments: [{}],
      enrichmentStatus: "idle",
    };
    expect(isInventoryStatusMatch(item, "needs-enrichment")).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- tests/inventory-bulk.test.ts`
Expected: FAIL with `isInventoryStatusMatch is not a function`.

**Step 3: Write minimal implementation**

Modify `client/lib/inventory.ts`:
```ts
export const isInventoryStatusMatch = (
  item: { name?: string | null; categories?: string[] | null; rooms?: unknown[] | null; attachments?: unknown[] | null; enrichmentStatus?: string | null },
  status: string
) => {
  const categories = item.categories ?? [];
  const rooms = item.rooms ?? [];
  const attachments = item.attachments ?? [];
  const complete = isInventoryComplete(item);
  if (status === "complete") return complete;
  if (status === "incomplete") return !complete;
  if (status === "needs-category") return categories.length === 0;
  if (status === "needs-room") return rooms.length === 0;
  if (status === "needs-enrichment") return attachments.length > 0 && !complete;
  if (status === "enrichment-failed") return item.enrichmentStatus === "failed";
  return true;
};
```

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- tests/inventory-bulk.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/tests/inventory-bulk.test.ts client/lib/inventory.ts
git commit -m "test: cover inventory bulk updates and status helper"
```

### Task 6: Full suite verification

**Files:**
- None

**Step 1: Run full test suite**

Run: `npm --prefix client run test`
Expected: PASS all tests.

**Step 2: Commit**

No commit needed unless fixes were applied.
