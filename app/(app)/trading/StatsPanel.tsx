import Card from "@/components/ui/Card";
import type { AggregateTradingStats } from "@/lib/trading-stats";

interface StatsPanelProps {
  stats: AggregateTradingStats;
}

const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function dollar(n: number | null): string {
  if (n === null) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}$${fmt.format(n)}`;
}

function pnlTone(n: number | null | undefined): string {
  if (n === null || n === undefined || n === 0) return "text-fg";
  return n > 0 ? "text-green" : "text-danger-soft";
}

export default function TradingStatsPanel({ stats }: StatsPanelProps) {
  const headline = [
    { label: "Total trades", value: String(stats.totalTrades) },
    { label: "Win rate", value: `${stats.winRatePercent}%` },
    {
      label: "Total P&L",
      value: dollar(stats.totalPnL),
      tone: pnlTone(stats.totalPnL),
    },
    { label: "Avg RR", value: stats.avgRR === 0 ? "—" : `1 : ${stats.avgRR.toFixed(2)}` },
    {
      label: "Best trade",
      value: dollar(stats.bestTrade),
      tone: "text-green",
    },
    {
      label: "Worst trade",
      value: dollar(stats.worstTrade),
      tone: "text-danger-soft",
    },
  ];

  return (
    <Card>
      <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
        Performance
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        {headline.map((s) => (
          <div
            key={s.label}
            className="rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2"
          >
            <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
              {s.label}
            </dt>
            <dd
              className={
                "mt-1 font-[family-name:var(--font-display)] text-base font-semibold " +
                (s.tone ?? "text-fg")
              }
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wider text-fg-dim">
            Most traded pair
          </p>
          <p className="font-[family-name:var(--font-display)] text-lg text-fg">
            {stats.mostTradedPair ?? "—"}
          </p>
        </div>
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wider text-fg-dim">
            Win / Loss / BE
          </p>
          <p className="font-[family-name:var(--font-display)] text-lg text-fg">
            <span className="text-green">{stats.wins}</span>
            <span className="text-fg-dim"> · </span>
            <span className="text-danger-soft">{stats.losses}</span>
            <span className="text-fg-dim"> · </span>
            <span className="text-gold">{stats.breakeven}</span>
          </p>
        </div>
      </div>

      {stats.bySession.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-fg-dim">
            By session
          </p>
          <ul className="flex flex-col gap-1">
            {stats.bySession.map((s) => (
              <li
                key={s.session}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-fg-mid">{s.session}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-fg-dim">{s.count} trades</span>
                  <span className={`font-mono tabular-nums ${pnlTone(s.pnl)}`}>
                    {dollar(s.pnl)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {stats.byDayOfWeek.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2 text-[10px] uppercase tracking-wider text-fg-dim">
            By day of week
          </p>
          <ul className="grid grid-cols-7 gap-1 text-center">
            {stats.byDayOfWeek.map((d) => (
              <li
                key={d.day}
                className="flex flex-col items-center gap-0.5 rounded-md border border-[var(--border-1)] bg-bg-2 px-1 py-1.5"
              >
                <span className="text-[10px] text-fg-dim">{d.day}</span>
                <span className={`font-mono text-[11px] tabular-nums ${pnlTone(d.pnl)}`}>
                  {d.pnl >= 0 ? "+" : ""}
                  {Math.round(d.pnl)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
