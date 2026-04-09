# Architecture Summary

This document captures the current implementation decisions based on the readiness checklist.

## Data & Models
- Core entities defined at high-level ERD scope.
- Proposals are per agent run with grouped changes + audit entries.
- Agent configuration is immutable with version history and rollback.

## API & Architecture
- Hybrid API boundary: Next.js routes plus a separate service where needed.
- BullMQ queues used for both agent triggers/events and background jobs (Redis-backed).
- BullMQ workers run in-repo.

## Auth & Sessions
- Password hashing: bcrypt.
- Sessions: signed cookie sessions.
- Setup wizard prompts for optional password with a skip option.

## Agent Runtime
- Proposal payloads include JSON patch diffs and before/after snapshots.
- Confidence thresholds are configurable per suggestion type.
- Triggers: manual + event-based.
- Canonical proposal schema: `docs/proposal-schema.md`.

## Storage & Migrations
- ORM: Prisma.
- Migrations: ORM-managed.
- Seed data: optional seed command.

## UI/UX
- Dashboard-first navigation.
- Review inbox: dashboard widget + nav item.
- First-run setup wizard before dashboard.

## Testing & Quality
- Test strategy: unit + integration.
- Test runner: Vitest.
- Lint/format: ESLint + Prettier.

## Deployment & Ops
- Single docker-compose for app + Postgres + Redis.
- Env vars: `.env.local`.
- Observability: structured logs + basic health endpoint.

## Open Items
- Backup/restore approach.
- Empty/error states definition for core flows.
