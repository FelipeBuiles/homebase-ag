import prisma from "@/lib/prisma";
import { AGENT_PROMPTS } from "@/lib/agent-prompts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateAgentConfig } from "./ai-actions";
import { ProviderOverrideSelect } from "./ProviderOverrideSelect";

export async function AgentSettings() {
  const configs = await prisma.agentConfig.findMany();
  const configMap = new Map(configs.map((config) => [config.agentId, config]));

  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle>Agent prompts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {AGENT_PROMPTS.map((agent) => {
          const config = configMap.get(agent.agentId);
          return (
            <form key={agent.agentId} action={updateAgentConfig.bind(null, agent.agentId)} className="space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{agent.label}</h3>
                  <p className="text-xs text-muted-foreground">{agent.agentId}</p>
                </div>
                <div className="flex items-center gap-2">
                  {agent.defaultVisionModel && (
                    <Badge variant="outline">Vision-enabled</Badge>
                  )}
                  <Badge variant={config?.enabled ?? true ? "default" : "outline"}>
                    {config?.enabled ?? true ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium" htmlFor={`${agent.agentId}-model`}>Model</label>
                  <Input
                    id={`${agent.agentId}-model`}
                    name="model"
                    defaultValue={config?.model ?? agent.defaultModel}
                    placeholder="llama3.1"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="enabled" defaultChecked={config?.enabled ?? true} className="h-4 w-4 accent-primary" />
                  Enabled
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium" htmlFor={`${agent.agentId}-vision-model`}>Vision model</label>
                  <Input
                    id={`${agent.agentId}-vision-model`}
                    name="visionModel"
                    defaultValue={config?.visionModel ?? agent.defaultVisionModel ?? agent.defaultModel}
                    placeholder={agent.defaultVisionModel ?? agent.defaultModel}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional. Used for image inputs.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider override</label>
                  <ProviderOverrideSelect
                    name="providerOverride"
                    defaultValue={config?.providerOverride ?? ""}
                  />
                </div>
              </div>

              <details className="rounded-xl border border-border/60 bg-background/70 p-3">
                <summary className="cursor-pointer text-sm font-medium">Advanced prompt settings</summary>
                <div className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User instructions</label>
                    <Textarea
                      name="userPrompt"
                      defaultValue={config?.userPrompt ?? ""}
                      rows={4}
                      placeholder="Add optional guidance for this agent."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">System prompt (read-only)</label>
                    <Textarea
                      defaultValue={config?.systemPrompt ?? config?.prompt ?? agent.defaultPrompt}
                      rows={6}
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground">
                      System prompt is fixed to keep agent behavior stable.
                    </p>
                  </div>
                </div>
              </details>

              <div className="flex items-center gap-2">
                <Button type="submit" size="sm">Save agent</Button>
              </div>
            </form>
          );
        })}
      </CardContent>
    </Card>
  );
}
