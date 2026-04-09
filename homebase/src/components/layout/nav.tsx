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

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/groceries", label: "Groceries", icon: ShoppingCart },
  { href: "/pantry", label: "Pantry", icon: Archive },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/meal-plans", label: "Meal Plans", icon: CalendarDays },
];

export function Nav() {
  const pendingProposals = usePendingCount();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-base-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="flex items-center justify-between px-6 h-14 max-w-5xl mx-auto w-full">
        {/* Logo */}
        <Link href="/" className="font-display text-lg font-semibold text-base-900">
          HomeBase
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive(item.href)
                    ? "text-accent-600 font-medium bg-accent-600/5"
                    : "text-base-600 hover:text-base-900 hover:bg-base-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/review"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
              isActive("/review")
                ? "text-accent-600 font-medium bg-accent-600/5"
                : "text-base-600 hover:text-base-900 hover:bg-base-100"
            )}
          >
            <Inbox className="h-4 w-4" />
            Review
            {pendingProposals > 0 && (
              <span className="ml-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-warning text-white text-xs font-medium">
                {pendingProposals}
              </span>
            )}
          </Link>
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
              isActive("/settings")
                ? "text-accent-600 font-medium bg-accent-600/5"
                : "text-base-600 hover:text-base-900 hover:bg-base-100"
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-base-600 hover:bg-base-100 hover:text-base-900"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-col py-4">
              {[...navItems, { href: "/review", label: "Review", icon: Inbox }, { href: "/settings", label: "Settings", icon: Settings }].map(
                (item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 text-sm transition-colors",
                        isActive(item.href)
                          ? "text-accent-600 font-medium bg-accent-600/5"
                          : "text-base-600 hover:text-base-900 hover:bg-base-100"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
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
