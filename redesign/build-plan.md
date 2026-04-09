# Build Plan

Each phase is a complete, runnable slice of the app. The rule: **every phase ends with a working app** that passes its validation gate before the next phase begins.

---

## Phase 0 — Foundation

**Goal:** A running Next.js app with design system, auth, navigation, and empty pages.

### Build

- [ ] Initialize project: `pnpm create next-app homebase --typescript --tailwind --app --src-dir`
- [ ] Install packages: `iron-session`, `next-safe-action`, `zod`, `@tanstack/react-query`, `nuqs`, `lucide-react`, `@ai-sdk/*`, `ai`, `prisma`, `@prisma/client`, `bullmq`, `ioredis`
- [ ] Configure Tailwind v4 with design tokens from `visual-system.md`
- [ ] Set up fonts (DM Sans + Fraunces via `next/font`)
- [ ] Copy shadcn/ui primitives: `Button`, `Input`, `Textarea`, `Badge`, `Card`, `Dialog`, `Sheet`, `Select`, `Tabs`, `Separator`, `Alert`, `DropdownMenu`, `Popover`, `Sonner`
- [ ] Create layout components: `PageShell`, `Nav`, `EmptyState`, `LoadingSkeleton`
- [ ] Set up Docker Compose (Postgres + Redis)
- [ ] Initialize Prisma, write schema (all models from `architecture.md`), run first migration
- [ ] Implement auth: `iron-session` config, `session.ts`, `middleware.ts`
- [ ] Build `/setup` page (set password → creates AppConfig + User)
- [ ] Build `/login` page
- [ ] Build `(app)/layout.tsx` with Nav component
- [ ] Create stub pages for all routes (just renders `<PageShell title="...">Coming soon</PageShell>`)
- [ ] Wire up `ReactQueryProvider` and `Toaster`

### Validation gate

- [ ] `pnpm dev` starts without errors
- [ ] `/setup` page: can set a password, redirects to `/login`
- [ ] `/login` page: correct password → redirected to `/`, wrong password → error shown
- [ ] All nav links render without 404
- [ ] Nav active state highlights correctly on each route
- [ ] Design tokens visible: correct font, correct neutral palette, accent color correct
- [ ] `pnpm build` passes

---

## Phase 1 — Inventory (CRUD only, no agents)

**Goal:** Full inventory management — create, view, edit, delete items with attachments.

### Build

- [ ] DB queries: `src/lib/db/queries/inventory.ts` (list, get, create, update, delete, attach)
- [ ] Server actions: `src/actions/inventory.ts` (createItem, updateItem, deleteItem, addAttachment)
- [ ] Inventory list page: search bar, filter chips (category, room, tag), empty state, loading skeleton
- [ ] List item row component (name, brand, tags, room, completeness indicator, action menu)
- [ ] Inventory create page: form with fields from schema, image upload
- [ ] Inventory detail page: two-column layout, attachments gallery, edit in place or edit form
- [ ] Completeness calculation (0-100 based on filled optional fields)
- [ ] Image upload: save to `public/uploads/inventory/`, generate thumbnail with Sharp

### Validation gate

- [ ] Can create an item with name, brand, categories, rooms, tags
- [ ] Image upload works, thumbnail shown on list and detail
- [ ] List search filters by name
- [ ] Filter chips narrow the list correctly
- [ ] Edit item: all fields update, saved correctly
- [ ] Delete item: confirmation dialog, item removed from list
- [ ] Empty state shown when no items
- [ ] Loading skeleton shown on initial page load
- [ ] Completeness % updates as fields are filled
- [ ] `pnpm build` passes

---

## Phase 2 — Agent layer (enrichment + review)

**Goal:** First AI agent working end-to-end with the human-in-the-loop review flow.

### Build

