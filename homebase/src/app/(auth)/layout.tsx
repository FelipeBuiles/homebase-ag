import { Providers } from "@/components/providers";
import { getAppConfig } from "@/lib/db/queries/settings";
import { isSupportedLocale } from "@/lib/i18n/messages";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getAppConfig();
  const locale = isSupportedLocale(config.appLocale) ? config.appLocale : "en";

  return (
    <Providers locale={locale}>
      <div className="min-h-screen bg-[linear-gradient(180deg,rgba(253,248,241,0.98),rgba(247,239,226,0.98))]">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </Providers>
  );
}
