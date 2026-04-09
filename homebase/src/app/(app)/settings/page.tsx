import { PageShell } from "@/components/layout/page-shell";
import { getAppConfig, getAllAgentConfigs, getDbStats } from "@/lib/db/queries/settings";
import { LlmConfigForm } from "@/components/settings/llm-config-form";
import { AgentConfigRow } from "@/components/settings/agent-config-row";
import { PantryWarnForm } from "@/components/settings/pantry-warn-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

const AGENTS = [
  { id: "enrichment", label: "Enrichment agent" },
  { id: "recipe-parser", label: "Recipe parser" },
  { id: "expiration", label: "Expiration agent" },
  { id: "normalization", label: "Normalization agent" },
  { id: "chef", label: "Chef agent" },
  { id: "pantry-maintenance", label: "Pantry maintenance" },
];

export default async function SettingsPage() {
  const [config, agentConfigs, stats] = await Promise.all([
    getAppConfig(),
    getAllAgentConfigs(),
    getDbStats(),
  ]);

  const agentConfigMap = Object.fromEntries(agentConfigs.map((a) => [a.agentId, a]));

  return (
    <PageShell title="Settings">
      <div className="max-w-2xl space-y-10">

        <Section title="AI Provider" description="Configure the LLM used by all agents.">
          <LlmConfigForm config={config} />
        </Section>

        <Section
          title="Agent overrides"
          description="Enable/disable agents and override their model per-agent."
        >
          <div className="space-y-2">
            {AGENTS.map((agent) => (
              <AgentConfigRow
                key={agent.id}
                agentId={agent.id}
                label={agent.label}
                config={agentConfigMap[agent.id]}
              />
            ))}
          </div>
        </Section>

        <Section
          title="Pantry warnings"
          description="Show expiration warnings this many days before an item expires."
        >
          <PantryWarnForm days={config.pantryWarnDays} />
        </Section>

        <Section title="Security" description="Change your login password.">
          <ChangePasswordForm />
        </Section>

        <Section title="About" description="Database statistics and app information.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Inventory items", value: stats.inventory },
              { label: "Pantry items", value: stats.pantry },
              { label: "Recipes", value: stats.recipes },
              { label: "Grocery lists", value: stats.groceryLists },
              { label: "Meal plans", value: stats.mealPlans },
              { label: "Pending reviews", value: stats.proposals.pending },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-base-200 bg-white p-3">
                <p className="text-2xl font-semibold text-base-900 tabular-nums">{value}</p>
                <p className="text-xs text-base-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-base-400 mt-3">
            Proposals — accepted: {stats.proposals.accepted} · rejected: {stats.proposals.rejected}
          </p>
        </Section>
      </div>
    </PageShell>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="border-b border-base-100 pb-3">
        <h2 className="text-base font-semibold text-base-900">{title}</h2>
        {description && <p className="text-sm text-base-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}
