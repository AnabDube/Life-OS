"use client";

import { useMemo, useState, useTransition } from "react";
import { Sparkles, Star } from "lucide-react";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { upsertDailyEntry } from "@/lib/daily";
import { generateDailyReflection } from "./actions";
import type { DailyEntry, Reflection } from "@/types";

interface EveningBlockProps {
  userId: string;
  date: string;
  initialEntry: DailyEntry | null;
  initialReflection: Reflection | null;
  highlight: boolean;
}

export default function EveningBlock({
  userId,
  date,
  initialEntry,
  initialReflection,
  highlight,
}: EveningBlockProps) {
  const supabase = useMemo(() => createClient(), []);
  const [reflection, setReflection] = useState(
    initialEntry?.evening_reflection ?? "",
  );
  const [rating, setRating] = useState<number | null>(
    initialEntry?.day_rating ?? null,
  );
  const [aiContent, setAiContent] = useState<string | null>(
    initialReflection?.content ?? null,
  );
  const [aiError, setAiError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function persistReflection(text: string): void {
    void upsertDailyEntry(supabase, {
      user_id: userId,
      date,
      evening_reflection: text,
    }).catch(() => {});
  }

  function pickRating(value: number): void {
    const next = rating === value ? null : value;
    setRating(next);
    void upsertDailyEntry(supabase, {
      user_id: userId,
      date,
      day_rating: next,
    }).catch(() => {});
  }

  function reflectWithAI(): void {
    setAiError(null);
    startTransition(async () => {
      const result = await generateDailyReflection(date);
      if (result.ok && result.content) {
        setAiContent(result.content);
      } else {
        setAiError(result.error ?? "Reflection failed.");
      }
    });
  }

  return (
    <Card highlight={highlight} className="flex flex-col gap-5">
      <header>
        <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
          Evening
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-fg">
          Close the day
        </h2>
      </header>

      <label className="block">
        <span className="mb-2 block text-xs text-fg-mid">
          How did today actually feel?
        </span>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          onBlur={() => persistReflection(reflection)}
          rows={4}
          placeholder="A small win, a hard moment, anything…"
          className="block w-full resize-none rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none transition-colors focus:border-[var(--border-2)]"
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-xs text-fg-mid">Day rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = rating !== null && value <= rating;
            return (
              <button
                key={value}
                type="button"
                onClick={() => pickRating(value)}
                aria-label={`Rate today ${value} of 5`}
                aria-pressed={rating === value}
                className="flex h-11 w-11 items-center justify-center rounded-md outline-none transition-colors hover:bg-bg-2 focus-visible:bg-bg-2"
              >
                <Star
                  size={22}
                  fill={filled ? "currentColor" : "none"}
                  className={filled ? "text-gold" : "text-fg-dim"}
                  strokeWidth={1.6}
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="border-t border-[var(--border-1)] pt-4">
        <button
          type="button"
          onClick={reflectWithAI}
          disabled={isPending}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--border-2)] bg-[var(--green-glow)] px-4 py-2 text-sm font-medium text-green outline-none transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Sparkles size={16} />
          {isPending
            ? "Reflecting…"
            : aiContent
              ? "Refresh reflection"
              : "Reflect with AI"}
        </button>

        {aiError ? (
          <p role="alert" className="mt-3 text-center text-xs text-[#f87171]">
            {aiError}
          </p>
        ) : null}

        {aiContent ? (
          <div className="mt-4 rounded-[10px] border border-[var(--border-1)] bg-bg-2 p-4">
            <p className="font-[family-name:var(--font-display)] text-[10px] uppercase tracking-[0.22em] text-gold opacity-90">
              Reflection
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fg">
              {aiContent}
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
