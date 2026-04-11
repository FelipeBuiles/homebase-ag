import { getAppConfig } from "@/lib/db/queries/settings";
import { isSupportedLocale, translate, type SupportedLocale } from "@/lib/i18n/messages";

function getServerTranslator(locale: SupportedLocale) {
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
  };
}

export async function getI18n() {
  const config = await getAppConfig();
  const locale: SupportedLocale = isSupportedLocale(config.appLocale) ? config.appLocale : "en";
  return getServerTranslator(locale);
}
