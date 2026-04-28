/**
 * Pure stats helpers for the Trading module. All inputs are arrays of `Trade`
 * rows; outputs are plain numbers and shaped data for Recharts.
 */
import type { Trade } from "@/types";
import { parseDateLocal, formatDateLocal } from "@/lib/dates";

const SESSION_LABEL: Record<NonNullable<Trade["session"]>, string> = {
  london: "London",
  new_york: "New York",
  asian: "Asian",
  overlap: "Overlap",
};

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface AggregateTradingStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRatePercent: number;
  totalPnL: number;
  /** Average reward-to-risk on trades that have stop-loss + take-profit set. */
  avgRR: number;
  bestTrade: number | null;
  worstTrade: number | null;
  mostTradedPair: string | null;
  bySession: Array<{ session: string; count: number; pnl: number }>;
  byDayOfWeek: Array<{ day: string; count: number; pnl: number }>;
}

export function computeAggregateTradingStats(trades: Trade[]): AggregateTradingStats {
  let wins = 0;
  let losses = 0;
  let breakeven = 0;
  let totalPnL = 0;
  let best: number | null = null;
  let worst: number | null = null;
  const pairCount = new Map<string, number>();
  const sessionMap = new Map<string, { count: number; pnl: number }>();
  const dowMap = new Map<number, { count: number; pnl: number }>();
  let rrSum = 0;
  let rrCount = 0;

  for (const t of trades) {
    if (t.outcome === "win") wins++;
    else if (t.outcome === "loss") losses++;
    else if (t.outcome === "breakeven") breakeven++;

    const pnl = t.profit_loss === null ? 0 : Number(t.profit_loss);
    totalPnL += pnl;
    if (t.profit_loss !== null) {
      if (best === null || pnl > best) best = pnl;
      if (worst === null || pnl < worst) worst = pnl;
    }

    pairCount.set(t.pair, (pairCount.get(t.pair) ?? 0) + 1);

    if (t.session) {
      const cur = sessionMap.get(t.session) ?? { count: 0, pnl: 0 };
      cur.count++;
      cur.pnl += pnl;
      sessionMap.set(t.session, cur);
    }

    const dow = parseDateLocal(t.date).getDay();
    const cur = dowMap.get(dow) ?? { count: 0, pnl: 0 };
    cur.count++;
    cur.pnl += pnl;
    dowMap.set(dow, cur);

    if (t.stop_loss !== null && t.take_profit !== null && t.entry_price !== null) {
      const risk = Math.abs(Number(t.entry_price) - Number(t.stop_loss));
      const reward = Math.abs(Number(t.take_profit) - Number(t.entry_price));
      if (risk > 0) {
        rrSum += reward / risk;
        rrCount++;
      }
    }
  }

  let mostTradedPair: string | null = null;
  let topCount = 0;
  for (const [pair, n] of pairCount.entries()) {
    if (n > topCount) {
      topCount = n;
      mostTradedPair = pair;
    }
  }

  const totalTrades = trades.length;
  const decided = wins + losses;
  return {
    totalTrades,
    wins,
    losses,
    breakeven,
    winRatePercent: decided === 0 ? 0 : Math.round((wins / decided) * 100),
    totalPnL,
    avgRR: rrCount === 0 ? 0 : rrSum / rrCount,
    bestTrade: best,
    worstTrade: worst,
    mostTradedPair,
    bySession: [...sessionMap.entries()].map(([s, v]) => ({
      session: SESSION_LABEL[s as keyof typeof SESSION_LABEL] ?? s,
      ...v,
    })),
    byDayOfWeek: [...dowMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([d, v]) => ({ day: DOW_LABELS[d], ...v })),
  };
}

export function cumulativePnLSeries(trades: Trade[]): Array<{ date: string; cumulative: number }> {
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  return sorted.map((t) => {
    running += t.profit_loss === null ? 0 : Number(t.profit_loss);
    return { date: t.date, cumulative: Math.round(running * 100) / 100 };
  });
}

export function pnLByPairSeries(trades: Trade[]): Array<{ pair: string; wins: number; losses: number; pnl: number }> {
  const map = new Map<string, { wins: number; losses: number; pnl: number }>();
  for (const t of trades) {
    const cur = map.get(t.pair) ?? { wins: 0, losses: 0, pnl: 0 };
    if (t.outcome === "win") cur.wins++;
    else if (t.outcome === "loss") cur.losses++;
    cur.pnl += t.profit_loss === null ? 0 : Number(t.profit_loss);
    map.set(t.pair, cur);
  }
  return [...map.entries()]
    .map(([pair, v]) => ({ pair, ...v }))
    .sort((a, b) => b.wins + b.losses - (a.wins + a.losses))
    .slice(0, 8);
}

export function emotionsVsOutcomeSeries(trades: Trade[]): Array<{ emotion: string; wins: number; losses: number }> {
  const map = new Map<string, { wins: number; losses: number }>();
  for (const t of trades) {
    if (t.outcome !== "win" && t.outcome !== "loss") continue;
    const all = new Set([...t.emotions_before, ...t.emotions_after]);
    for (const e of all) {
      const cur = map.get(e) ?? { wins: 0, losses: 0 };
      if (t.outcome === "win") cur.wins++;
      else cur.losses++;
      map.set(e, cur);
    }
  }
  return [...map.entries()]
    .map(([emotion, v]) => ({ emotion, ...v }))
    .sort((a, b) => b.wins + b.losses - (a.wins + a.losses))
    .slice(0, 8);
}

// ── Pip / P&L calculators (simplified — user can override) ────────────────
export function pipSize(pair: string): number {
  const p = pair.toUpperCase();
  if (p.includes("JPY")) return 0.01;
  if (p.startsWith("XAU")) return 0.1;
  if (p.startsWith("XAG")) return 0.001;
  return 0.0001;
}

export function computePips(
  entry: number,
  exit: number,
  direction: "buy" | "sell",
  pair: string,
): number {
  const size = pipSize(pair);
  const diff = direction === "buy" ? exit - entry : entry - exit;
  return Math.round((diff / size) * 100) / 100;
}

/**
 * Approximate USD P&L assuming $10 per pip per standard lot for USD-quote pairs.
 * Roughly accurate for personal-journal use; let the user override the field.
 */
export function computeProfitUSD(
  entry: number,
  exit: number,
  lotSize: number,
  direction: "buy" | "sell",
  pair: string,
): number {
  const pips = computePips(entry, exit, direction, pair);
  const dollarsPerPipPerLot = pair.toUpperCase().startsWith("XAU") ? 10 : 10;
  return Math.round(pips * lotSize * dollarsPerPipPerLot * 100) / 100;
}

export { formatDateLocal };