- [ ] BullMQ worker process: `workers/index.ts`
- [ ] LLM provider abstraction: `src/lib/llm/providers.ts`, `src/lib/llm/client.ts`
- [ ] Agent types: `src/lib/agents/types.ts`
- [ ] Enrichment agent: `src/lib/agents/enrichment.ts` (vision → categories/tags/rooms suggestions)
- [ ] Auto-enqueue enrichment job on image upload
- [ ] DB queries: `src/lib/db/queries/proposals.ts`
- [ ] Server actions: `src/actions/proposals.ts` (acceptProposal, rejectProposal, acceptChange)
- [ ] Review page: list of pending proposals grouped by entity, amber proposal cards
- [ ] Proposal card component: before/after field diffs, rationale, confidence, accept/reject buttons
- [ ] Nav badge: pending proposal count (poll every 30s)
- [ ] AuditLog writes on accept/reject
- [ ] Activity page: chronological log of audit entries

### Validation gate

- [ ] Worker process starts: `pnpm workers` (or `tsx workers/index.ts`)
- [ ] Upload photo to inventory item → enrichment job enqueues
- [ ] Proposal appears in `/review` with field suggestions
- [ ] Proposal shows amber styling (visually distinct from regular UI)
- [ ] Accepting a proposal updates the inventory item
- [ ] Rejecting a proposal dismisses it without changes
- [ ] Individual field accept/reject works (selective acceptance)
- [ ] Nav badge shows correct pending count
- [ ] Activity log shows accepted/rejected entries
- [ ] `pnpm build` passes

---

## Phase 3 — Recipes

**Goal:** Recipe library with URL import, ingredient parsing, and normalization.

### Build

- [ ] DB queries: `src/lib/db/queries/recipes.ts`
- [ ] Server actions: `src/actions/recipes.ts` (create, update, delete, importFromUrl)
- [ ] Recipe parser agent: `src/lib/agents/recipe-parser.ts` (parse URL → structured recipe)
- [ ] Recipe list page: search, filter by parse status, empty state
- [ ] Recipe list item: title, image, source, prep/cook time, ingredient count
- [ ] Recipe create page: manual entry form OR URL import
- [ ] Recipe detail page: ingredients list (with normalized names), instructions, metadata sidebar
- [ ] Ingredient normalization: in agent, normalizes raw ingredient strings to structured `{ name, quantity, unit }`

### Validation gate

- [ ] Manual recipe creation works with all fields
- [ ] URL import: paste a URL, agent parses and populates recipe
- [ ] Parsed recipe shows structured ingredients (quantity + unit + name)
- [ ] Recipe detail page renders instructions correctly
- [ ] Parse status badge updates from "pending" → "parsed"
- [ ] Failed parse shows error state with retry option
- [ ] `pnpm build` passes

---

## Phase 4 — Pantry

**Goal:** Food stock tracking with expiration warnings.

### Build

- [ ] DB queries: `src/lib/db/queries/pantry.ts`
- [ ] Server actions: `src/actions/pantry.ts` (create, update, delete, markOpened)
- [ ] Expiration agent: `src/lib/agents/expiration.ts` (scan all items, propose status updates for expiring items)
- [ ] Pantry list page: tabs for All / Expiring / Expired; search; filter by location
- [ ] Pantry list item: name, location, quantity, expiry date, status badge
- [ ] Pantry create/edit form: name, brand, location, quantity, unit, expiry date, opened date
- [ ] Expiring section: items within `pantryWarnDays` of expiration, sorted by urgency
- [ ] Cron job or manual trigger for expiration agent

### Validation gate

- [ ] Add pantry item with expiration date
- [ ] Item appears in "Expiring" tab when within warning threshold
- [ ] Item appears in "Expired" tab when past expiration
- [ ] Expiration agent runs and creates proposals for status updates
- [ ] Proposals show in review inbox with amber styling
- [ ] Mark item as opened sets `openedAt` date
- [ ] Edit item updates all fields correctly
- [ ] `pnpm build` passes

---

## Phase 5 — Groceries

**Goal:** Shopping lists with item normalization.

### Build

- [ ] DB queries: `src/lib/db/queries/groceries.ts`
- [ ] Server actions: `src/actions/groceries.ts` (createList, deleteList, addItem, removeItem, toggleItem, normalizeList)
- [ ] Normalization agent: `src/lib/agents/normalization.ts` (dedup and normalize item names in a list)
- [ ] Grocery list index page: list of shopping lists, create new list CTA
- [ ] Grocery list detail: add items inline, check off items, normalization trigger
- [ ] Grocery item row: checkbox, name, normalized name (if different), quantity, remove button
- [ ] "Normalize list" action → creates proposals for name normalization

