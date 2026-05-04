"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { toggleHabitLog } from "@/lib/habits";
import type { Habit, HabitLog } from "@/types";

interface HabitChecklistProps {
  userId: string;
  date: string;
  habits: Habit[];
  initialLogs: HabitLog[];
}

export default function HabitChecklist({
  userId,
  date,
  habits,
  initialLogs,
}: HabitChecklistProps) {
  const supabase = useMemo(() => createClient(), []);
  const [done, setDone] = useState<Set<string>>(
    () => new Set(initialLogs.filter((l) => l.done).map((l) => l.habit_id)),
  );

  async function toggle(habitId: string): Promise<void> {
    const wasDone = done.has(habitId);
    // Optimistic
    setDone((prev) => {
      const next = new Set(prev);
      if (wasDone) next.delete(habitId);
      else next.add(habitId);
      return next;
    });
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
    try {
      await toggleHabitLog(supabase, userId, habitId, date, !wasDone);
    } catch {
      // Revert on failure
      setDone((prev) => {
        const next = new Set(prev);
        if (wasDone) next.add(habitId);
        else next.delete(habitId);
        return next;
      });
    }
  }

  if (habits.length === 0) {
    return (
      <Card>
        <header className="mb-2">
          <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
            Today&apos;s habits
          </p>
        </header>
        <p className="text-sm text-fg-mid">
          No habits scheduled for today — enjoy a lighter day, or add one in
          Deen.
        </p>
      </Card>
    );
  }

  const doneCount = habits.filter((h) => done.has(h.id)).length;

  return (
    <Card>
      <header className="mb-3 flex items-baseline justify-between">
        <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
          Today&apos;s habits
        </p>
        <p className="text-xs text-fg-mid">
          {doneCount}/{habits.length} done
        </p>
      </header>

      <ul className="flex flex-col gap-1.5">
        {habits.map((habit) => {
          const isDone = done.has(habit.id);
          return (
            <li key={habit.id}>
              <button
                type="button"
                onClick={() => void toggle(habit.id)}
                aria-pressed={isDone}
                className={
                  "flex w-full min-h-[44px] items-center gap-3 rounded-[10px] px-3 py-2 text-left outline-none transition-colors " +
                  (isDone
                    ? "bg-[var(--green-glow)] text-fg"
                    : "hover:bg-bg-2 focus-visible:bg-bg-2")
                }
              >
                <span
                  className={
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-[1.5px] transition-colors " +
                    (isDone
                      ? "border-green bg-green text-bg"
                      : "border-check-empty-border bg-transparent")
                  }
                  aria-hidden="true"
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={
                      "block truncate text-sm " +
                      (isDone ? "text-fg" : "text-fg")
                    }
                  >
                    {habit.name}
                  </span>
                  {habit.detail ? (
                    <span className="block truncate text-[11px] text-fg-mid">
                      {habit.detail}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
