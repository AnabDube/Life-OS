"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createTrade, recordTradeRuleChecks } from "@/lib/trades";
import { computePips, computeProfitUSD } from "@/lib/trading-stats";
import type {
  Trade,
  TradeDirection,
  TradeSession,
  TradingRule,
  Inserts,
} from "@/types";

const FOREX_PAIRS = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD",
  "EUR/JPY", "GBP/JPY", "EUR/GBP", "AUD/JPY", "EUR/AUD",
  "XAU/USD", "XAG/USD",
] as const;
const SESSIONS: Array<{ value: TradeSession; label: string }> = [
  { value: "london",   label: "London"   },
  { value: "new_york", label: "New York" },
  { value: "asian",    label: "Asian"    },
  { value: "overlap",  label: "Overlap"  },
];
const CONFLUENCES = ["Structure", "FVG", "OB", "BOS", "MSS", "Trend", "Session", "News"] as const;
const EMOTIONS    = ["Calm", "Anxious", "Confident", "Revenge", "FOMO", "Disciplined", "Rushed", "Patient"] as const;

interface AddTradeDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  todayIso: string;
  rules: TradingRule[];
  onCreated: (trade: Trade) => void;
}

function ChipMulti<T extends string>({
  options, value, onChange,
}: { options: ReadonlyArray<T>; value: T[]; onChange: (n: T[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const sel = value.includes(o);
        return (
          <button
            key={o} type="button" aria-pressed={sel}
            onClick={() => onChange(sel ? value.filter((v) => v !== o) : [...value, o])}
            className={
              "rounded-full border px-2.5 py-1 text-[11px] transition-colors " +
              (sel
                ? "border-green/50 bg-[var(--green-glow)] text-green"
                : "border-[var(--border-1)] bg-bg-2 text-fg-mid hover:border-[var(--border-2)]")
            }
          >{o}</button>
        );
      })}
    </div>
  );
}

function NumberField({ label, value, onChange, step = "0.0001", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; step?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-dim">{label}</span>
      <input
        type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="block w-full rounded-md border border-input-border bg-input-bg px-2 py-1.5 text-sm font-mono tabular-nums text-fg outline-none focus:border-[var(--border-2)]"
      />
    </label>
  );
}

