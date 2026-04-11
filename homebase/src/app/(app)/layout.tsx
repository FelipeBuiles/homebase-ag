import { Nav } from "@/components/layout/nav";
import { Providers } from "@/components/providers";
import { PendingCountProvider } from "@/components/layout/pending-count-provider";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { Toaster } from "@/components/ui/sonner";
import { getPendingProposalCount } from "@/lib/db/queries/proposals";
import { getAppConfig } from "@/lib/db/queries/settings";
import { isSupportedLocale } from "@/lib/i18n/messages";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pendingCount, config] = await Promise.all([
    getPendingProposalCount(),
    getAppConfig(),
  ]);
  const locale = isSupportedLocale(config.appLocale) ? config.appLocale : "en";

  return (
    <Providers locale={locale}>
      <PendingCountProvider initial={pendingCount}>
        <Nav />
        <main className="flex-1">{children}</main>
        <KeyboardShortcuts />
        <Toaster />
      </PendingCountProvider>
    </Providers>
  );
}
