"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Inserts } from "@/types";

interface AddClassSheetProps {
  open: boolean;
  onClose: () => void;
  onCreate: (
    input: Omit<Inserts<"classes">, "user_id">,
  ) => Promise<void> | void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function AddClassSheet({ open, onClose, onCreate }: AddClassSheetProps) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [days, setDays] = useState<Set<number>>(new Set());
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
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
      setPlatform("");
      setDays(new Set());
      setTime("");
      setNotes("");
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
      setError("Give your class a name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        platform: platform.trim() || null,
        schedule_days: days.size > 0 ? [...days].sort((a, b) => a - b) : null,
        schedule_time: time || null,
        notes: notes.trim() || null,
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
              New class
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-fg">
              What are you studying?
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
              type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoFocus
              placeholder="ICT Trading Bootcamp"
              className="block w-full rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none focus:border-[var(--border-2)]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-fg-mid">Platform (optional)</span>
            <input
              type="text" value={platform} onChange={(e) => setPlatform(e.target.value)} maxLength={60}
              placeholder="Zoom, Discord, in-person…"
              className="block w-full rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none focus:border-[var(--border-2)]"
            />
          </label>

          <fieldset>
            <legend className="mb-1.5 text-xs text-fg-mid">Schedule (optional)</legend>
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
            <input
              type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="mt-2 block w-full rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2 text-sm text-fg outline-none focus:border-[var(--border-2)]"
            />
          </fieldset>

          <label className="block">
            <span className="mb-1 block text-xs text-fg-mid">Notes (optional)</span>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500}
              className="block w-full resize-none rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2 text-sm text-fg outline-none focus:border-[var(--border-2)]"
            />
          </label>

          {error ? <p role="alert" className="text-xs text-[#f87171]">{error}</p> : null}

          <button
            type="submit" disabled={submitting}
            className="mt-1 flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-green px-4 py-2 text-sm font-medium text-bg disabled:opacity-60"
          >{submitting ? "Saving…" : "Add class"}</button>
        </div>
      </form>
    </div>
  );
}
