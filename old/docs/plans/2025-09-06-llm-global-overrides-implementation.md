# Global LLM Config + Per-Agent Override Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a single global config (provider, model, vision model) and a per-agent override toggle that, when enabled, exposes provider/model/vision inputs and takes precedence over global.

**Architecture:** Store global values on `AppConfig`. Store per-agent override config + enabled flag on `AgentConfig`. Resolve effective config: if agent override enabled, use agent config; otherwise use global. Update Settings UI to show global fields and per-agent override toggle with hidden fields until enabled.

**Tech Stack:** Next.js (App Router), Prisma, Vercel AI SDK, shadcn/ui, Vitest.

### Task 1: Add global model fields + agent override flag in Prisma

**Files:**
- Modify: `client/prisma/schema.prisma`
- Create: `client/prisma/migrations/<timestamp>_llm_global_overrides/migration.sql`
- Test: `client/tests/db-reset.test.ts`

**Step 1: Write failing test**

```ts
it("stores global and agent override flags", async () => {
  const app = await prisma.appConfig.create({
    data: {
      id: "app",
      setupComplete: true,
      llmProvider: "openai",
      llmModel: "gpt-4.1-mini",
      llmVisionModel: "gpt-4.1-mini",
    },
  });
  expect(app.llmModel).toBe("gpt-4.1-mini");

  const agent = await prisma.agentConfig.create({
    data: {
      agentId: "agent_enrichment",
      model: "llama3.1",
      visionModel: "llama3.1",
      prompt: "x",
      systemPrompt: "x",
      userPrompt: "",
      providerOverride: "openrouter",
      modelOverride: "openrouter/gpt-4o-mini",
      visionModelOverride: "openrouter/gpt-4o-mini",
      overrideEnabled: true,
      enabled: true,
    },
  });
  expect(agent.overrideEnabled).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- db-reset.test.ts`
Expected: FAIL missing fields.

**Step 3: Update Prisma schema**

Add to `AppConfig`:
```prisma
  llmModel       String?
  llmVisionModel String?
```

Add to `AgentConfig`:
```prisma
  overrideEnabled     Boolean @default(false)
  providerOverride    String?
  modelOverride       String?
  visionModelOverride String?
```

**Step 4: Generate migration**

Run: `npx --prefix client prisma migrate dev --name llm_global_overrides --schema client/prisma/schema.prisma --config client/prisma.config.ts`
Expected: migration created and applied.

**Step 5: Regenerate Prisma client**

Run: `npx --prefix client prisma generate --schema client/prisma/schema.prisma`

**Step 6: Run test to verify it passes**

Run: `npm --prefix client run test -- db-reset.test.ts`
Expected: PASS.

**Step 7: Commit**

```bash
git add client/prisma/schema.prisma client/prisma/migrations client/tests/db-reset.test.ts
 git commit -m "add global llm config and agent override flag"
```

### Task 2: Update settings actions for global + agent overrides

**Files:**
- Modify: `client/app/(protected)/settings/ai-actions.ts`
- Test: `client/tests/settings-actions.test.ts`

**Step 1: Write failing test**

```ts
it("stores global model overrides and agent overrides", async () => {
  const global = new FormData();
  global.set("provider", "openai");
  global.set("model", "gpt-4.1-mini");
  global.set("visionModel", "gpt-4.1-mini");
  await updateAiProvider(global);
  const app = await prisma.appConfig.findFirst();
  expect(app?.llmModel).toBe("gpt-4.1-mini");

  const agent = new FormData();
  agent.set("overrideEnabled", "on");
  agent.set("providerOverride", "openrouter");
  agent.set("modelOverride", "openrouter/gpt-4o-mini");
  agent.set("visionModelOverride", "openrouter/gpt-4o-mini");
  await updateAgentConfig("agent_enrichment", agent);
  const config = await prisma.agentConfig.findUnique({ where: { agentId: "agent_enrichment" } });
  expect(config?.overrideEnabled).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- settings-actions.test.ts`
Expected: FAIL (fields ignored).

**Step 3: Implement update logic**

- `updateAiProvider` now stores `llmModel` + `llmVisionModel` from form.
- `updateAgentConfig` reads `overrideEnabled`, `providerOverride`, `modelOverride`, `visionModelOverride`.

