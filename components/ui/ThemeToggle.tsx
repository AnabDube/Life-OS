"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export type Theme = "dark" | "light";
const STORAGE_KEY = "life-os-theme";

function readStored(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(theme: Theme): void {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

interface ThemeToggleProps {
  /**
   * `icon` — circular icon-only button (top bar / sidebar).
   * `row`  — horizontal row with label (settings page).
   */
  variant?: "icon" | "row";
  className?: string;
}

export default function ThemeToggle({
  variant = "icon",
  className = "",
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readStored());
    setMounted(true);
  }, []);

  function toggle(): void {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage may be disabled in some private modes — ignore */
    }
  }

  // Render dark icon during SSR + first paint to avoid hydration mismatch.
  const display: Theme = mounted ? theme : "dark";

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={display === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className={
          "flex h-11 w-full items-center gap-3 rounded-[10px] px-3 text-fg-mid outline-none transition-colors hover:bg-bg-3 hover:text-fg focus-visible:bg-bg-3 " +
          className
        }
      >
        {display === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        <span className="text-sm">
          {display === "dark" ? "Light mode" : "Dark mode"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={display === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={
        "flex h-11 w-11 items-center justify-center rounded-full text-fg-mid outline-none transition-colors hover:text-fg focus-visible:text-fg " +
        className
      }
    >
      {display === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
