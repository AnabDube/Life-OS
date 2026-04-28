"use client";

import type { ClassRow } from "@/types";
import { addDays, parseDateLocal } from "@/lib/dates";

interface ClassCardProps {
  classRow: ClassRow;
  todayIso: string;
  attendedRecently: number;
  onClick: () => void;
}

function nextSessionLabel(classRow: ClassRow, todayIso: string): string | null {
  const days = classRow.schedule_days;
  if (!days || days.length === 0 || !classRow.schedule_time) return null;
  const today = parseDateLocal(todayIso);
  for (let i = 0; i < 14; i++) {
    const d = addDays(today, i);
    if (days.includes(d.getDay())) {
      const label =
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(d);
      return `${label} · ${classRow.schedule_time}`;
    }
  }
  return null;
}

export default function ClassCard({
  classRow,
  todayIso,
  attendedRecently,
  onClick,
}: ClassCardProps) {
  const next = nextSessionLabel(classRow, todayIso);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-1.5 rounded-[10px] border border-[var(--border-1)] bg-bg-2 p-4 text-left outline-none transition-colors hover:border-[var(--border-2)] hover:bg-bg-3 focus-visible:border-[var(--border-2)]"
    >
      <p className="truncate text-sm font-medium text-fg">{classRow.name}</p>
      {classRow.platform ? (
        <p className="truncate text-[11px] text-fg-mid">{classRow.platform}</p>
      ) : null}
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="truncate text-[11px] text-gold">
          {next ?? "No schedule set"}
        </p>
        <p className="shrink-0 text-[10px] uppercase tracking-wider text-fg-dim">
          {attendedRecently} recent
        </p>
      </div>
    </button>
  );
}
