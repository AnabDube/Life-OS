"use client";

import { useRef, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import type { Task } from "@/types";

interface TaskRowProps {
  task: Task;
  onToggleComplete: () => void;
  onDelete: () => void;
}

const PRIORITY_BADGE: Record<Task["priority"], string> = {
  high: "border-[#ef4444]/30 bg-[#ef4444]/15 text-[#fca5a5]",
  medium: "border-gold/30 bg-gold/15 text-gold",
  low: "border-[var(--border-1)] bg-bg-3 text-fg-mid",
};

const CATEGORY_LABEL: Record<Task["category"], string> = {
  work: "Work",
  class: "Class",
  personal: "Personal",
};

const SWIPE_THRESHOLD = 60;
const REVEAL_PX = 80;

export default function TaskRow({ task, onToggleComplete, onDelete }: TaskRowProps) {
  const [revealed, setRevealed] = useState(false);
  const startXRef = useRef<number | null>(null);
  const movedRef = useRef(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>): void {
    startXRef.current = e.clientX;
    movedRef.current = false;
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    if (startXRef.current === null) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 6) movedRef.current = true;
    if (dx < -SWIPE_THRESHOLD) {
      setRevealed(true);
      startXRef.current = null;
    } else if (dx > SWIPE_THRESHOLD) {
      setRevealed(false);
      startXRef.current = null;
    }
  }
  function onPointerEnd(): void {
    startXRef.current = null;
  }

  function handleClick(): void {
    if (movedRef.current) return;
    if (revealed) {
      setRevealed(false);
      return;
    }
    onToggleComplete();
  }

  return (
    <li className="group relative overflow-hidden rounded-[10px]">
      <button
        type="button"
        aria-label={`Delete ${task.title}`}
        onClick={onDelete}
        className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-[#ef4444] text-white outline-none transition-opacity"
      >
        <Trash2 size={16} />
      </button>
      <div
        role="button"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerLeave={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleComplete();
          }
        }}
        className={
          "relative flex cursor-pointer items-center gap-3 bg-bg-2 px-3 py-3 outline-none transition-transform focus-visible:bg-bg-3 md:group-hover:-translate-x-20 " +
          (revealed ? "-translate-x-20 " : "")
        }
        style={revealed ? { transform: `translateX(-${REVEAL_PX}px)` } : undefined}
      >
        <span
          aria-hidden="true"
          className={
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors " +
            (task.completed
              ? "border-green bg-green text-bg"
              : "border-[var(--border-2)]")
          }
        >
          {task.completed ? <Check size={14} strokeWidth={3} /> : null}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={
              "truncate text-sm " +
              (task.completed ? "text-fg-mid line-through" : "text-fg")
            }
          >
            {task.title}
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-[11px] text-fg-mid">
            <span className="rounded-full border border-[var(--border-1)] bg-bg-3 px-2 py-0.5">
              {CATEGORY_LABEL[task.category]}
            </span>
            {task.due_date ? <span>due {task.due_date}</span> : null}
          </p>
        </div>

        <span
          className={
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase " +
            PRIORITY_BADGE[task.priority]
          }
        >
          {task.priority}
        </span>
      </div>
    </li>
  );
}
