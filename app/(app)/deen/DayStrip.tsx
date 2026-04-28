"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatDateLocal } from "@/lib/dates";

interface DayStripProps {
  weekStart: Date;
  selectedDate: string;
  todayIso: string;
  onSelectDate: (iso: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function rangeLabel(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(d);
  return `${fmt(weekStart)} – ${fmt(end)}`;
}

export default function DayStrip({
  weekStart,
  selectedDate,
  todayIso,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: DayStripProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous week"
          onClick={onPrevWeek}
          className="flex h-10 w-10 items-center justify-center rounded-full text-fg-mid outline-none transition-colors hover:bg-bg-2 hover:text-fg focus-visible:bg-bg-2"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-xs uppercase tracking-[0.18em] text-fg-mid">
          {rangeLabel(weekStart)}
        </p>
        <button
          type="button"
          aria-label="Next week"
          onClick={onNextWeek}
          className="flex h-10 w-10 items-center justify-center rounded-full text-fg-mid outline-none transition-colors hover:bg-bg-2 hover:text-fg focus-visible:bg-bg-2"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const iso = formatDateLocal(d);
          const isSelected = iso === selectedDate;
          const isToday = iso === todayIso;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(iso)}
              aria-pressed={isSelected}
              className={
                "flex min-h-[56px] flex-col items-center justify-center rounded-[10px] border outline-none transition-colors " +
                (isSelected
                  ? "border-green/60 bg-[var(--green-glow)]"
                  : "border-[var(--border-1)] bg-bg-2 hover:border-[var(--border-2)]")
              }
            >
              <span
                className={
                  "text-[10px] uppercase tracking-wider " +
                  (isSelected ? "text-green" : "text-fg-mid")
                }
              >
                {WEEKDAY_LABELS[i]}
              </span>
              <span
                className={
                  "font-[family-name:var(--font-display)] text-base " +
                  (isToday && !isSelected ? "text-gold" : "text-fg")
                }
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
