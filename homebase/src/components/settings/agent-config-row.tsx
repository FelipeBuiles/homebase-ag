"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { updateAgentConfigAction } from "@/actions/settings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgentConfigRowProps {
  agentId: string;
  label: string;
  config?: {
    enabled: boolean;
    llmOverride?: string | null;
    modelOverride?: string | null;
  };
}

export function AgentConfigRow({ agentId, label, config }: AgentConfigRowProps) {
  const [enabled, setEnabled] = useState(config?.enabled ?? true);
  const [llmOverride, setLlmOverride] = useState(config?.llmOverride ?? "");
  const [modelOverride, setModelOverride] = useState(config?.modelOverride ?? "");
  const [expanded, setExpanded] = useState(false);

  const { execute, isPending } = useAction(updateAgentConfigAction, {
    onSuccess: () => toast.success(`${label} settings saved`),
    onError: () => toast.error("Failed to save"),
  });

  return (
    <div className="border border-base-200 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-base-50"
        onClick={() => setExpanded((v) => !v)}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const next = !enabled;
            setEnabled(next);
            execute({ agentId, enabled: next, llmOverride: llmOverride || undefined, modelOverride: modelOverride || undefined });
          }}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${
            enabled ? "bg-accent-500" : "bg-base-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm font-medium text-base-800 flex-1">{label}</span>
        <span className="text-xs text-base-400">
          {llmOverride || modelOverride ? "Override active" : "Using global"}
        </span>
        <svg
          className={`h-4 w-4 text-base-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-base-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-base-600">Provider override</label>
              <Input
                value={llmOverride}
                onChange={(e) => setLlmOverride(e.target.value)}
                placeholder="e.g. openai (leave blank for global)"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-base-600">Model override</label>
              <Input
                value={modelOverride}
                onChange={(e) => setModelOverride(e.target.value)}
                placeholder="e.g. gpt-4o (leave blank for global)"
                className="text-xs"
              />
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => execute({ agentId, enabled, llmOverride: llmOverride || undefined, modelOverride: modelOverride || undefined })}
          >
            {isPending ? "Saving..." : "Save overrides"}
          </Button>
        </div>
      )}
    </div>
  );
}
