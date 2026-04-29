"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

interface TopBarProps {
  name: string | null;
}

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function TopBar({ name }: TopBarProps) {
  // Render a neutral placeholder during SSR + hydration; the real time-of-day
  // greeting kicks in once we know the user's local hour.
  const [greeting, setGreeting] = useState<string>("Hello");

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  const display = name ?? "friend";

  return (
    <header
      className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[var(--border-1)] bg-bg/85 px-5 backdrop-blur md:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.22em] text-fg-dim">
          {greeting}
        </p>
        <p className="truncate font-[family-name:var(--font-display)] text-base text-fg">
          {display}
        </p>
      </div>
      <div className="-mr-2 flex items-center">
        <ThemeToggle />
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex h-11 w-11 items-center justify-center rounded-full text-fg-mid outline-none transition-colors hover:text-fg focus-visible:text-fg"
        >
          <Settings size={20} />
        </Link>
      </div>
    </header>
  );
}
