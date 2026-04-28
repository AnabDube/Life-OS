"use client";

import type { TradeFilter } from "@/lib/trades";
import type { Trade } from "@/types";

interface TradeFiltersProps {
  filter: TradeFilter;
  onChange: (next: TradeFilter) => void;
  knownPairs: string[];
}

const OUTCOMES: Array<{ value: Trade["outcome"] | undefined; label: string }> = [
  { value: undefined, label: "All" },
  { value: "win", label: "Wins" },
  { value: "loss", label: "Losses" },
  { value: "breakeven", label: "BE" },
];

const SESSIONS: Array<{ value: Trade["session"] | undefined; label: string }> = [
  { value: undefined, label: "All sessions" },
  { value: "london", label: "London" },
  { value: "new_york", label: "New York" },
  { value: "asian", label: "Asian" },
  { value: "overlap", label: "Overlap" },
];

export default function TradeFilters({ filter, onChange, knownPairs }: TradeFiltersProps) {
  function set<K extends keyof TradeFilter>(key: K, value: TradeFilter[K]): void {
    onChange({ ...filter, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-[var(--border-1)] bg-bg-2 p-3">
      <div className="flex flex-wrap gap-1.5">
        {OUTCOMES.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => set("outcome", o.value)}
            aria-pressed={filter.outcome === o.value}
            className={
              "rounded-full border px-3 py-1 text-xs transition-colors " +
              (filter.outcome === o.value
                ? "border-green/50 bg-[var(--green-glow)] text-green"
                : "border-[var(--border-1)] bg-card text-fg-mid hover:border-[var(--border-2)]")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          value={filter.session ?? ""}
          onChange={(e) => set("session", (e.target.value || undefined) as Trade["session"] | undefined)}
          className="h-9 rounded-md border border-[var(--border-1)] bg-card px-2 text-xs text-fg outline-none focus:border-[var(--border-2)]"
        >
          {SESSIONS.map((s) => (
            <option key={s.label} value={s.value ?? ""}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={filter.pair ?? ""}
          onChange={(e) => set("pair", e.target.value || undefined)}
          className="h-9 rounded-md border border-[var(--border-1)] bg-card px-2 text-xs text-fg outline-none focus:border-[var(--border-2)]"
        >
          <option value="">All pairs</option>
          {knownPairs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          <input
            type="date"
            value={filter.from ?? ""}
            onChange={(e) => set("from", e.target.value || undefined)}
            aria-label="From date"
            className="h-9 flex-1 rounded-md border border-[var(--border-1)] bg-card px-2 text-xs text-fg outline-none focus:border-[var(--border-2)]"
          />
          <input
            type="date"
            value={filter.to ?? ""}
            onChange={(e) => set("to", e.target.value || undefined)}
            aria-label="To date"
            className="h-9 flex-1 rounded-md border border-[var(--border-1)] bg-card px-2 text-xs text-fg outline-none focus:border-[var(--border-2)]"
          />
        </div>
      </div>
    </div>
  );
}
