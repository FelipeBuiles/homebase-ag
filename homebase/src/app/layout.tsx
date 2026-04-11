import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { getAppConfig } from "@/lib/db/queries/settings";
import { isSupportedLocale } from "@/lib/i18n/messages";
import { validateServerEnv } from "@/lib/env";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HomeBase",
  description: "Household management",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  validateServerEnv();
  const config = await getAppConfig();
  const locale = isSupportedLocale(config.appLocale) ? config.appLocale : "en";

  return (
    <html
      lang={locale}
      className={cn("h-full antialiased", dmSans.variable, fraunces.variable)}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
