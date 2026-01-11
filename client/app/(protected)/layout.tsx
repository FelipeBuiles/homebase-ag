import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Calendar, Home, Inbox, LogOut, Package, ShoppingCart, Utensils, Box, Settings } from "lucide-react";
import { getAppConfig } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/logout/actions";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/review", label: "Review", icon: Inbox },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/groceries", label: "Groceries", icon: ShoppingCart },
  { href: "/pantry", label: "Pantry", icon: Box },
  { href: "/recipes", label: "Recipes", icon: Utensils },
  { href: "/meal-plans", label: "Meal Plans", icon: Calendar },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
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
      <header className="sticky top-0 z-40 border-b border-white/20 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
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
              <Link key={item.href} href={item.href} className="nav-pill">
                <item.icon size={16} />
                {item.label}
              </Link>
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
