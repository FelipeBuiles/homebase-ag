# Tech Stack

## Core decisions

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router) | Server components + server actions eliminate a separate API layer; streaming-ready |
| Language | TypeScript strict | Non-negotiable for a project this size |
| Database | PostgreSQL 15 via Docker | Relational, reliable, local-first |
| ORM | Prisma 6 | Type-safe queries, migration tooling, good Next.js integration |
| Queue | BullMQ + Redis 7 | Reliable job processing for background agents |
| UI components | shadcn/ui | Unstyled primitives we fully control — not a dependency, just copied source |
| Styling | Tailwind CSS v4 | Design token system built in; v4's CSS-first config is cleaner |
| AI/LLM | Vercel AI SDK (`ai`) | Single interface across Ollama, OpenAI, Anthropic, Google, DeepSeek |
| Icons | Lucide React | Consistent set, tree-shakeable |
| Fonts | DM Sans + Fraunces | Keep from original — DM Sans for UI, Fraunces for display headings only |

## Additional packages (new vs original)

| Package | Purpose |
|---------|---------|
| `nuqs` | Type-safe URL search params — replaces manual `useSearchParams` wiring |
| `@tanstack/react-query` | Client-side data fetching with cache invalidation; reduces boilerplate in interactive pages |
| `zod` | Schema validation for server actions and agent outputs |
| `next-safe-action` | Typed server actions with Zod input validation and error handling |

## Dropped from original

| Dropped | Reason |
|---------|--------|
| Custom auth implementation | Replace with a minimal signed-cookie session (keep the same concept, but use `iron-session` instead of hand-rolled bcrypt cookie) |
| Hardcoded agent prompts file | Move prompts inline to each agent module — easier to maintain |

## What does NOT change

- PostgreSQL schema concepts (same entities, refined column names)
- BullMQ job queue architecture
- Human-in-the-loop proposal/review model
- Pluggable LLM provider pattern
- Docker Compose for local services

## Project folder name

`homebase` (flat, no `client/` subdirectory — the Next.js app is the root)

## Environment variables

```
DATABASE_URL=
REDIS_URL=
SESSION_SECRET=          # 32+ char random string for iron-session
LLM_PROVIDER=            # ollama | openai | anthropic | google | deepseek
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
DEEPSEEK_API_KEY=
OLLAMA_BASE_URL=         # default http://localhost:11434
OLLAMA_MODEL=            # default llama3.2
```

## Node & package manager

- Node 22+
- pnpm (faster installs, better monorepo support if ever needed)

## Testing

| Tool | Use |
|------|-----|
| Vitest | Unit + integration tests |
| Testing Library | Component tests |
| Playwright | E2E smoke tests (one per major flow) |

Tests live in `src/__tests__/` mirroring the source structure.
