"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const GLOBAL_VALUE = "__global__";

const PROVIDER_OPTIONS = [
  { value: GLOBAL_VALUE, label: "Use global" },
  { value: "ollama", label: "Ollama" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Gemini" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "Custom" },
] as const;

const KNOWN_PROVIDERS = new Set(
  PROVIDER_OPTIONS.filter((option) => option.value !== GLOBAL_VALUE && option.value !== "custom")
    .map((option) => option.value)
);

type ProviderOverrideSelectProps = {
  name: string;
  defaultValue?: string | null;
};

export function ProviderOverrideSelect({ name, defaultValue }: ProviderOverrideSelectProps) {
  const normalizedValue = defaultValue?.trim().toLowerCase() ?? "";
  const isKnownProvider = normalizedValue ? KNOWN_PROVIDERS.has(normalizedValue) : false;
  const isLiteralCustom = normalizedValue === "custom";
  const initialProvider = normalizedValue
    ? isKnownProvider
      ? normalizedValue
      : "custom"
    : GLOBAL_VALUE;
  const initialCustom = normalizedValue && !isKnownProvider && !isLiteralCustom
    ? defaultValue?.trim() ?? ""
    : "";

  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [customProvider, setCustomProvider] = useState(initialCustom);

  const effectiveProvider = useMemo(() => {
    if (selectedProvider === GLOBAL_VALUE) return "";
    if (selectedProvider !== "custom") return selectedProvider;
    return customProvider.trim();
  }, [customProvider, selectedProvider]);

  return (
    <div className="space-y-2">
      <Select value={selectedProvider} onValueChange={setSelectedProvider}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Use global" />
        </SelectTrigger>
        <SelectContent>
          {PROVIDER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedProvider === "custom" && (
        <Input
          name={`${name}Custom`}
          aria-label="Custom provider"
          value={customProvider}
          onChange={(event) => setCustomProvider(event.target.value)}
          placeholder="my-provider"
          required
        />
      )}
      <input type="hidden" name={name} value={effectiveProvider} />
    </div>
  );
}
