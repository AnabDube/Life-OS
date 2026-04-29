"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { TaskCategory, TaskPriority, Inserts } from "@/types";

interface AddTaskSheetProps {
  open: boolean;
  onClose: () => void;
  onCreate: (
    input: Omit<Inserts<"tasks">, "user_id">,
  ) => Promise<void> | void;
  defaultCategory?: TaskCategory;
}

const CATEGORIES: ReadonlyArray<{ value: TaskCategory; label: string }> = [
  { value: "work", label: "Work" },
  { value: "class", label: "Class" },
  { value: "personal", label: "Personal" },
];

const PRIORITIES: ReadonlyArray<{ value: TaskPriority; label: string; tone: string }> = [
  { value: "high",   label: "High",   tone: "border-danger/40 bg-danger/15 text-danger-soft" },
  { value: "medium", label: "Medium", tone: "border-gold/40 bg-gold/15 text-gold" },
  { value: "low",    label: "Low",    tone: "border-[var(--border-1)] bg-bg-2 text-fg-mid" },
];

export default function AddTaskSheet({
  open,
  onClose,
  onCreate,
  defaultCategory = "work",
}: AddTaskSheetProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<TaskCategory>(defaultCategory);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setTitle("");
      setNotes("");
      setCategory(defaultCategory);
      setPriority("medium");
      setDueDate("");
      setError(null);
    }
  }, [open, defaultCategory]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!title.trim()) {
      setError("Give your task a title.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        title: title.trim(),
        notes: notes.trim() || null,
        category,
        priority,
        due_date: dueDate || null,
      });
    } catch {
      setError("Couldn't save just now — try again.");
      setSubmitting(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-[480px] rounded-t-[var(--radius-card)] border border-[var(--border-1)] bg-card p-5 md:rounded-[var(--radius-card)]"
      >
        <header className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
              New task
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-fg">
              What needs your attention?
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full text-fg-mid hover:bg-bg-2 hover:text-fg">
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-xs text-fg-mid">Title</span>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={140} autoFocus
              placeholder="Submit ICT module 3 review"
              className="block w-full rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none focus:border-[var(--border-2)]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-fg-mid">Notes (optional)</span>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500}
              className="block w-full resize-none rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2 text-sm text-fg outline-none focus:border-[var(--border-2)]"
            />
          </label>

          <fieldset>
            <legend className="mb-1.5 text-xs text-fg-mid">Category</legend>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value} type="button" onClick={() => setCategory(c.value)} aria-pressed={category === c.value}
                  className={
                    "flex-1 rounded-full border px-3 py-1.5 text-xs transition-colors " +
                    (category === c.value
                      ? "border-green/50 bg-[var(--green-glow)] text-green"
                      : "border-[var(--border-1)] bg-bg-2 text-fg-mid")
                  }
                >{c.label}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-xs text-fg-mid">Priority</legend>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value} type="button" onClick={() => setPriority(p.value)} aria-pressed={priority === p.value}
                  className={
                    "flex-1 rounded-full border px-3 py-1.5 text-xs transition-colors " +
                    (priority === p.value ? p.tone : "border-[var(--border-1)] bg-bg-2 text-fg-mid")
                  }
                >{p.label}</button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1 block text-xs text-fg-mid">Due date (optional)</span>
            <input
              type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="block w-full rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2 text-sm text-fg outline-none focus:border-[var(--border-2)]"
            />
          </label>

          {error ? <p role="alert" className="text-xs text-danger-text">{error}</p> : null}

          <button
            type="submit" disabled={submitting}
            className="mt-1 flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-green px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
          >{submitting ? "Saving…" : "Add task"}</button>
        </div>
      </form>
    </div>
  );
}
