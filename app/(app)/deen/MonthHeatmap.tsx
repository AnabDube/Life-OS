"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  formatDateLocal,
  parseDateLocal,
  startOfMonth,
} from "@/lib/dates";
import { dailyCompletionRatios, type LogIndex } from "@/lib/stats";
import type { Habit } from "@/types";

interface MonthHeatmapProps {
  monthAnchor: Date;
  habits: Habit[];
  index: LogIndex;
  todayIso: string;
  onSelectDate: (iso: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function tintForRatio(ratio: number): string {
  if (ratio === 0) return "bg-bg-2 text-fg-mid";
  if (ratio < 0.34) return "bg-green-dim/25 text-fg";
  if (ratio < 0.67) return "bg-green-dim/50 text-fg";
  if (ratio < 1) return "bg-green/60 text-bg";
  return "bg-green text-bg";
}

export default function MonthHeatmap({
  monthAnchor,
  habits,
  index,
  todayIso,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: MonthHeatmapProps) {
  const monthStart = startOfMonth(monthAnchor);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const monthEnd = new Date(year, month + 1, 0);
  const leadingBlanks = monthStart.getDay();
  const totalCells = leadingBlanks + monthEnd.getDate();
  const rows = Math.ceil(totalCells / 7);
  const cells = rows * 7;

  const ratios = useMemo(
    () =>
      dailyCompletionRatios(
        habits,
        index,
        formatDateLocal(monthStart),
        formatDateLocal(monthEnd),
      ),
    [habits, index, monthStart, monthEnd],
  );

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(monthStart);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={onPrevMonth}
          className="flex h-10 w-10 items-center justify-center rounded-full text-fg-mid outline-none transition-colors hover:bg-bg-2 hover:text-fg focus-visible:bg-bg-2"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-[family-name:var(--font-display)] text-base text-fg">
          {monthLabel}
        </p>
        <button
          type="button"
          aria-label="Next month"
          onClick={onNextMonth}
          className="flex h-10 w-10 items-center justify-center rounded-full text-fg-mid outline-none transition-colors hover:bg-bg-2 hover:text-fg focus-visible:bg-bg-2"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className="text-center text-[10px] uppercase tracking-wider text-fg-dim"
          >
            {label}
          </div>
        ))}
        {Array.from({ length: cells }, (_, i) => {
          const dayNumber = i - leadingBlanks + 1;
          if (dayNumber < 1 || dayNumber > monthEnd.getDate()) {
            return <div key={`blank-${i}`} className="aspect-square" />;
          }
          const date = new Date(year, month, dayNumber);
          const iso = formatDateLocal(date);
          const ratio = ratios.get(iso) ?? 0;
          const isToday = iso === todayIso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              aria-label={`${iso} — ${Math.round(ratio * 100)}% complete`}
              className={
                "aspect-square rounded-md text-xs outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--border-2)] " +
                tintForRatio(ratio) +
                (isToday ? " ring-1 ring-gold/70" : "")
              }
            >
              {dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Re-anchor month forward / backward without exposing Date math to callers.
export function moveMonth(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
}

// Helper used by the parent to scroll the day strip back to a clicked heatmap cell.
export { addDays, parseDateLocal };
