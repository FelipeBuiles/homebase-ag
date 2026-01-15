import Link from "next/link";
import { redirect } from "next/navigation";
import { Home, LogOut } from "lucide-react";
import { getAppConfig } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/logout/actions";
import { Button } from "@/components/ui/button";
import { NavLink } from "./NavLink";

const navItems = [
  { href: "/", label: "Home", iconName: "home" },
  { href: "/review", label: "Review", iconName: "review" },
  { href: "/inventory", label: "Inventory", iconName: "inventory" },
  { href: "/groceries", label: "Groceries", iconName: "groceries" },
  { href: "/pantry", label: "Pantry", iconName: "pantry" },
  { href: "/recipes", label: "Recipes", iconName: "recipes" },
  { href: "/meal-plans", label: "Meal Plans", iconName: "meal-plans" },
  { href: "/activity", label: "Activity", iconName: "activity" },
  { href: "/settings", label: "Settings", iconName: "settings" },
];

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getAppConfig();
  if (!config?.setupComplete) {
    redirect("/setup");
  }

  if (config.passwordHash) {
    const session = await getSession();
    if (!session) {
      redirect("/login");
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Home size={18} />
            </span>
            <div className="leading-tight">
              <div className="text-lg font-serif font-semibold tracking-tight">HomeBase</div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Household OS
              </div>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
            {config.passwordHash && (
              <form action={logout}>
                <Button type="submit" variant="outline" size="sm" className="gap-2 rounded-full">
                  <LogOut size={14} />
                  Logout
                </Button>
              </form>
            )}
          </nav>
        </div>
      </header>
      <div className="page-shell">{children}</div>
    </div>
  );
}
