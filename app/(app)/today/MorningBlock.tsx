"use client";

import { useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { upsertDailyEntry } from "@/lib/daily";
import type { DailyEntry } from "@/types";

interface MorningBlockProps {
  userId: string;
  date: string;
  initialEntry: DailyEntry | null;
  highlight: boolean;
}

const MOODS = [
  { value: 1, emoji: "😔" },
  { value: 2, emoji: "😌" },
  { value: 3, emoji: "😐" },
  { value: 4, emoji: "🙂" },
  { value: 5, emoji: "😊" },
] as const;

function splitGratitude(text: string | null | undefined): [string, string, string] {
  const parts = (text ?? "").split("\n");
  return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""];
}

export default function MorningBlock({
  userId,
  date,
  initialEntry,
  highlight,
}: MorningBlockProps) {
  const supabase = useMemo(() => createClient(), []);
  const [intention, setIntention] = useState(initialEntry?.morning_intention ?? "");
  const [mood, setMood] = useState<number | null>(initialEntry?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(initialEntry?.energy ?? null);
  const [gratitude, setGratitude] = useState<[string, string, string]>(
    splitGratitude(initialEntry?.gratitude),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function persist(patch: Parameters<typeof upsertDailyEntry>[1]): void {
    void upsertDailyEntry(supabase, patch).catch(() => {
      /* silent — UI state is the source of truth this session */
    });
  }

  function debouncedPersist(patch: Parameters<typeof upsertDailyEntry>[1]): void {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persist(patch), 600);
  }

  function pickMood(value: number): void {
    setMood(value);
    persist({ user_id: userId, date, mood: value });
  }

  function pickEnergy(value: number): void {
    setEnergy(value);
    persist({ user_id: userId, date, energy: value });
  }

  function changeGratitude(i: 0 | 1 | 2, value: string): void {
    const next: [string, string, string] = [...gratitude];
    next[i] = value;
    setGratitude(next);
    debouncedPersist({
      user_id: userId,
      date,
      gratitude: next.join("\n"),
    });
  }

  return (
    <Card highlight={highlight} className="flex flex-col gap-5">
      <header>
        <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
          Morning
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-fg">
          Set your intention
        </h2>
      </header>

      <label className="block">
        <span className="mb-2 block text-xs text-fg-mid">
          What is your intention for today?
        </span>
        <textarea
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          onBlur={() =>
            persist({ user_id: userId, date, morning_intention: intention })
          }
          rows={2}
          placeholder="Bismillah — today I will…"
          className="block w-full resize-none rounded-[10px] border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none transition-colors focus:border-[var(--border-2)]"
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-xs text-fg-mid">Mood</legend>
        <div className="flex justify-between gap-2">
          {MOODS.map(({ value, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => pickMood(value)}
              aria-label={`Mood ${value} of 5`}
              aria-pressed={mood === value}
              className={
                "flex h-12 flex-1 items-center justify-center rounded-[10px] border text-xl transition-colors " +
                (mood === value
                  ? "border-green bg-nav-active-bg ring-2 ring-green/30"
                  : "border-[var(--border-1)] bg-bg-2 hover:border-[var(--border-2)]")
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs text-fg-mid">Energy</legend>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => pickEnergy(value)}
              aria-label={`Energy ${value} of 5`}
              aria-pressed={energy === value}
              className={
                "h-11 flex-1 rounded-[10px] border text-sm font-medium transition-colors " +
                (energy !== null && value <= energy
                  ? "border-green bg-green text-bg ring-2 ring-green/30"
                  : "border-[var(--border-1)] bg-bg-2 text-fg-mid hover:border-[var(--border-2)]")
              }
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-xs text-fg-mid">I am grateful for…</legend>
        {([0, 1, 2] as const).map((i) => (
          <input
            key={i}
            type="text"
            value={gratitude[i]}
            onChange={(e) => changeGratitude(i, e.target.value)}
            onBlur={() =>
              persist({
                user_id: userId,
                date,
                gratitude: gratitude.join("\n"),
              })
            }
            placeholder={i === 0 ? "Something small…" : ""}
            className="block w-full rounded-[10px] border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none transition-colors focus:border-[var(--border-2)]"
          />
        ))}
      </fieldset>
    </Card>
  );
}
