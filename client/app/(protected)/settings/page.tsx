import { redirect } from "next/navigation";
import { getAppConfig } from "@/lib/settings";
import { UpdatePasswordForm, RemovePasswordForm } from "./PasswordForms";
import { OrganizationSettings } from "./OrganizationSettings";
import { AiProviderSettings } from "./AiProviderSettings";
import { AgentSettings } from "./AgentSettings";

export default async function SettingsPage() {
  const config = await getAppConfig();
  if (!config?.setupComplete) {
    redirect("/setup");
  }

  const requiresCurrent = Boolean(config?.passwordHash);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage security and organization options.</p>
      </div>
      <AiProviderSettings
        provider={config?.llmProvider}
        baseUrl={config?.llmBaseUrl}
        apiKey={config?.llmApiKey}
      />
      <AgentSettings />
      <OrganizationSettings />
      <div className="grid gap-6 md:grid-cols-2">
        <UpdatePasswordForm requiresCurrent={requiresCurrent} />
        <RemovePasswordForm requiresCurrent={requiresCurrent} />
      </div>
    </div>
  );
}