**Step 4: Run test to verify it passes**

Run: `npm --prefix client run test -- settings-actions.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/app/(protected)/settings/ai-actions.ts client/tests/settings-actions.test.ts
 git commit -m "store global llm config and agent overrides"
```

### Task 3: Resolve effective provider/model in runtime

**Files:**
- Modify: `client/lib/ai.ts`
- Modify: `client/agents/enrichment.ts`
- Test: `client/tests/llm-providers.test.ts`

**Step 1: Write failing test**

```ts
it("prefers agent overrides when enabled", () => {
  const resolved = resolveEffectiveConfig({
    global: { provider: "openai", model: "gpt-4.1-mini", visionModel: "gpt-4.1-mini" },
    agent: { overrideEnabled: true, providerOverride: "openrouter", modelOverride: "openrouter/gpt-4o-mini", visionModelOverride: "openrouter/gpt-4o-mini" },
  });
  expect(resolved.model).toBe("openrouter/gpt-4o-mini");
});
```

**Step 2: Run test to verify it fails**

Run: `npm --prefix client run test -- llm-providers.test.ts`
Expected: FAIL missing resolver.

**Step 3: Implement resolver in `client/lib/llm-providers.ts`**

Add `resolveEffectiveConfig` that returns provider/model/vision based on overrideEnabled.

**Step 4: Wire into `runAgentPrompt` and `analyzeAttachment`**

- Use `resolveEffectiveConfig` to pick provider/model.
- For vision in `enrichment.ts`, prefer agent override if enabled, else global vision model, else fallback.

**Step 5: Run tests**

Run: `npm --prefix client run test -- llm-providers.test.ts`
Expected: PASS.

**Step 6: Commit**

```bash
git add client/lib/llm-providers.ts client/lib/ai.ts client/agents/enrichment.ts client/tests/llm-providers.test.ts
 git commit -m "resolve effective llm config"
```

### Task 4: Update Settings UI for global + per-agent override toggle

**Files:**
- Modify: `client/app/(protected)/settings/AiProviderSettings.tsx`
- Modify: `client/app/(protected)/settings/AgentSettings.tsx`
- Modify: `client/app/(protected)/settings/ProviderOverrideSelect.tsx`
- Test: `client/tests/ai-provider-settings.test.tsx`, `client/tests/agent-settings.test.tsx`

**Step 1: Write failing tests**

Global test:
```tsx
it("renders global model overrides", () => {
  render(<AiProviderSettings provider="openai" baseUrl="" apiKey="" />);
  expect(screen.getByLabelText(/global model/i)).toBeTruthy();
  expect(screen.getByLabelText(/global vision model/i)).toBeTruthy();
});
```

Agent test:
```tsx
it("hides override fields until enabled", async () => {
  const ui = await AgentSettings();
  render(ui);
  expect(screen.queryByLabelText(/override provider/i)).toBeNull();
});
```

**Step 2: Run tests to verify failure**

Run: `npm --prefix client run test -- ai-provider-settings.test.tsx agent-settings.test.tsx`
Expected: FAIL.

**Step 3: Implement UI changes**

- Add two inputs in global card: `Global model` and `Global vision model`.
- In agent cards, add a switch/checkbox: “Override global settings”.
- Only render provider/model/vision inputs when override enabled.
- Update per-agent fields labels to “Override provider / Override model / Override vision model”.

**Step 4: Run tests**

Run: `npm --prefix client run test -- ai-provider-settings.test.tsx agent-settings.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/app/(protected)/settings/AiProviderSettings.tsx client/app/(protected)/settings/AgentSettings.tsx client/app/(protected)/settings/ProviderOverrideSelect.tsx client/tests/ai-provider-settings.test.tsx client/tests/agent-settings.test.tsx
 git commit -m "add global model overrides and agent toggle"
```

### Task 5: Final verification

**Step 1:** Run full test suite

Run: `npm --prefix client run test`
Expected: PASS.

**Step 2:** Summarize results.

---

Plan complete and saved to `docs/plans/2025-09-06-llm-global-overrides-implementation.md`. Two execution options:

1. Subagent-Driven (this session) - I dispatch fresh subagent per task, review between tasks, fast iteration
2. Parallel Session (separate) - Open new session with executing-plans, batch execution with checkpoints

Which approach?
