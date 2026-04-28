import { Sunrise, Moon, Briefcase, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** The 5 primary tabs shown in the sidebar (desktop) and bottom nav (mobile). */
export const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/today",   label: "Today",   icon: Sunrise    },
  { href: "/deen",    label: "Deen",    icon: Moon       },
  { href: "/work",    label: "Work",    icon: Briefcase  },
  { href: "/trading", label: "Trading", icon: TrendingUp },
  { href: "/money",   label: "Money",   icon: Wallet     },
] as const;

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
