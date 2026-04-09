# Architecture

## Project structure

```
homebase/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── setup/page.tsx
│   │   ├── (app)/                  # Protected routes
│   │   │   ├── layout.tsx          # Nav shell
│   │   │   ├── page.tsx            # Dashboard
│   │   │   ├── review/
│   │   │   ├── inventory/
│   │   │   ├── groceries/
│   │   │   ├── pantry/
│   │   │   ├── recipes/
│   │   │   ├── meal-plans/
│   │   │   ├── activity/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   └── agents/             # Agent trigger endpoints
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (copied, not installed)
│   │   ├── layout/                 # PageShell, Nav, EmptyState, etc.
│   │   └── [feature]/              # Feature-specific components
│   │       ├── inventory/
│   │       ├── groceries/
│   │       ├── pantry/
│   │       ├── recipes/
│   │       ├── meal-plans/
│   │       └── review/
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── client.ts           # Prisma singleton
│   │   │   └── queries/            # One file per entity
│   │   │       ├── inventory.ts
│   │   │       ├── groceries.ts
│   │   │       ├── pantry.ts
│   │   │       ├── recipes.ts
│   │   │       ├── meal-plans.ts
│   │   │       └── proposals.ts
│   │   ├── agents/                 # One file per agent
│   │   │   ├── types.ts            # Shared agent types
│   │   │   ├── runner.ts           # BullMQ worker setup
│   │   │   ├── enrichment.ts
│   │   │   ├── recipe-parser.ts
│   │   │   ├── normalization.ts
│   │   │   ├── expiration.ts
│   │   │   ├── chef.ts
│   │   │   └── pantry-maintenance.ts
│   │   ├── llm/
│   │   │   ├── providers.ts        # Provider abstraction
│   │   │   └── client.ts           # getModel() helper
│   │   ├── auth/
│   │   │   ├── session.ts          # iron-session config + helpers
│   │   │   └── middleware.ts       # Next.js middleware for route protection
│   │   └── utils.ts                # cn(), formatDate(), etc.
│   │
│   ├── actions/                    # Server actions (next-safe-action)
│   │   ├── inventory.ts
│   │   ├── groceries.ts
│   │   ├── pantry.ts
│   │   ├── recipes.ts
│   │   ├── meal-plans.ts
│   │   ├── proposals.ts
│   │   └── settings.ts
│   │
│   └── __tests__/
│       ├── lib/
│       └── actions/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── workers/                        # Standalone agent runner (not Next.js)
│   └── index.ts                    # BullMQ worker process
│
├── docker-compose.yml
├── .env.example
├── package.json
└── next.config.ts
```

---

## Database schema

One Prisma model per concept. No junction tables with extra columns — use explicit relation tables.

