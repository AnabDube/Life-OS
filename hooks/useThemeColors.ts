"use client";

import { useEffect, useState } from "react";

/**
 * Theme-aware colour values for places that can't use CSS variables directly
 * (e.g. SVG `fill`/`stroke` attributes inside Recharts). Reads computed CSS
 * custom properties on `<html>` and re-runs whenever `data-theme` changes.
 */
export interface ThemeColors {
  green: string;
  gold: string;
  danger: string;
  fgMid: string;
  fgDim: string;
  border1: string;
  card: string;
}

const FALLBACK: ThemeColors = {
  green: "#4ade80",
  gold: "#d4a94a",
  danger: "#f87171",
  fgMid: "#8aab82",
  fgDim: "#4d6648",
  border1: "rgba(74,222,128,0.08)",
  card: "#1a2a16",
};

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(FALLBACK);

  useEffect(() => {
    function read(): ThemeColors {
      const s = getComputedStyle(document.documentElement);
      const get = (name: string, fallback: string) =>
        s.getPropertyValue(name).trim() || fallback;
      return {
        green: get("--green", FALLBACK.green),
        gold: get("--gold", FALLBACK.gold),
        danger: get("--danger-text", FALLBACK.danger),
        fgMid: get("--fg-mid", FALLBACK.fgMid),
        fgDim: get("--fg-dim", FALLBACK.fgDim),
        border1: get("--border-1", FALLBACK.border1),
        card: get("--card", FALLBACK.card),
      };
    }
    setColors(read());
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
