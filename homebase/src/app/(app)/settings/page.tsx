import { PageShell } from "@/components/layout/page-shell";
import { getAppConfig, getAllAgentConfigs, getDbStats } from "@/lib/db/queries/settings";
import { LlmConfigForm } from "@/components/settings/llm-config-form";
import { AgentConfigRow } from "@/components/settings/agent-config-row";
import { PantryWarnForm } from "@/components/settings/pantry-warn-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { LanguageForm } from "@/components/settings/language-form";
import { DevToolsPanel } from "@/components/settings/dev-tools-panel";
import { getI18n } from "@/lib/i18n/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Globe2, Info, Lock, TestTube2 } from "lucide-react";

const AGENTS = [
  { id: "enrichment", label: "Enrichment agent" },
  { id: "recipe-parser", label: "Recipe parser" },
  { id: "expiration", label: "Expiration agent" },
  { id: "normalization", label: "Normalization agent" },
  { id: "chef", label: "Chef agent" },
  { id: "pantry-maintenance", label: "Pantry maintenance" },
];

export default async function SettingsPage() {
  const [config, agentConfigs, stats, { t }] = await Promise.all([
    getAppConfig(),
    getAllAgentConfigs(),
    getDbStats(),
    getI18n(),
  ]);

  const agentConfigMap = Object.fromEntries(agentConfigs.map((a) => [a.agentId, a]));

  return (
    <PageShell
      title={t("pages.settings.title")}
      description={t("settings.page.description")}
    >
      <Tabs defaultValue="general" className="max-w-5xl md:flex-row md:items-start md:gap-6" orientation="vertical">
        <TabsList
          variant="line"
          className="w-full rounded-2xl border border-base-200 bg-white p-2 md:sticky md:top-20 md:w-64 md:flex-col md:items-stretch md:self-start"
        >
          <TabTrigger value="general" icon={<Globe2 className="h-4 w-4" />}>
            {t("settings.tabs.general")}
          </TabTrigger>
          <TabTrigger value="ai" icon={<Bot className="h-4 w-4" />}>
            {t("settings.tabs.ai")}
          </TabTrigger>
          <TabTrigger value="security" icon={<Lock className="h-4 w-4" />}>
            {t("settings.tabs.security")}
          </TabTrigger>
          <TabTrigger value="developer" icon={<TestTube2 className="h-4 w-4" />}>
            {t("settings.tabs.developer")}
          </TabTrigger>
          <TabTrigger value="about" icon={<Info className="h-4 w-4" />}>
            {t("settings.tabs.about")}
          </TabTrigger>
        </TabsList>

        <div className="min-w-0 flex-1">
          <TabsContent value="general" className="space-y-6">
            <SectionCard
              title={t("settings.sections.language.title")}
              description={t("settings.sections.language.description")}
            >
              <LanguageForm locale={config.appLocale as "en" | "es" | "fr"} />
            </SectionCard>

            <SectionCard
              title={t("settings.sections.pantry.title")}
              description={t("settings.sections.pantry.description")}
            >
              <PantryWarnForm days={config.pantryWarnDays} />
            </SectionCard>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <SectionCard
              title={t("settings.sections.ai.title")}
              description={t("settings.sections.ai.description")}
            >
              <LlmConfigForm config={config} />
            </SectionCard>

            <SectionCard
              title={t("settings.sections.agents.title")}
              description={t("settings.sections.agents.description")}
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
            </SectionCard>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SectionCard
              title={t("settings.sections.security.title")}
              description={t("settings.sections.security.description")}
            >
              <ChangePasswordForm />
            </SectionCard>
          </TabsContent>

          <TabsContent value="developer" className="space-y-6">
            <SectionCard
              title={t("settings.sections.dev.title")}
              description={t("settings.sections.dev.description")}
            >
              <DevToolsPanel />
            </SectionCard>
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <SectionCard
              title={t("settings.sections.about.title")}
              description={t("settings.sections.about.description")}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: t("settings.about.inventoryItems"), value: stats.inventory },
                  { label: t("settings.about.pantryItems"), value: stats.pantry },
                  { label: t("settings.about.recipes"), value: stats.recipes },
                  { label: t("settings.about.groceryLists"), value: stats.groceryLists },
                  { label: t("settings.about.mealPlans"), value: stats.mealPlans },
                  { label: t("settings.about.pendingReviews"), value: stats.proposals.pending },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-base-200 bg-base-50 p-3">
                    <p className="text-2xl font-semibold text-base-900 tabular-nums">{value}</p>
                    <p className="mt-0.5 text-xs text-base-500">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-base-400">
                {t("settings.about.proposalsSummary", {
                  accepted: stats.proposals.accepted,
                  rejected: stats.proposals.rejected,
                })}
              </p>
            </SectionCard>
          </TabsContent>
        </div>
      </Tabs>
    </PageShell>
  );
}

function TabTrigger({
  value,
  icon,
  children,
}: {
  value: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className="w-full justify-start rounded-xl px-3 py-2.5 text-sm"
    >
      {icon}
      {children}
    </TabsTrigger>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-base-200 bg-white p-5 shadow-sm">
      <div className="border-b border-base-100 pb-4">
        <h2 className="text-base font-semibold text-base-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-base-500">{description}</p>}
      </div>
      <div className="pt-4">
        {children}
      </div>
    </section>
  );
}
