# LLM Provider Selection + API Keys Design

## Goal
Enable global LLM provider configuration (provider, base URL, API key) and per-agent overrides for provider + model. Support Ollama plus major hosted providers (OpenAI, Anthropic, Gemini, DeepSeek), with a custom provider option that routes through an OpenAI-compatible client using a custom base URL. Preserve current agent execution flow and audit logging while keeping UI precise and compact.

## Architecture
- Add a provider factory module (e.g., `client/lib/llm-providers.ts`) that:
  - Normalizes provider strings (lowercase, trim).
  - Returns a Vercel AI SDK client for the effective provider.
  - Supports known providers: `ollama`, `openai`, `anthropic`, `gemini`, `deepseek`, `openrouter`.
  - Supports a `custom` mode by routing through the OpenAI-compatible client with the global base URL.
- Update `runAgentPrompt` to resolve the effective provider + model:
  - Provider: agent override if set, else global provider.
  - Model: agent model override if set, else current agent model.
- Update audit log details to include the effective provider/model (for overrides).

## Data Model
- Extend `agentConfig` with optional override fields:
  - `providerOverride` (string, nullable)
  - `modelOverride` (string, nullable) or reuse existing model with a new override field; confirm approach during implementation.
- Keep `appConfig` as the global source of `llmProvider`, `llmBaseUrl`, `llmApiKey`.

## UI/UX
Global AI Provider settings card:
- Provider dropdown with `ollama`, `openai`, `anthropic`, `gemini`, `deepseek`, `openrouter`, and `Custom`.
- If `Custom` selected, show a compact input for provider identifier.
- Base URL input (global); helper text explains it is used for Ollama/custom or OpenAI-compatible gateways.
- API key input (global, masked) with reveal toggle; optional.

Agent settings:
- Provider override dropdown with empty state for "Use global".
- Model override input; empty uses agent model.
- These overrides are per agent and saved independently of global settings.

## Error Handling
- Normalize provider names server-side.
- If provider is `custom` and base URL is missing, fail fast with a clear error and log it.
- Missing API key triggers provider errors at runtime; audit log captures error message.

## Testing
- Unit tests for provider normalization and selection.
- Tests for effective provider/model resolution (override vs global).
- Validation for missing base URL when custom provider is selected.

## Edge Cases
- Existing provider strings normalized to `ollama` by default.
- Global base URL remains but is only used for Ollama/custom or when explicitly configured.
- Agent override provider with empty model uses existing agent model.

## Out of Scope
- Per-provider API keys.
- Provider-specific base URL configuration beyond the global setting.
