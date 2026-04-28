"use client";

import { useEffect } from "react";
import type { Habit } from "@/types";

interface DeleteHabitDialogProps {
  habit: Habit | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function DeleteHabitDialog({
  habit,
  onCancel,
  onConfirm,
}: DeleteHabitDialogProps) {
  useEffect(() => {
    if (!habit) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [habit, onCancel]);

  if (!habit) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-habit-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
    >
      <button
        type="button"
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-[400px] rounded-[var(--radius-card)] border border-[var(--border-1)] bg-card p-5">
        <h2
          id="delete-habit-title"
          className="font-[family-name:var(--font-display)] text-lg text-fg"
        >
          Remove this habit?
        </h2>
        <p className="mt-2 text-sm text-fg-mid">
          <span className="text-fg">{habit.name}</span> and all of its logs will
          be deleted. This can&apos;t be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-4 py-2 text-sm text-fg hover:bg-bg-3"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="flex-1 rounded-[10px] bg-[#ef4444] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
