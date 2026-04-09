# Migration Squash Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan.

**Goal:** Replace all existing Prisma migrations with a single baseline migration and reset local dev/test databases to clean, consistent names.

**Architecture:** Use the current `client/prisma/schema.prisma` as the source of truth, wipe `client/prisma/migrations/` (except `migration_lock.toml`), reset the database, and generate a new baseline migration. Update environment configuration for `homebase_dev` and `homebase_test` and ensure Prisma client regenerates cleanly.

**Tech Stack:** Prisma (migrations + client), PostgreSQL (docker compose), Vitest.

### Task 1: Clear existing migrations

**Files:**
- Modify: `client/prisma/migrations/`
- Keep: `client/prisma/migration_lock.toml`

**Step 1: Verify current migrations exist**

Run: `ls -la client/prisma/migrations`
Expected: multiple migration folders.

**Step 2: Remove existing migration folders**

Run: `rm -rf client/prisma/migrations/*/`
Expected: only `migration_lock.toml` remains.

**Step 3: Verify directory clean**

Run: `ls -la client/prisma/migrations`
Expected: only `migration_lock.toml`.

**Step 4: Commit**

```bash
git add client/prisma/migrations
git commit -m "chore: clear prisma migrations"
```

### Task 2: Reset database and create baseline migration

**Files:**
- Modify: `client/prisma/migrations/<new_baseline>/migration.sql`

**Step 1: Reset database**

Run: `npx --prefix client prisma migrate reset --force --skip-generate --schema client/prisma/schema.prisma`
Expected: database dropped/recreated.

**Step 2: Create baseline migration**

Run: `npx --prefix client prisma migrate dev --name baseline --schema client/prisma/schema.prisma`
Expected: new migration directory created.

**Step 3: Commit**

```bash
git add client/prisma/migrations
git commit -m "chore: baseline prisma migration"
```

### Task 3: Update local database names and regenerate client

**Files:**
- Modify: `client/.env`
- Create: `client/.env.test` (if missing)

**Step 1: Update dev database name**

Set `DATABASE_URL` to `homebase_dev` in `client/.env`.

**Step 2: Add test database name**

Add `DATABASE_URL` pointing to `homebase_test` in `client/.env.test`.

**Step 3: Regenerate Prisma client**

Run: `npx --prefix client prisma generate --schema client/prisma/schema.prisma`
Expected: Prisma client regenerated.

**Step 4: Run tests**

Run: `npm --prefix client run test`
Expected: all tests pass.

**Step 5: Commit**

```bash
git add client/.env client/.env.test
git commit -m "chore: set dev and test db names"
```
