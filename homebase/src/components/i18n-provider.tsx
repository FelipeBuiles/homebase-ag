"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { getMessages, type SupportedLocale } from "@/lib/i18n/messages";

type I18nContextValue = {
  locale: SupportedLocale;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: SupportedLocale;
  children: ReactNode;
}) {
  const dictionary = useMemo(() => getMessages(locale), [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, vars) => {
        const template = dictionary[key] ?? key;
        if (!vars) return template;
        return template.replace(/\{(\w+)\}/g, (_, token) => String(vars[token] ?? ""));
      },
    }),
    [dictionary, locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return value;
}
