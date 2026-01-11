# Implementation Readiness Checklist

Use this checklist to confirm key decisions before starting implementation.

## Data & Models
- [x] Define core entities and relationships (inventory, pantry, groceries, recipes, meal plans).
- [x] Define proposal/audit data model (statuses, diffs, confidence fields).
- [x] Define agent configuration model and versioning structure.
  - Decisions: high-level ERD; proposals per agent run with grouped changes + audit entries; immutable config versions with rollback.

## API & Architecture
- [x] Decide API boundaries (Next.js routes vs separate service).
- [x] Define event/trigger system for agents.
- [x] Define background job interfaces and queue boundaries.
  - Decisions: hybrid Next.js routes + separate service; BullMQ queues for events + jobs (Redis-backed); BullMQ workers in repo.

## Auth & Sessions
- [x] Define password hashing strategy and session storage.
- [x] Decide optional password UX and reset flow.
- [x] Define owner-only access checks.
  - Decisions: bcrypt; signed cookie sessions; setup wizard prompt with skip option.

## Agent Runtime
- [x] Define proposal payload schema and review workflow states.
- [x] Define confidence thresholds and model/provider selection rules.
- [x] Define agent trigger sources (manual, event-based, scheduled).
  - Decisions: JSON patch diffs + before/after snapshots; thresholds per suggestion type; manual + event-based triggers.

## Storage & Migrations
- [x] Choose ORM and migration tooling.
- [x] Define seed data strategy for development.
- [ ] Define backup/restore approach (even if MVP-light).
  - Decisions: Prisma with ORM-managed migrations; optional seed command.

## UI/UX
- [x] Define primary navigation and information architecture.
- [x] Finalize setup flow and review inbox placement.
- [ ] Define empty states and error states for core flows.
  - Decisions: dashboard-first navigation; review inbox as dashboard widget + nav item; first-run wizard before dashboard.

## Testing & Quality
- [x] Define test strategy (unit vs integration vs e2e).
- [x] Pick test runner and CI baseline.
- [x] Define lint/format defaults.
  - Decisions: unit + integration; Vitest; ESLint + Prettier.

## Deployment & Ops
- [x] Define Docker setup and environment variables.
- [x] Define Redis and Postgres deployment expectations.
- [x] Define logging and minimal observability.
  - Decisions: single docker-compose; `.env.local`; structured logs + basic health endpoint.
