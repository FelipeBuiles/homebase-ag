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
    <div className="page-container space-y-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage security and organization options.</p>
        </div>
      </div>
      <AiProviderSettings
        provider={config?.llmProvider}
        baseUrl={config?.llmBaseUrl}
        apiKey={config?.llmApiKey}
        model={config?.llmModel}
        visionModel={config?.llmVisionModel}
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
