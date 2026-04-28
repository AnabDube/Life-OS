"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Check, MinusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logClassSession } from "@/lib/tasks";
import { formatLongDate } from "@/lib/dates";
import type { ClassRow, ClassSession } from "@/types";

interface ClassDetailDrawerProps {
  classRow: ClassRow | null;
  userId: string;
  todayIso: string;
  /** All sessions for the user; we filter to this class on the fly. */
  allSessions: ClassSession[];
  onClose: () => void;
  onSessionLogged: (session: ClassSession) => void;
}

export default function ClassDetailDrawer({
  classRow,
  userId,
  todayIso,
  allSessions,
  onClose,
  onSessionLogged,
}: ClassDetailDrawerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [notes, setNotes] = useState<string>("");
  const [attended, setAttended] = useState<boolean | null>(null);

  const sessions = useMemo(
    () =>
      classRow
        ? allSessions
            .filter((s) => s.class_id === classRow.id)
            .sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [allSessions, classRow],
  );

  const todaysSession = useMemo(
    () => sessions.find((s) => s.date === todayIso) ?? null,
    [sessions, todayIso],
  );

  useEffect(() => {
    if (!classRow) return;
    setNotes(todaysSession?.notes ?? "");
    setAttended(todaysSession?.attended ?? null);
  }, [classRow, todaysSession]);

  useEffect(() => {
    if (!classRow) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [classRow, onClose]);

  async function persist(nextAttended: boolean, nextNotes: string): Promise<void> {
    if (!classRow) return;
    try {
      const session = await logClassSession(supabase, {
        user_id: userId,
        class_id: classRow.id,
        date: todayIso,
        attended: nextAttended,
        notes: nextNotes.trim() || null,
      });
      onSessionLogged(session);
    } catch {
      // swallow — UI stays optimistic this session
    }
  }

  if (!classRow) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={`${classRow.name} details`} className="fixed inset-0 z-50 flex">
      <button type="button" aria-label="Close" onClick={onClose} className="flex-1 cursor-default bg-black/50 backdrop-blur-sm" />
      <div className="flex w-full flex-col bg-card md:w-[420px] md:border-l md:border-[var(--border-1)]">
        <header className="flex items-start justify-between border-b border-[var(--border-1)] p-5">
          <div className="min-w-0 flex-1 pr-3">
            <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
              Class
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-fg">
              {classRow.name}
            </h2>
            {classRow.platform ? (
              <p className="mt-1 text-xs text-fg-mid">{classRow.platform}</p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-fg-mid hover:bg-bg-2 hover:text-fg">
            <X size={18} />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          <section>
            <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-fg-dim">
              {formatLongDate(todayIso)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAttended(true);
                  void persist(true, notes);
                }}
                aria-pressed={attended === true}
                className={
                  "flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border min-h-[44px] px-3 text-sm transition-colors " +
                  (attended === true
                    ? "border-green/50 bg-[var(--green-glow)] text-green"
                    : "border-[var(--border-1)] bg-bg-2 text-fg-mid")
                }
              >
                <Check size={14} /> Attended
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttended(false);
                  void persist(false, notes);
                }}
                aria-pressed={attended === false}
                className={
                  "flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border min-h-[44px] px-3 text-sm transition-colors " +
                  (attended === false
                    ? "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#fca5a5]"
                    : "border-[var(--border-1)] bg-bg-2 text-fg-mid")
                }
              >
                <MinusCircle size={14} /> Missed
              </button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => attended !== null && void persist(attended, notes)}
              rows={3}
              placeholder="What did you learn?"
              className="mt-3 block w-full resize-none rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none focus:border-[var(--border-2)]"
            />
          </section>

          <section>
            <h3 className="mb-2 text-[10px] uppercase tracking-[0.22em] text-fg-dim">
              History
            </h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-fg-mid">
                No sessions logged yet. Today is a fresh start.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-3 rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2"
                  >
                    <span className="mt-0.5 shrink-0 font-mono text-[11px] tabular-nums text-fg-mid">
                      {s.date}
                    </span>
                    <span
                      className={
                        "mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider " +
                        (s.attended
                          ? "border-green/30 bg-[var(--green-glow)] text-green"
                          : "border-[#ef4444]/30 bg-[#ef4444]/10 text-[#fca5a5]")
                      }
                    >
                      {s.attended ? "Attended" : "Missed"}
                    </span>
                    {s.notes ? (
                      <span className="min-w-0 flex-1 text-xs text-fg-mid">
                        {s.notes}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
