import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateAiProvider } from "./ai-actions";

type AiProviderSettingsProps = {
  provider?: string | null;
  baseUrl?: string | null;
  apiKey?: string | null;
};

export function AiProviderSettings({ provider, baseUrl, apiKey }: AiProviderSettingsProps) {
  return (
    <Card className="bg-card/80">
      <CardHeader>
        <CardTitle>AI provider</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={updateAiProvider} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Input name="provider" defaultValue={provider ?? "ollama"} placeholder="ollama" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Base URL</label>
            <Input name="baseUrl" defaultValue={baseUrl ?? "http://localhost:11434"} placeholder="http://localhost:11434" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">API key (optional)</label>
            <Input name="apiKey" defaultValue={apiKey ?? ""} placeholder="sk-..." />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="sm">Save AI settings</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
