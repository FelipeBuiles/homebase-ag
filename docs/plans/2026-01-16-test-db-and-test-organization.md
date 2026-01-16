# Test DB Reliability + Domain Test Organization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix failing tests by ensuring migrations run against a dedicated test database and organize tests by domain with predictable imports.

**Architecture:** Add a Vitest global setup and a test runner script that force-load `.env.test`, validate the DB name, and run Prisma migrations before tests. Reorganize `client/tests` into domain folders and normalize imports to `@/` aliases for stability.

**Tech Stack:** Vitest, Prisma, Next.js, Node.js, Bash

### Task 1: Capture failing tests (RED)

**Files:**
- Modify: none
- Test: `client/tests/groceries/groceries-actions.test.ts`

**Step 1: Run the failing tests to confirm current failure**

Run: `npm --prefix client run test -- tests/groceries-actions.test.ts`

Expected: FAIL with Prisma column missing errors.

### Task 2: Add global test DB bootstrap (migrations + guard)

**Files:**
- Create: `client/tests/global-setup.ts`
- Modify: `client/vitest.config.ts`
- Modify: `client/tests/setup.ts`

**Step 1: Write failing assertion in setup**

In `client/tests/setup.ts`, add a guard that throws when `DATABASE_URL` is missing or does not include `_test`.

**Step 2: Run a single test to verify the guard fails (RED)**

Run: `DATABASE_URL="" npm --prefix client run test -- tests/db-reset.test.ts`

Expected: FAIL with guard error message.

**Step 3: Implement global setup to load `.env.test` and run migrations (GREEN)**

Create `client/tests/global-setup.ts`:

```ts
import path from "node:path";
import { execFileSync } from "node:child_process";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "../.env.test");
dotenv.config({ path: envPath, override: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for tests.");
}
if (!databaseUrl.includes("_test")) {
  throw new Error(`Tests must use a test database. Got: ${databaseUrl}`);
}

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");
execFileSync("npx", ["prisma", "migrate", "deploy", "--schema", schemaPath], {
  stdio: "inherit",
  env: { ...process.env },
});
```

Update `client/vitest.config.ts`:

```ts
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
  },
```

Update `client/tests/setup.ts` to load `.env.test` with override:

```ts
dotenv.config({ path: envPath, quiet: true, override: true });
if (!process.env.DATABASE_URL?.includes("_test")) {
  throw new Error(`Tests must use a test database. Got: ${process.env.DATABASE_URL}`);
}
```

**Step 4: Run a single test to verify guard passes (GREEN)**

Run: `npm --prefix client run test -- tests/db-reset.test.ts`

Expected: PASS.

### Task 3: Add a resilient test runner script

**Files:**
- Create: `client/scripts/test.sh`
- Modify: `client/package.json`

**Step 1: Create `client/scripts/test.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
ENV_FILE="$ROOT_DIR/.env.test"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env.test at $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required for tests" >&2
  exit 1
fi

if [[ "$DATABASE_URL" != *"_test"* ]]; then
  echo "Refusing to run tests against non-test database: $DATABASE_URL" >&2
  exit 1
fi

export NODE_ENV=test

npx prisma migrate deploy --schema "$ROOT_DIR/prisma/schema.prisma"

exec npx vitest run "$@"
```

**Step 2: Make it the default test script**

Update `client/package.json`:

```json
"test": "bash scripts/test.sh"
```

**Step 3: Run the full test suite**

Run: `npm --prefix client run test`

Expected: all tests pass.

### Task 4: Organize tests by domain

**Files:**
- Move: `client/tests/*.test.*` into domain folders
- Modify: moved tests for import updates

**Step 1: Create domain folders**

Create:
- `client/tests/ai`
- `client/tests/auth`
- `client/tests/groceries`
- `client/tests/inventory`
- `client/tests/recipes`
- `client/tests/settings`
- `client/tests/system`
- `client/tests/utils` (keep existing utils)

**Step 2: Move tests into domain folders**

Example moves:
- `client/tests/groceries-actions.test.ts` → `client/tests/groceries/groceries-actions.test.ts`
- `client/tests/recipes-modal.test.tsx` → `client/tests/recipes/recipes-modal.test.tsx`
- `client/tests/inventory-edit.test.ts` → `client/tests/inventory/inventory-edit.test.ts`
- `client/tests/settings-actions.test.ts` → `client/tests/settings/settings-actions.test.ts`
- `client/tests/ai.test.ts` → `client/tests/ai/ai.test.ts`
- `client/tests/auth.test.ts` → `client/tests/auth/auth.test.ts`
- `client/tests/sse-stream.test.ts` → `client/tests/system/sse-stream.test.ts`

**Step 3: Update imports to use `@/` aliases**

For moved tests, replace relative imports with:

```ts
import prisma from "@/lib/prisma";
import { resetDb } from "@/tests/utils/db";
import { requestInventoryEnrichment } from "@/app/(protected)/inventory/actions";
```

**Step 4: Run the full test suite**

Run: `npm --prefix client run test`

Expected: all tests pass.

### Task 5: Cleanup and verify

**Files:**
- Modify: any failing test paths/imports discovered by the run

**Step 1: Fix any remaining path issues**

Adjust imports until `npm --prefix client run test` passes cleanly.

**Step 2: Final verification**

Run: `npm --prefix client run test`

Expected: all tests pass.
