"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import type { TradeFilter } from "@/lib/trades";
import { computeAggregateTradingStats } from "@/lib/trading-stats";
import type { Trade, TradingRule } from "@/types";

import TradeRow from "./TradeRow";
import TradeFilters from "./TradeFilters";
import TradingStatsPanel from "./StatsPanel";
import Charts from "./Charts";
import AddTradeDrawer from "./AddTradeDrawer";
import Toast from "@/components/ui/Toast";

interface TradingClientProps {
  userId: string;
  todayIso: string;
  initialTrades: Trade[];
  rules: TradingRule[];
}

function applyFilter(trade: Trade, f: TradeFilter): boolean {
  if (f.pair && trade.pair !== f.pair) return false;
  if (f.outcome && trade.outcome !== f.outcome) return false;
  if (f.session && trade.session !== f.session) return false;
  if (f.from && trade.date < f.from) return false;
  if (f.to && trade.date > f.to) return false;
  return true;
}

export default function TradingClient({
  userId,
  todayIso,
  initialTrades,
  rules,
}: TradingClientProps) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [filter, setFilter] = useState<TradeFilter>({});
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);

  const filtered = useMemo(
    () => trades.filter((t) => applyFilter(t, filter)),
    [trades, filter],
  );
  const stats = useMemo(() => computeAggregateTradingStats(filtered), [filtered]);
  const knownPairs = useMemo(
    () => Array.from(new Set(trades.map((t) => t.pair))).sort(),
    [trades],
  );

  function handleCreated(trade: Trade): void {
    setTrades((prev) => [trade, ...prev]);
    setAddOpen(false);
    setToast({
      message: trade.outcome === "win" ? "Mashallah — saved" : "Saved",
      key: Date.now(),
    });
  }

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-2">
        <Link
          href="/trading/rules"
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--border-1)] bg-bg-2 px-3 text-xs text-fg-mid hover:border-[var(--border-2)] hover:text-fg"
        >
          <Settings2 size={14} /> Rules
        </Link>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--border-2)] bg-[var(--green-glow)] px-3 text-xs font-medium text-green hover:opacity-90"
        >
          <Plus size={14} /> Log trade
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-5 lg:gap-6">
        <section className="flex flex-col gap-3 lg:col-span-3">
          <TradeFilters filter={filter} onChange={setFilter} knownPairs={knownPairs} />

          {filtered.length === 0 ? (
            <div className="rounded-[10px] border border-[var(--border-1)] bg-bg-2 p-8 text-center text-sm text-fg-mid">
              {trades.length === 0
                ? "Your journal is empty. Log your first trade — wins, losses, and lessons all belong here."
                : "No trades match these filters."}
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {filtered.map((t) => (
                <TradeRow key={t.id} trade={t} />
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-5 lg:col-span-2">
          <TradingStatsPanel stats={stats} />
          <Charts trades={filtered} />
        </aside>
      </div>

      <AddTradeDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        userId={userId}
        todayIso={todayIso}
        rules={rules}
        onCreated={handleCreated}
      />
      <Toast
        message={toast?.message ?? null}
        toastKey={toast?.key}
        onDismiss={() => setToast(null)}
      />
    </>
  );
}
