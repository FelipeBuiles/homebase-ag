"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Calendar, Home, Inbox, Package, ShoppingCart, Utensils, Box, Settings } from "lucide-react";

const iconMap = {
  home: Home,
  review: Inbox,
  inventory: Package,
  groceries: ShoppingCart,
  pantry: Box,
  recipes: Utensils,
  "meal-plans": Calendar,
  activity: Activity,
  settings: Settings,
};

type IconName = keyof typeof iconMap;

type NavLinkProps = {
  href: string;
  label: string;
  iconName: IconName;
};

export function NavLink({ href, label, iconName }: NavLinkProps) {
  const pathname = usePathname();
  const isHome = href === "/";
  const active = isHome ? pathname === "/" : pathname.startsWith(`${href}/`) || pathname === href;
  const Icon = iconMap[iconName];

  return (
    <Link href={href} className="nav-pill" data-active={active}>
      <Icon size={16} />
      {label}
    </Link>
  );
}
