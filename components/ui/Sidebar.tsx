"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { NAV_ITEMS, isNavItemActive } from "./nav-items";
import ThemeToggle from "./ThemeToggle";
import type { Profile } from "@/types";

interface SidebarProps {
  profile: Profile | null;
  email: string | null;
}

export default function Sidebar({ profile, email }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const displayName = profile?.name ?? email ?? "Welcome";
  const initial = (profile?.name?.[0] ?? email?.[0] ?? "?").toUpperCase();

  return (
    <aside className="sticky top-0 z-20 hidden h-[100dvh] w-[72px] shrink-0 flex-col border-r border-[var(--border-1)] bg-sidebar-bg md:flex lg:w-[228px]">
      <div className="flex items-center gap-3 px-4 py-5">
        {profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--green-glow-strong)] font-[family-name:var(--font-display)] text-base text-green">
            {initial}
          </div>
        )}
        <div className="hidden min-w-0 flex-col lg:flex">
          <p className="truncate text-sm font-medium text-fg">{displayName}</p>
          {email ? (
            <p className="truncate text-[11px] text-fg-mid">{email}</p>
          ) : null}
        </div>
      </div>

      <div className="hidden border-y border-[var(--border-1)] px-4 py-3 lg:block">
        <p className="font-[family-name:var(--font-display)] text-[12px] uppercase tracking-[0.22em] text-gold opacity-90">
          Life OS
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={
                "group flex h-11 items-center gap-3 rounded-[10px] px-3 outline-none transition-colors " +
                (active
                  ? "bg-nav-active-bg text-nav-active-fg shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "text-fg-mid hover:bg-bg-3 hover:text-fg focus-visible:bg-bg-3 focus-visible:text-fg")
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden text-sm lg:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-[var(--border-1)] p-2">
        <div className="lg:hidden">
          <ThemeToggle />
        </div>
        <div className="hidden lg:block">
          <ThemeToggle variant="row" />
        </div>
        <Link
          href="/settings"
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={
            "flex h-11 items-center gap-3 rounded-[10px] px-3 outline-none transition-colors " +
            (pathname.startsWith("/settings")
              ? "bg-nav-active-bg text-nav-active-fg shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
              : "text-fg-mid hover:bg-bg-3 hover:text-fg focus-visible:bg-bg-3 focus-visible:text-fg")
          }
        >
          <Settings size={18} className="shrink-0" />
          <span className="hidden text-sm lg:inline">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