```prisma
model User {
  id           String   @id @default(cuid())
  passwordHash String?
  createdAt    DateTime @default(now())
}

model AppConfig {
  id              String  @id @default("singleton")
  llmProvider     String  @default("ollama")
  ollamaBaseUrl   String  @default("http://localhost:11434")
  ollamaModel     String  @default("llama3.2")
  pantryWarnDays  Int     @default(7)
  isPasswordSet   Boolean @default(false)
}

model AgentConfig {
  id          String   @id @default(cuid())
  agentId     String   @unique  // e.g. "enrichment", "recipe-parser"
  enabled     Boolean  @default(true)
  llmOverride String?           // override global provider
  modelOverride String?
  updatedAt   DateTime @updatedAt
}

model InventoryItem {
  id          String   @id @default(cuid())
  name        String
  brand       String?
  condition   String   @default("good")   // good | fair | poor
  quantity    Int      @default(1)
  notes       String?
  categories  String[]
  rooms       String[]
  tags        String[]
  completeness Int     @default(0)        // 0-100, computed
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  attachments InventoryAttachment[]
  proposals   Proposal[]
}

model InventoryAttachment {
  id        String        @id @default(cuid())
  itemId    String
  item      InventoryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  url       String
  mimeType  String
  width     Int?
  height    Int?
  ocrText   String?
  createdAt DateTime      @default(now())
}

model GroceryList {
  id        String        @id @default(cuid())
  name      String
  items     GroceryItem[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

model GroceryItem {
  id             String      @id @default(cuid())
  listId         String
  list           GroceryList @relation(fields: [listId], references: [id], onDelete: Cascade)
  name           String
  normalizedName String?
  quantity       String?
  unit           String?
  checked        Boolean     @default(false)
  source         String?     // "manual" | "recipe-parser" | "agent"
  createdAt      DateTime    @default(now())
}

model Recipe {
  id           String             @id @default(cuid())
  title        String
  description  String?
  sourceUrl    String?
  imageUrl     String?
  servings     Int?
  prepMinutes  Int?
  cookMinutes  Int?
  instructions String?
  parseStatus  String             @default("pending")  // pending | parsed | failed
  ingredients  RecipeIngredient[]
  mealItems    MealPlanItem[]
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
}

model RecipeIngredient {
  id             String  @id @default(cuid())
  recipeId       String
  recipe         Recipe  @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  raw            String
  name           String?
  quantity       String?
  unit           String?
  normalizedName String?
  sortOrder      Int     @default(0)
}

model PantryItem {
  id          String    @id @default(cuid())
  name        String
  brand       String?
  location    String?
  quantity    Float     @default(1)
  unit        String?
  expiresAt   DateTime?
  openedAt    DateTime?
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model MealPlan {
  id        String         @id @default(cuid())
  name      String
  weekStart DateTime
  items     MealPlanItem[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
}

model MealPlanItem {
  id         String   @id @default(cuid())
  planId     String
  plan       MealPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  recipeId   String
  recipe     Recipe   @relation(fields: [recipeId], references: [id])
  date       DateTime
  mealType   String   // breakfast | lunch | dinner | snack
  servings   Int      @default(1)
}

model Proposal {
  id            String           @id @default(cuid())
  agentId       String
  entityType    String           // "inventory" | "grocery" | "pantry" | "recipe"
  entityId      String?
  status        String           @default("pending")   // pending | accepted | rejected
  patch         Json             // RFC 6902 JSON Patch array
  snapshot      Json             // entity state at proposal time
  rationale     String?
  confidence    Float?           // 0.0 - 1.0
  changes       ProposalChange[]
  inventoryItem InventoryItem?   @relation(fields: [entityId], references: [id])
  createdAt     DateTime         @default(now())
  resolvedAt    DateTime?
}

model ProposalChange {
  id         String   @id @default(cuid())
  proposalId String
  proposal   Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  field      String
  before     String?
  after      String?
}

model AuditLog {
  id        String   @id @default(cuid())
  actor     String   // "user" | agent id
  action    String
  entityType String?
  entityId  String?
  meta      Json?
  createdAt DateTime @default(now())
}
```

---

## API layer

Use **Next.js Server Actions** via `next-safe-action`. No separate REST API.

Each action file exports typed actions with Zod schemas:

```typescript
// src/actions/inventory.ts
import { createSafeActionClient } from "next-safe-action"
import { z } from "zod"

const action = createSafeActionClient()

const CreateItemSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  categories: z.array(z.string()),
  rooms: z.array(z.string()),
})

export const createInventoryItem = action
  .schema(CreateItemSchema)
  .action(async ({ parsedInput }) => {
    // db write
    // return created item
  })
```

### Query strategy

- Server components fetch data directly via Prisma (no action needed for reads)
- Client components that need dynamic data use `@tanstack/react-query` + a thin fetch function
- Actions handle all mutations; they revalidate the relevant path on success

---

## Agent architecture

