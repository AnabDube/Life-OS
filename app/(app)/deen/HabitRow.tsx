"use client";

import { useRef } from "react";
import { Check, Flame } from "lucide-react";
import type { Habit } from "@/types";

interface HabitRowProps {
  habit: Habit;
  done: boolean;
  streak: number;
  onToggle: () => void;
  onOpenStats: () => void;
  /** Fires after a 600ms long-press; only attached for custom habits. */
  onLongPressDelete?: () => void;
}

const LONG_PRESS_MS = 600;

export default function HabitRow({
  habit,
  done,
  streak,
  onToggle,
  onOpenStats,
  onLongPressDelete,
}: HabitRowProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  function startLongPress(): void {
    if (!onLongPressDelete) return;
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPressDelete();
    }, LONG_PRESS_MS);
  }
  function cancelLongPress(): void {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  return (
    <li
      className={
        "flex items-center gap-3 rounded-[10px] px-2 py-1.5 transition-colors " +
        (done ? "bg-[var(--green-glow)]" : "")
      }
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        aria-label={`${done ? "Unmark" : "Mark"} ${habit.name} done`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md outline-none focus-visible:bg-bg-2"
      >
        <span
          className={
            "flex h-6 w-6 items-center justify-center rounded-md border transition-colors " +
            (done
              ? "border-green bg-green text-bg"
              : "border-[var(--border-2)] bg-transparent")
          }
        >
          {done ? <Check size={14} strokeWidth={3} /> : null}
        </span>
      </button>

      <button
        type="button"
        onClick={(e) => {
          if (firedRef.current) {
            e.preventDefault();
            return;
          }
          onOpenStats();
        }}
        className="min-w-0 flex-1 text-left outline-none focus-visible:underline"
      >
        <p className="truncate text-sm text-fg">{habit.name}</p>
        {habit.detail ? (
          <p className="truncate text-[11px] text-fg-mid">{habit.detail}</p>
        ) : null}
      </button>

      {streak >= 2 ? (
        <span
          className="flex shrink-0 items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold"
          aria-label={`${streak} day streak`}
        >
          <Flame size={11} />
          {streak}
        </span>
      ) : null}
    </li>
  );
}
