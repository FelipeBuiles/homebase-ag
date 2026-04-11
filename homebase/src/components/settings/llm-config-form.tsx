"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { updateLlmConfigAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";
import { toast } from "sonner";

const PROVIDERS = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "ollama", label: "Ollama (local)" },
] as const;

type Provider = (typeof PROVIDERS)[number]["value"];

interface LlmConfigFormProps {
  config: {
    llmProvider: string;
    textModel: string;
    visionModel: string;
    ollamaBaseUrl: string;
    ollamaModel: string;
  };
}

export function LlmConfigForm({ config }: LlmConfigFormProps) {
  const { t } = useI18n();
  const [provider, setProvider] = useState<Provider>(config.llmProvider as Provider);
  const [textModel, setTextModel] = useState(config.textModel);
  const [visionModel, setVisionModel] = useState(config.visionModel);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(config.ollamaBaseUrl);
  const [ollamaModel, setOllamaModel] = useState(config.ollamaModel);

  const { execute, isPending } = useAction(updateLlmConfigAction, {
    onSuccess: () => toast.success(t("settings.ai.saved")),
    onError: () => toast.error(t("settings.ai.failed")),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    execute({ llmProvider: provider, textModel, visionModel, ollamaBaseUrl, ollamaModel });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={t("settings.ai.provider")}>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className="w-full h-8 rounded-lg border border-base-200 bg-white px-2.5 text-sm text-base-800 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </Field>

      {provider === "ollama" ? (
        <>
          <Field label={t("settings.ai.ollamaBaseUrl")}>
            <Input
              value={ollamaBaseUrl}
              onChange={(e) => setOllamaBaseUrl(e.target.value)}
              placeholder="http://localhost:11434"
            />
          </Field>
          <Field label={t("settings.ai.ollamaModel")}>
            <Input
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="llama3.2"
            />
          </Field>
        </>
      ) : (
        <>
          <Field label={t("settings.ai.textModel")}>
            <Input
              value={textModel}
              onChange={(e) => setTextModel(e.target.value)}
              placeholder="e.g. google/gemini-2.0-flash-001"
            />
          </Field>
          <Field label={t("settings.ai.visionModel")}>
            <Input
              value={visionModel}
              onChange={(e) => setVisionModel(e.target.value)}
              placeholder="e.g. google/gemini-2.0-flash-001"
            />
          </Field>
        </>
      )}

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-base-700">{label}</label>
      {children}
    </div>
  );
}
