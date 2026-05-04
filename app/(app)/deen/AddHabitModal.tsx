"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { HabitCategory, Inserts } from "@/types";

interface AddHabitModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (
    input: Omit<Inserts<"habits">, "is_default" | "user_id">,
  ) => Promise<void> | void;
}

const CATEGORY_OPTIONS: ReadonlyArray<{ value: HabitCategory; label: string }> = [
  { value: "dhikr",   label: "Dhikr"   },
  { value: "quran",   label: "Quran"   },
  { value: "ibadah",  label: "Ibadah"  },
  { value: "fasting", label: "Fasting" },
  { value: "general", label: "General" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function AddHabitModal({ open, onClose, onCreate }: AddHabitModalProps) {
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [category, setCategory] = useState<HabitCategory>("dhikr");
  const [days, setDays] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));
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
      setName("");
      setDetail("");
      setCategory("dhikr");
      setDays(new Set([0, 1, 2, 3, 4, 5, 6]));
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function toggleDay(d: number): void {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give your habit a name.");
      return;
    }
    if (days.size === 0) {
      setError("Pick at least one day.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const isEveryDay = days.size === 7;
      await onCreate({
        name: name.trim(),
        detail: detail.trim(),
        category,
        active_days: isEveryDay ? null : [...days].sort((a, b) => a - b),
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
              New habit
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-fg">
              Add to your tracker
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full text-fg-mid hover:bg-bg-2 hover:text-fg">
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-xs text-fg-mid">Name</span>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80}
              placeholder="Surah Yasin" autoFocus
              className="block w-full rounded-[10px] border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none focus:border-[var(--border-2)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-fg-mid">Detail (optional)</span>
            <input
              type="text" value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={80}
              placeholder="Every Friday after Asr"
              className="block w-full rounded-[10px] border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none focus:border-[var(--border-2)]"
            />
          </label>
          <fieldset>
            <legend className="mb-1.5 text-xs text-fg-mid">Category</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((c) => (
                <button
                  key={c.value} type="button" onClick={() => setCategory(c.value)} aria-pressed={category === c.value}
                  className={
                    "rounded-full border px-3 py-1.5 text-xs transition-colors " +
                    (category === c.value
                      ? "border-green/50 bg-[var(--green-glow)] text-green"
                      : "border-[var(--border-1)] bg-bg-2 text-fg-mid hover:border-[var(--border-2)]")
                  }
                >{c.label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-xs text-fg-mid">Active days</legend>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_LABELS.map((label, i) => {
                const active = days.has(i);
                return (
                  <button
                    key={i} type="button" onClick={() => toggleDay(i)} aria-pressed={active}
                    className={
                      "min-h-[44px] rounded-[10px] border text-[11px] transition-colors " +
                      (active
                        ? "border-green/50 bg-[var(--green-glow)] text-green"
                        : "border-[var(--border-1)] bg-bg-2 text-fg-mid")
                    }
                  >{label}</button>
                );
              })}
            </div>
          </fieldset>
          {error ? <p role="alert" className="text-xs text-danger-text">{error}</p> : null}
          <button
            type="submit" disabled={submitting}
            className="mt-1 flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-green px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
          >{submitting ? "Saving…" : "Add habit"}</button>
        </div>
      </form>
    </div>
  );
}