### Validation gate

- [ ] Create a grocery list
- [ ] Add items to list (inline text input)
- [ ] Check/uncheck items
- [ ] Remove an item
- [ ] Run normalization → proposals appear in review
- [ ] Accept normalization proposal → item name updates
- [ ] Delete a list (confirmation required)
- [ ] `pnpm build` passes

---

## Phase 6 — Meal Planning + cross-module flows

**Goal:** Weekly meal plans, recipe-to-grocery export, chef agent suggestions.

### Build

- [ ] DB queries: `src/lib/db/queries/meal-plans.ts`
- [ ] Server actions: `src/actions/meal-plans.ts` (create, update, delete, addItem, removeItem, exportToGroceries)
- [ ] Chef agent: `src/lib/agents/chef.ts` (given pantry state, suggest recipes for the week)
- [ ] Meal plan list page
- [ ] Meal plan detail: week grid (Mon–Sun × meal type), add recipe to slot, remove slot
- [ ] "Export to groceries" action: extract ingredients from planned recipes → propose grocery list additions
- [ ] Pantry maintenance agent: `src/lib/agents/pantry-maintenance.ts` (flag stale/unused items)

### Validation gate

- [ ] Create a meal plan for a week
- [ ] Add recipe to a day/meal slot
- [ ] Remove a recipe from a slot
- [ ] Export to groceries → new grocery list created (or items added to existing list) with ingredients
- [ ] Grocery items trace back to source recipe
- [ ] Chef agent runs → recipe suggestions appear as proposals
- [ ] Pantry maintenance agent runs → stale item proposals appear
- [ ] `pnpm build` passes

---

## Phase 7 — Settings + polish

**Goal:** Full settings page, activity metrics, and production readiness.

### Build

- [ ] Settings page sections:
  - [ ] LLM provider configuration (global + per-agent overrides)
  - [ ] Organization settings (manage room names, default categories)
  - [ ] Pantry warning days threshold
  - [ ] Password change
  - [ ] App info (version, DB stats)
- [ ] Activity metrics page: charts for proposals over time, accept/reject rates, agent run counts
- [ ] Error boundaries on all major page sections
- [ ] Consistent `error.tsx` files for all route segments
- [ ] Confirm dialogs for all destructive actions
- [ ] Keyboard shortcuts: `n` to create new item (context-aware), `?` for help
- [ ] README for the project (setup + run instructions)

### Validation gate

- [ ] LLM provider can be changed; existing agents use the new provider
- [ ] Per-agent override works (different model for enrichment vs chef)
- [ ] Password can be changed; old session invalidated
- [ ] Activity metrics page loads with real data
- [ ] All error states render gracefully (not white screen)
- [ ] Destructive actions (delete item, delete list) require confirmation
- [ ] `pnpm build` passes with no warnings
- [ ] `pnpm test` passes

---

## Development workflow

### Running locally

```bash
# Start services
docker compose up -d

# Run migrations
pnpm prisma migrate dev

# Start app (in separate terminals)
pnpm dev          # Next.js
pnpm workers      # BullMQ worker

# Run tests
pnpm test
```

### Environment setup

Copy `.env.example` to `.env.local`. At minimum, set:
- `DATABASE_URL`
- `REDIS_URL`
- `SESSION_SECRET` (generate with `openssl rand -base64 32`)
- One LLM provider's key (or `OLLAMA_BASE_URL` if running local models)

### Validation approach

After each phase, run the validation gate manually by going through each checkbox in order. Fix any failures before moving forward. This is intentionally manual — the goal is a working product at each step, not test coverage.

Automated tests (`pnpm test`) should cover:
- All server actions (input validation, happy path, error cases)
- All agent functions (mock LLM, test proposal generation logic)
- Utility functions

---

## Scope guard

Do not build these until all phases are complete and validated:

- Dark mode
- Multi-user / household members
- Cloud/remote deployment tooling
- Native mobile app
- External integrations (grocery store APIs, smart home)
- Barcode scanning
- Real-time updates (WebSockets, SSE)
- Recipe scaling
- Nutritional information
