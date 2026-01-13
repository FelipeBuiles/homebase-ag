import prisma from "@/lib/prisma";
import { AGENT_PROMPTS } from "@/lib/agent-prompts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateAgentConfig } from "./ai-actions";

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
                <Badge variant={config?.enabled ?? true ? "default" : "outline"}>
                  {config?.enabled ?? true ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Model</label>
                  <Input name="model" defaultValue={config?.model ?? agent.defaultModel} placeholder="llama3.1" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="enabled" defaultChecked={config?.enabled ?? true} className="h-4 w-4 accent-primary" />
                  Enabled
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Prompt</label>
                <Textarea name="prompt" defaultValue={config?.prompt ?? agent.defaultPrompt} rows={6} />
              </div>

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
