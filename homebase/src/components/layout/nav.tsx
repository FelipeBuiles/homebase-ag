"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  ShoppingCart,
  Archive,
  ChefHat,
  CalendarDays,
  Inbox,
  Settings,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { usePendingCount } from "@/components/layout/pending-count-provider";
import { useI18n } from "@/components/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages";

const navItems: Array<{ href: string; labelKey: MessageKey; icon: typeof Home }> = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/pantry", labelKey: "nav.pantry", icon: Archive },
  { href: "/recipes", labelKey: "nav.recipes", icon: ChefHat },
  { href: "/meal-plans", labelKey: "nav.mealPlans", icon: CalendarDays },
  { href: "/groceries", labelKey: "nav.groceries", icon: ShoppingCart },
  { href: "/inventory", labelKey: "nav.inventory", icon: Package },
];

const mobileNavItems: Array<{ href: string; labelKey: MessageKey; icon: typeof Home }> = [
  ...navItems,
  { href: "/review", labelKey: "nav.review", icon: Inbox },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

export function Nav() {
  const { t } = useI18n();
  const pendingProposals = usePendingCount();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(123,89,64,0.08)] bg-[rgba(252,246,238,0.84)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(252,246,238,0.72)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <nav className="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center gap-4 px-4 md:gap-6 md:px-6">
        <Link href="/" className="group inline-flex min-w-0 items-center gap-3">
          <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-[rgba(123,89,64,0.12)] bg-[linear-gradient(180deg,rgba(255,251,246,0.98),rgba(248,236,220,0.96))] shadow-[0_12px_30px_rgba(92,67,46,0.12)] transition-transform duration-300 group-hover:scale-[1.03]">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.9),transparent_36%)]" />
            <span className="relative font-display text-lg font-semibold text-accent-600">H</span>
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-lg font-semibold text-base-900">{t("brand.name")}</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-base-500">Home OS</span>
          </span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="flex items-center gap-1 rounded-full border border-[rgba(123,89,64,0.1)] bg-white/55 px-2 py-1.5 shadow-[0_12px_32px_rgba(92,67,46,0.06)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-all duration-300",
                  isActive(item.href)
                    ? "bg-[linear-gradient(180deg,rgba(255,250,244,0.98),rgba(246,232,216,0.98))] font-medium text-accent-600 shadow-[0_10px_24px_rgba(92,67,46,0.09)]"
                    : "text-base-600 hover:bg-white/70 hover:text-base-900"
                )}
              >
                <Icon className={cn("h-4 w-4 transition-transform duration-300", isActive(item.href) && "-rotate-6")} />
                {t(item.labelKey)}
              </Link>
            );
          })}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Link
            href="/review"
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all duration-300",
              isActive("/review")
                ? "border-[rgba(200,109,71,0.22)] bg-[linear-gradient(180deg,rgba(255,250,244,0.98),rgba(246,232,216,0.98))] font-medium text-accent-600 shadow-[0_12px_28px_rgba(92,67,46,0.08)]"
                : "border-[rgba(123,89,64,0.1)] bg-white/55 text-base-600 shadow-[0_10px_26px_rgba(92,67,46,0.05)] hover:bg-white/72 hover:text-base-900"
            )}
          >
            <Inbox className="h-4 w-4" />
            {t("nav.review")}
            {pendingProposals > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-xs font-medium text-white shadow-[0_8px_18px_rgba(215,146,75,0.35)]">
                {pendingProposals}
              </span>
            )}
          </Link>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-all duration-300",
              isActive("/settings")
                ? "border-[rgba(200,109,71,0.22)] bg-[linear-gradient(180deg,rgba(255,250,244,0.98),rgba(246,232,216,0.98))] font-medium text-accent-600 shadow-[0_12px_28px_rgba(92,67,46,0.08)]"
                : "border-[rgba(123,89,64,0.1)] bg-white/55 text-base-600 shadow-[0_10px_26px_rgba(92,67,46,0.05)] hover:bg-white/72 hover:text-base-900"
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="ml-auto inline-flex items-center justify-center rounded-2xl border border-[rgba(123,89,64,0.1)] bg-white/60 p-2.5 text-base-600 shadow-[0_10px_26px_rgba(92,67,46,0.06)] hover:bg-white/82 hover:text-base-900 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 border-l border-[rgba(123,89,64,0.08)] bg-[linear-gradient(180deg,rgba(255,251,247,0.98),rgba(250,241,229,0.98))] p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-col py-4">
              <div className="px-6 pb-4">
                <div className="rounded-[1.4rem] border border-[rgba(123,89,64,0.1)] bg-white/72 p-4 shadow-[0_16px_34px_rgba(92,67,46,0.08)]">
                  <p className="font-display text-lg font-semibold text-base-900">{t("brand.name")}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-base-500">Home OS</p>
                </div>
              </div>
              {mobileNavItems.map(
                (item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "mx-3 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all duration-300",
                        isActive(item.href)
                          ? "bg-[linear-gradient(180deg,rgba(255,250,244,0.98),rgba(246,232,216,0.98))] font-medium text-accent-600 shadow-[0_12px_28px_rgba(92,67,46,0.08)]"
                          : "text-base-600 hover:bg-white/72 hover:text-base-900"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t(item.labelKey)}
                      {item.href === "/review" && pendingProposals > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-warning text-white text-xs font-medium">
                          {pendingProposals}
                        </span>
                      )}
                    </Link>
                  );
                }
              )}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
