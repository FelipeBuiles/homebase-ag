"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ProviderOverrideSelect } from "./ProviderOverrideSelect";

type AgentOverrideFieldsProps = {
  agentId: string;
  overrideEnabled?: boolean | null;
  providerOverride?: string | null;
  modelOverride?: string | null;
  visionModelOverride?: string | null;
};

export function AgentOverrideFields({
  agentId,
  overrideEnabled,
  providerOverride,
  modelOverride,
  visionModelOverride,
}: AgentOverrideFieldsProps) {
  const [enabled, setEnabled] = useState(Boolean(overrideEnabled));

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="overrideEnabled"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        Override global settings
      </label>
      {enabled && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Override provider</label>
            <ProviderOverrideSelect
              name="providerOverride"
              defaultValue={providerOverride ?? ""}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`${agentId}-model-override`}>
              Override model
            </label>
            <Input
              id={`${agentId}-model-override`}
              name="modelOverride"
              defaultValue={modelOverride ?? ""}
              placeholder="gpt-4.1-mini"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor={`${agentId}-vision-override`}>
              Override vision model
            </label>
            <Input
              id={`${agentId}-vision-override`}
              name="visionModelOverride"
              defaultValue={visionModelOverride ?? ""}
              placeholder="gpt-4.1-mini"
            />
          </div>
        </div>
      )}
    </div>
  );
}