Each agent is a pure async function that:
1. Receives a typed input (entity id + context)
2. Calls an LLM with a focused prompt
3. Validates the LLM response with Zod
4. Returns a typed `ProposalInput` object (never writes to DB directly)
5. The calling code creates the `Proposal` record and enqueues a job

```typescript
// src/lib/agents/types.ts

export interface AgentInput {
  entityType: string
  entityId: string
  context?: Record<string, unknown>
}

export interface ProposalInput {
  agentId: string
  entityType: string
  entityId: string
  patch: JsonPatch[]          // RFC 6902
  snapshot: Record<string, unknown>
  rationale: string
  confidence: number          // 0.0 - 1.0
  changes: FieldChange[]
}

export interface FieldChange {
  field: string
  before: string | null
  after: string | null
}
```

```typescript
// src/lib/agents/enrichment.ts

export async function runEnrichmentAgent(itemId: string): Promise<ProposalInput> {
  const item = await getInventoryItemWithAttachments(itemId)
  const model = await getModel()

  const result = await generateObject({
    model,
    schema: EnrichmentOutputSchema,   // Zod schema
    system: ENRICHMENT_SYSTEM_PROMPT, // defined in this file
    messages: buildEnrichmentMessages(item),
  })

  return buildProposal(item, result.object)
}
```

### Job queue (BullMQ)

Worker process (`workers/index.ts`) runs separately from Next.js:

```typescript
const worker = new Worker("agents", async (job) => {
  switch (job.name) {
    case "enrichment":    return runEnrichmentAgent(job.data.entityId)
    case "recipe-parser": return runRecipeParserAgent(job.data.entityId)
    // ...
  }
}, { connection })
```

Trigger from server action:

```typescript
await agentQueue.add("enrichment", { entityId: itemId }, { attempts: 3 })
```

---

## Authentication

Single-user, optional password. Uses `iron-session` for signed encrypted cookies.

```typescript
// src/lib/auth/session.ts
import { getIronSession } from "iron-session"

export interface SessionData {
  isLoggedIn: boolean
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "homebase_session",
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
}
```

Middleware (`src/middleware.ts`) redirects unauthenticated requests to `/login`. If no password is set (fresh install), redirect to `/setup` instead.

---

## LLM provider abstraction

```typescript
// src/lib/llm/providers.ts

type Provider = "ollama" | "openai" | "anthropic" | "google" | "deepseek"

export async function getModel(agentId?: string) {
  const config = await getAppConfig()
  const agentConfig = agentId ? await getAgentConfig(agentId) : null
  
  const provider = (agentConfig?.llmOverride ?? config.llmProvider) as Provider
  const model    = agentConfig?.modelOverride ?? config.defaultModel

  switch (provider) {
    case "ollama":    return ollama(model)
    case "openai":    return openai(model)
    case "anthropic": return anthropic(model)
    case "google":    return google(model)
    case "deepseek":  return deepseek(model)
  }
}
```

---

## Data flow summary

```
User action
  → Server Action (validates input, mutates DB)
    → revalidatePath()
      → Server Component re-renders with fresh data

Photo upload
  → Server Action saves attachment
    → Enqueues "enrichment" BullMQ job
      → Worker runs agent
        → Agent writes Proposal record
          → Dashboard review count increments (polling or SSE)
```

---

## Error handling

- Server actions: return `{ success, data?, error? }` — never throw to the client
- Agent failures: mark job as failed in BullMQ, log to AuditLog, do not surface to user unless they check activity
- DB errors: caught at action level, logged, returned as generic error message
- LLM errors: caught in agent, fallback to `confidence: 0` proposal or no proposal

---

## What is explicitly NOT in this architecture

- No REST API endpoints (except `/api/agents/` trigger routes)
- No GraphQL
- No client-side routing library (Next.js App Router handles this)
- No state management library (server components + react-query is sufficient)
- No real-time features (polling for proposal counts is fine at this scale)
- No image CDN (serve uploads from `public/uploads/` locally)
