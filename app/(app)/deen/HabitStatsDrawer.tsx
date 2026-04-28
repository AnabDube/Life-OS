"use client";

import { useMemo, useEffect } from "react";
import { X, Flame } from "lucide-react";
import { computeHabitStats, type LogIndex } from "@/lib/stats";
import type { Habit } from "@/types";

interface HabitStatsDrawerProps {
  habit: Habit | null;
  index: LogIndex;
  todayIso: string;
  onClose: () => void;
}

export default function HabitStatsDrawer({
  habit,
  index,
  todayIso,
  onClose,
}: HabitStatsDrawerProps) {
  useEffect(() => {
    if (!habit) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [habit, onClose]);

  const stats = useMemo(() => {
    if (!habit) return null;
    return computeHabitStats(
      habit,
      index.get(habit.id) ?? new Set<string>(),
      todayIso,
    );
  }, [habit, index, todayIso]);

  if (!habit || !stats) return null;

  const items = [
    { label: "Current streak", value: String(stats.current), accent: stats.current >= 2 },
    { label: "Longest ever", value: String(stats.longest), accent: false },
    { label: "Total completions", value: String(stats.total), accent: false },
    { label: "Consistency", value: `${stats.consistencyPercent}%`, accent: false },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${habit.name} stats`}
      className="fixed inset-0 z-50 flex"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div className="flex w-full flex-col bg-card md:w-[420px] md:border-l md:border-[var(--border-1)]">
        <header className="flex items-start justify-between border-b border-[var(--border-1)] p-5">
          <div className="min-w-0 flex-1 pr-3">
            <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
              {habit.category}
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-fg">
              {habit.name}
            </h2>
            {habit.detail ? (
              <p className="mt-1 text-xs text-fg-mid">{habit.detail}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-fg-mid outline-none transition-colors hover:bg-bg-2 hover:text-fg focus-visible:bg-bg-2"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-3 p-5">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-4 py-3"
            >
              <span className="text-xs uppercase tracking-wider text-fg-mid">
                {item.label}
              </span>
              <span
                className={
                  "flex items-center gap-1 font-[family-name:var(--font-display)] text-xl font-semibold " +
                  (item.accent ? "text-gold" : "text-fg")
                }
              >
                {item.accent ? <Flame size={14} /> : null}
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
