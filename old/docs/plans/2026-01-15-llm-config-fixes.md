# LLM Config Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ensure base URL is only used for Ollama/custom providers and agent overrides fall back to agent defaults when enabled.

**Architecture:** Keep provider resolution in `client/lib/llm-providers.ts` with stricter base URL handling and make override resolution explicitly prefer agent config values before global. Settings UI will reflect provider-specific base URL behavior to avoid accidental OpenAI/OpenRouter calls.

**Tech Stack:** Next.js (App Router), Prisma, Vitest, React client components.

### Task 1: Add failing tests for base URL handling

**Files:**
- Modify: `client/tests/llm-providers.test.ts`
- Modify: `client/tests/settings-actions.test.ts`
- Modify: `client/tests/ai-provider-settings.test.tsx`

**Step 1: Write failing tests for provider base URL rules**

```ts
it("clears baseUrl for non-ollama/custom providers", () => {
  const resolved = resolveProviderConfig({
    globalProvider: "openai",
    baseUrl: "http://localhost:11434",
    apiKey: "sk-test",
    agentProviderOverride: null,
  });
  expect(resolved.baseUrl).toBeUndefined();
});
```

**Step 2: Write failing tests for settings action behavior**

```ts
const form = new FormData();
form.set("provider", "openai");
form.set("baseUrl", "http://localhost:11434");
await updateAiProvider(form);
expect(updated.llmBaseUrl).toBeNull();
```

**Step 3: Write failing test for UI base URL default**

```tsx
expect(screen.getByLabelText("Base URL")).toHaveValue("");
```

**Step 4: Run tests to confirm failures**

Run: `npm --prefix client run test -- llm-providers ai-provider-settings settings-actions`
Expected: failures asserting base URL handling.

**Step 5: Commit**

```bash
git add client/tests/llm-providers.test.ts client/tests/settings-actions.test.ts client/tests/ai-provider-settings.test.tsx
git commit -m "test: cover base url rules"
```

### Task 2: Implement base URL rules

**Files:**
- Modify: `client/lib/llm-providers.ts`
- Modify: `client/app/(protected)/settings/AiProviderSettings.tsx`
- Modify: `client/app/(protected)/settings/ai-actions.ts`
- Modify: `client/prisma/schema.prisma` (if default needs adjusting)

**Step 1: Update provider resolution**

```ts
const needsBaseUrl = provider === "ollama" || provider === "custom";
const resolvedBaseUrl = needsBaseUrl ? trimmedBaseUrl || undefined : undefined;
```

**Step 2: Update settings action to persist base URL only when needed**

```ts
const needsBaseUrl = ["ollama", "custom"].includes(providerNormalized);
const storedBaseUrl = needsBaseUrl ? (baseUrl || "http://localhost:11434") : null;
```

**Step 3: Update UI default value based on provider**

- When provider is not Ollama/custom, show empty base URL by default.
- Keep placeholder hint.

**Step 4: Run targeted tests**

Run: `npm --prefix client run test -- llm-providers ai-provider-settings settings-actions`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/lib/llm-providers.ts client/app/(protected)/settings/AiProviderSettings.tsx client/app/(protected)/settings/ai-actions.ts client/prisma/schema.prisma
git commit -m "fix: restrict base url to local providers"
```

### Task 3: Add failing tests for override fallback

**Files:**
- Modify: `client/tests/llm-providers.test.ts`
- Modify: `client/tests/agent-settings.test.tsx`

**Step 1: Write failing test for override fallback**

```ts
const resolved = resolveEffectiveConfig({
  global: { provider: "openai", model: "gpt-4.1-mini", visionModel: "gpt-4.1-mini" },
  agent: {
    overrideEnabled: true,
    providerOverride: "openrouter",
    modelOverride: null,
    visionModelOverride: null,
  },
  agentDefaults: { model: "llama3.1", visionModel: "llama3.1" },
});
expect(resolved.model).toBe("llama3.1");
```

**Step 2: Run tests to confirm failures**

Run: `npm --prefix client run test -- llm-providers agent-settings`
Expected: failures on override fallback.

**Step 3: Commit**

```bash
git add client/tests/llm-providers.test.ts client/tests/agent-settings.test.tsx
git commit -m "test: override fallback rules"
```

### Task 4: Implement override fallback logic

**Files:**
- Modify: `client/lib/llm-providers.ts`
- Modify: `client/lib/ai.ts`
- Modify: `client/agents/enrichment.ts`

**Step 1: Extend resolveEffectiveConfig to accept agent defaults**

```ts
agentDefaults?: { model?: string | null; visionModel?: string | null };
```

**Step 2: Prefer agent defaults when override enabled and override fields are blank**

```ts
const model = shouldOverride
  ? agent?.modelOverride?.trim() || agentDefaults?.model?.trim() || global.model?.trim()
  : global.model?.trim();
```

**Step 3: Update call sites to pass agent defaults**

- `client/lib/ai.ts`: pass `config.model`, `config.visionModel`.
- `client/agents/enrichment.ts`: pass `config?.model`, `config?.visionModel`.

**Step 4: Run targeted tests**

Run: `npm --prefix client run test -- llm-providers agent-settings`
Expected: PASS.

**Step 5: Commit**

```bash
git add client/lib/llm-providers.ts client/lib/ai.ts client/agents/enrichment.ts
git commit -m "fix: prefer agent defaults when overrides enabled"
```

### Task 5: Final verification

**Files:**
- Modify: none

**Step 1: Run full test suite**

Run: `npm --prefix client run test`
Expected: PASS.

**Step 2: Summarize changes**

- Note base URL handling change and override fallback behavior.

**Step 3: Commit (if needed)**

```bash
git status -sb
```

