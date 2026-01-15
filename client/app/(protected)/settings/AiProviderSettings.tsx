"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAiProvider } from "./ai-actions";

const PROVIDER_OPTIONS = [
  { value: "ollama", label: "Ollama (local)" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Gemini" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "Custom" },
] as const;

const KNOWN_PROVIDERS = new Set(
  PROVIDER_OPTIONS.filter((option) => option.value !== "custom").map((option) => option.value)
);

type AiProviderSettingsProps = {
  provider?: string | null;
  baseUrl?: string | null;
  apiKey?: string | null;
  model?: string | null;
  visionModel?: string | null;
};

export function AiProviderSettings({ provider, baseUrl, apiKey, model, visionModel }: AiProviderSettingsProps) {
  const normalizedProvider = provider?.trim().toLowerCase();
  const isKnownProvider = normalizedProvider ? KNOWN_PROVIDERS.has(normalizedProvider) : false;
  const isLiteralCustom = normalizedProvider === "custom";
  const initialProvider = normalizedProvider
    ? isKnownProvider
      ? normalizedProvider
      : "custom"
    : "ollama";
  const initialCustomProvider = normalizedProvider && !isKnownProvider && !isLiteralCustom
    ? provider?.trim() ?? ""
    : "";

  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [customProvider, setCustomProvider] = useState(initialCustomProvider);
  const [showApiKey, setShowApiKey] = useState(false);

  const effectiveProvider = useMemo(() => {
    if (selectedProvider !== "custom") return selectedProvider;
    return customProvider.trim() || "custom";
  }, [customProvider, selectedProvider]);

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle>AI provider</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateAiProvider} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="provider" value={effectiveProvider} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Base URL</label>
            <Input
              name="baseUrl"
              defaultValue={baseUrl ?? "http://localhost:11434"}
              placeholder="http://localhost:11434"
            />
            <p className="text-xs text-muted-foreground">
              Used for Ollama, custom, or OpenAI-compatible gateways.
            </p>
          </div>
          {selectedProvider === "custom" && (
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="custom-provider">
                Custom provider
              </label>
              <Input
                id="custom-provider"
                name="customProvider"
                value={customProvider}
                onChange={(event) => setCustomProvider(event.target.value)}
                placeholder="my-provider"
                required
              />
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">API key (optional)</label>
            <div className="flex items-center gap-2">
              <Input
                name="apiKey"
                type={showApiKey ? "text" : "password"}
                defaultValue={apiKey ?? ""}
                placeholder="sk-..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey((current) => !current)}
              >
                {showApiKey ? "Hide" : "Reveal"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="global-model">Global model</label>
            <Input
              id="global-model"
              name="model"
              defaultValue={model ?? ""}
              placeholder="gpt-4.1-mini"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="global-vision-model">Global vision model</label>
            <Input
              id="global-vision-model"
              name="visionModel"
              defaultValue={visionModel ?? ""}
              placeholder="gpt-4.1-mini"
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="sm">Save AI settings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
