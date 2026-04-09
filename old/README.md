# Homebase

Internal web app for managing recipes, groceries, pantry/inventory, and the AI/agent workflows that enrich or normalize data. Built as a Next.js App Router app with server actions and background agents.

## Features

- Recipes: create/import recipes, parse ingredients, track parsing status, add images.
- Groceries: build lists from recipes, normalize names, manage duplicates.
- Inventory/Pantry: track items, run enrichment proposals, review changes.
- Agents: background jobs for parsing, enrichment, normalization, expiration, and chef suggestions.

## Module responsibilities

- `client/app/`: Next.js routes and server actions (App Router). Protected pages live under `client/app/(protected)/`.
- `client/components/`: shared UI components and primitives.
- `client/lib/`: domain logic (recipes, groceries, inventory, queues, parsing, normalization, settings).
- `client/agents/`: background worker/agent scripts.
- `client/prisma/`: Prisma schema and migrations.
- `client/tests/`: Vitest tests organized by domain (ai, auth, groceries, inventory, recipes, settings, system, utils).
- `docs/` and `tasks/`: planning docs, design notes, and execution checklists.
- `docker-compose.yml`: local Postgres + Redis for development and agents.

## Architecture and data flow

- UI routes under `client/app/` render React components and trigger server actions for mutations.
- Shared business logic lives in `client/lib/` so server actions and agents stay consistent.
- Prisma (via `client/lib/prisma.ts`) is the persistence layer, backed by Postgres.
- Agents consume queue tasks (BullMQ/Redis), read/write via Prisma, and update statuses for UI polling.
- Certain views poll for parsing/enrichment status to update the UI and allow retries.

## Getting started

Prereqs:
- Node.js (see `client/package.json`)
- Docker (for Postgres + Redis)

Setup:
- Install deps: `npm --prefix client install`
- Start services: `docker compose up -d`
- Configure env:
  - `client/.env` for local dev
  - `client/.env.test` for tests

Run:
- Dev server: `npm --prefix client run dev`
- App + agents + services helper: `npm --prefix client run dev:all`
- Build: `npm --prefix client run build`
- Start (prod build): `npm --prefix client run start`
- Lint: `npm --prefix client run lint`

## Testing

- Run tests: `npm --prefix client run test`
- Tests always load `client/.env.test`, auto-migrate, and refuse non-test DBs.
- If you need a clean slate in a test, use `resetDb()` from `client/tests/utils/db.ts`.

## Agents and background jobs

- Enrichment: `npm --prefix client run agent:enrichment`
- Normalization: `npm --prefix client run agent:normalization`
- Recipe parsing: `npm --prefix client run agent:recipe`
- Expiration: `npm --prefix client run agent:expiration`
- Chef suggestions: `npm --prefix client run agent:chef`
- Trigger agent flow: `npm --prefix client run trigger:agent`
