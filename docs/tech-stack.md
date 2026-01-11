# HomeBase Tech Stack

This document defines the technology stack for HomeBase based on the current PRDs and feature roadmap.

## Frontend
- **Framework:** Next.js (App Router) + React
- **Language:** TypeScript
- **UI Components:** shadcn/ui
- **Design System Notes:** See `docs/design-system.md`

## Backend
- **Style:** Node + REST
- **Hosting Model:** Self-hosted, single household instance

## Database
- **Primary Store:** Postgres

## Authentication
- **Mode:** Single-user local password
- **Session:** Cookie-based sessions

## AI / Agent Runtime
- **Mode:** Pluggable
  - Local LLMs via Ollama
  - Hosted APIs (e.g., OpenAI/Anthropic)

## Background Jobs
- **Queue:** BullMQ
- **Broker:** Redis

## Notes
- The system remains usable without AI; agents must route all changes through review.
- Stack choices prioritize self-hosting, reliability, and extensibility for agent workflows.
- See `docs/architecture-summary.md` for architecture decisions and open items.