export default function AddTradeDrawer({ open, onClose, userId, todayIso, rules, onCreated }: AddTradeDrawerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [date, setDate] = useState(todayIso);
  const [pair, setPair] = useState<string>("EUR/USD");
  const [direction, setDirection] = useState<TradeDirection>("buy");
  const [entry, setEntry] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [lot, setLot] = useState("0.10");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [session, setSession] = useState<TradeSession | "">("");
  const [confluences, setConfluences] = useState<string[]>([]);
  const [emotionsBefore, setEmotionsBefore] = useState<string[]>([]);
  const [emotionsAfter, setEmotionsAfter] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [pnlOverride, setPnlOverride] = useState("");
  const [followedRules, setFollowedRules] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computed = useMemo(() => {
    const e = parseFloat(entry);
    const x = parseFloat(exitPrice);
    const l = parseFloat(lot);
    if (!isFinite(e) || !isFinite(x) || !isFinite(l) || l <= 0) {
      return { pips: null as number | null, pnl: null as number | null };
    }
    return {
      pips: computePips(e, x, direction, pair),
      pnl: computeProfitUSD(e, x, l, direction, pair),
    };
  }, [entry, exitPrice, lot, direction, pair]);

  const finalOutcome: Trade["outcome"] = useMemo(() => {
    const v = pnlOverride !== "" ? parseFloat(pnlOverride) : computed.pnl;
    if (v === null || !isFinite(v)) return null;
    if (v > 0) return "win";
    if (v < 0) return "loss";
    return "breakeven";
  }, [pnlOverride, computed.pnl]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setDate(todayIso); setPair("EUR/USD"); setDirection("buy");
      setEntry(""); setExitPrice(""); setLot("0.10"); setSl(""); setTp("");
      setSession(""); setConfluences([]); setEmotionsBefore([]); setEmotionsAfter([]);
      setNotes(""); setScreenshot(null); setPnlOverride("");
      setFollowedRules(new Set()); setError(null); setSubmitting(false);
    }
  }, [open, todayIso]);

  if (!open) return null;

  async function uploadScreenshot(): Promise<string | null> {
    if (!screenshot) return null;
    const path = `${userId}/${Date.now()}-${screenshot.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error: upErr } = await supabase.storage
      .from("trade-screenshots")
      .upload(path, screenshot, { upsert: false });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("trade-screenshots").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    if (!entry || !lot) {
      setError("Entry price and lot size are required.");
      return;
    }
    setSubmitting(true);
    try {
      let screenshotUrl: string | null = null;
      try { screenshotUrl = await uploadScreenshot(); } catch { screenshotUrl = null; }

      const finalPnl = pnlOverride !== "" ? parseFloat(pnlOverride) : computed.pnl;
      const input: Inserts<"trades"> = {
        user_id: userId,
        date,
        pair,
        direction,
        entry_price: parseFloat(entry),
        exit_price: exitPrice ? parseFloat(exitPrice) : null,
        lot_size: parseFloat(lot),
        stop_loss: sl ? parseFloat(sl) : null,
        take_profit: tp ? parseFloat(tp) : null,
        pips: computed.pips,
        profit_loss: finalPnl ?? null,
        session: session || null,
        confluences,
        emotions_before: emotionsBefore,
        emotions_after: emotionsAfter,
        outcome: finalOutcome,
        screenshot_url: screenshotUrl,
        notes: notes.trim() || null,
      };

      const trade = await createTrade(supabase, input);

      if (rules.length > 0) {
        const checks = rules.map((r) => ({ rule_id: r.id, followed: followedRules.has(r.id) }));
        try { await recordTradeRuleChecks(supabase, trade.id, checks); } catch { /* non-fatal */ }
      }

      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
      onCreated(trade);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save trade.");
      setSubmitting(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Log trade" className="fixed inset-0 z-50 flex">
      <button type="button" aria-label="Close" onClick={onClose} className="flex-1 cursor-default bg-black/50 backdrop-blur-sm" />
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col bg-card md:w-[480px] md:border-l md:border-[var(--border-1)]"
      >
        <header className="flex items-start justify-between border-b border-[var(--border-1)] p-5">
          <div>
            <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
              New trade
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-lg text-fg">Log a trade</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full text-fg-mid hover:bg-bg-2 hover:text-fg">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-dim">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="block w-full rounded-md border border-input-border bg-input-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-[var(--border-2)]" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-dim">Pair</span>
                <select value={pair} onChange={(e) => setPair(e.target.value)} className="block w-full rounded-md border border-input-border bg-input-bg px-2 py-1.5 text-sm text-fg outline-none focus:border-[var(--border-2)]">
                  {FOREX_PAIRS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>

            <div className="flex gap-2">
              {(["buy", "sell"] as const).map((d) => (
                <button
                  key={d} type="button" aria-pressed={direction === d} onClick={() => setDirection(d)}
                  className={
                    "flex-1 rounded-md border px-3 py-2 text-sm font-semibold uppercase transition-colors " +
                    (direction === d
                      ? d === "buy"
                        ? "border-green/50 bg-[var(--green-glow)] text-green"
                        : "border-danger/50 bg-danger/15 text-danger-soft"
                      : "border-[var(--border-1)] bg-bg-2 text-fg-mid")
                  }
                >{d}</button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Entry" value={entry} onChange={setEntry} placeholder="1.08540" />
              <NumberField label="Exit" value={exitPrice} onChange={setExitPrice} placeholder="1.08720" />
              <NumberField label="Lot size" value={lot} onChange={setLot} step="0.01" />
              <NumberField label="Stop loss" value={sl} onChange={setSl} />
              <NumberField label="Take profit" value={tp} onChange={setTp} />
            </div>

            <div className="rounded-md border border-[var(--border-1)] bg-bg-2 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-fg-dim">Auto-calculated</p>
              <p className="mt-1 flex items-center justify-between font-mono text-sm tabular-nums">
                <span className="text-fg">{computed.pips === null ? "—" : `${computed.pips.toFixed(1)} pips`}</span>
                <span className={computed.pnl === null ? "text-fg-mid" : computed.pnl >= 0 ? "text-green" : "text-danger-soft"}>
                  {computed.pnl === null ? "—" : `${computed.pnl >= 0 ? "+" : ""}$${computed.pnl.toFixed(2)}`}
                </span>
              </p>
              <input
                type="number" step="0.01" value={pnlOverride} onChange={(e) => setPnlOverride(e.target.value)}
                placeholder="Override P&L (optional)"
                className="mt-2 block w-full rounded-md border border-[var(--border-1)] bg-card px-2 py-1.5 text-xs font-mono tabular-nums text-fg outline-none focus:border-[var(--border-2)]"
              />
            </div>

            <fieldset>
              <legend className="mb-1.5 text-[10px] uppercase tracking-wider text-fg-dim">Session</legend>
              <div className="flex flex-wrap gap-1.5">
                {SESSIONS.map((s) => (
                  <button
                    key={s.value} type="button" aria-pressed={session === s.value}
                    onClick={() => setSession(session === s.value ? "" : s.value)}
                    className={
                      "rounded-full border px-3 py-1 text-xs transition-colors " +
                      (session === s.value
                        ? "border-green/50 bg-[var(--green-glow)] text-green"
                        : "border-[var(--border-1)] bg-bg-2 text-fg-mid hover:border-[var(--border-2)]")
                    }
                  >{s.label}</button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-[10px] uppercase tracking-wider text-fg-dim">Confluences</legend>
              <ChipMulti options={CONFLUENCES} value={confluences} onChange={setConfluences} />
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-[10px] uppercase tracking-wider text-fg-dim">Emotions before</legend>
              <ChipMulti options={EMOTIONS} value={emotionsBefore} onChange={setEmotionsBefore} />
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-[10px] uppercase tracking-wider text-fg-dim">Emotions after</legend>
              <ChipMulti options={EMOTIONS} value={emotionsAfter} onChange={setEmotionsAfter} />
            </fieldset>

            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-dim">Screenshot (optional)</span>
              <input
                type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-fg-mid file:mr-3 file:rounded-md file:border-0 file:bg-bg-2 file:px-3 file:py-1.5 file:text-xs file:text-fg hover:file:bg-bg-3"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-fg-dim">Notes</span>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="Setup, lesson learned, anything to remember…"
                className="block w-full resize-none rounded-md border border-input-border bg-input-bg px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none focus:border-[var(--border-2)]"
              />
            </label>

            {rules.length > 0 ? (
              <fieldset className="rounded-md border border-[var(--border-1)] bg-bg-2 p-3">
                <legend className="px-1 text-[10px] uppercase tracking-wider text-gold opacity-90">
                  Rule check — which did you follow?
                </legend>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {rules.map((r) => {
                    const checked = followedRules.has(r.id);
                    return (
                      <li key={r.id}>
                        <label className="flex items-start gap-2 cursor-pointer text-sm text-fg">
                          <input
                            type="checkbox" checked={checked}
                            onChange={() => setFollowedRules((prev) => {
                              const n = new Set(prev);
                              if (checked) n.delete(r.id); else n.add(r.id);
                              return n;
                            })}
                            className="mt-0.5 h-4 w-4 accent-green"
                          />
                          <span>{r.rule}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            ) : null}

            {error ? <p role="alert" className="text-xs text-danger-text">{error}</p> : null}
          </div>
        </div>

        <footer className="border-t border-[var(--border-1)] p-5">
          <button type="submit" disabled={submitting}
            className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-green px-4 py-2 text-sm font-medium text-bg disabled:opacity-60">
            {submitting ? "Saving…" : "Save trade"}
          </button>
        </footer>
      </form>
    </div>
  );
}
