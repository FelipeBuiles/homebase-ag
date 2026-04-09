# Repository Guidelines

## Project Structure & Module Organization
`client/` holds the Next.js app (App Router). UI pages live in `client/app/`, shared UI in `client/components/`, and reusable logic in `client/lib/`. Background workers/agents are under `client/agents/`, Prisma schema/migrations in `client/prisma/`, and static assets in `client/public/`. Tests are in `client/tests/`. Planning docs live in `docs/` and `tasks/`, and reference mockups are under `mockups/`. Local infra is defined in `docker-compose.yml` (Postgres + Redis).

## Build, Test, and Development Commands
Run commands from the repo root using `--prefix client`:
```bash
npm --prefix client run dev       # Next.js dev server
npm --prefix client run build     # Production build
npm --prefix client run start     # Serve production build
npm --prefix client run lint      # ESLint (Next.js core rules)
npm --prefix client run test      # Vitest test suite
npm --prefix client run dev:all   # App + local services helper script
```
Local services:
```bash
docker compose up -d              # Postgres + Redis
```
Agent runners (examples):
```bash
npm --prefix client run agent:enrichment
npm --prefix client run trigger:agent
```

## Coding Style & Naming Conventions
TypeScript with strict mode (`client/tsconfig.json`). Follow ESLint rules from `client/eslint.config.mjs`. Match existing conventions: 2‑space indentation, PascalCase for components/files in `client/components/`, camelCase for functions/vars, and route folders that mirror URL paths (e.g., `client/app/(protected)/inventory/[id]/page.tsx`).

## Testing Guidelines
Tests run with Vitest and live in `client/tests/`. Name new tests `*.test.ts` and co-locate fixtures near the test file when needed. Aim to cover library logic and agent workflows; include mocks for external services (AI providers, Redis, DB) where appropriate.

## Commit & Pull Request Guidelines
Git history shows short, descriptive, lowercase messages (e.g., “inventory wip, auth”). Keep commit subjects concise and action‑oriented. For PRs: include a summary, test commands run, and screenshots for UI changes. Call out Prisma migrations or schema updates explicitly.

## Configuration & Local Secrets
Local defaults live in `client/.env` (Postgres/Redis). Do not commit real secrets; use `.env` for local development and update `docker-compose.yml` if you change service ports or credentials.
