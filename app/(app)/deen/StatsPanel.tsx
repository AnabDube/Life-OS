import Card from "@/components/ui/Card";
import type { AggregateStats } from "@/lib/stats";

interface StatsPanelProps {
  stats: AggregateStats;
  /** Compact horizontal layout for mobile; vertical full-card on desktop. */
  compact?: boolean;
}

interface Stat {
  label: string;
  value: string;
}

function buildStats(s: AggregateStats): Stat[] {
  return [
    { label: "Today", value: `${s.todayDone}/${s.todayPossible}` },
    { label: "This week", value: `${s.weekPercent}%` },
    { label: "All-time", value: String(s.allTimeTotal) },
    { label: "Best streak", value: String(s.bestEverStreak) },
  ];
}

export default function StatsPanel({ stats, compact = false }: StatsPanelProps) {
  const items = buildStats(stats);

  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-2 rounded-[var(--radius-card)] border border-[var(--border-1)] bg-card px-3 py-3">
        {items.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] uppercase tracking-wider text-fg-dim">
              {s.label}
            </span>
            <span className="font-[family-name:var(--font-display)] text-base font-semibold text-fg">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
        Your stats
      </p>
      <dl className="mt-4 flex flex-col gap-4">
        {items.map((s) => (
          <div
            key={s.label}
            className="flex items-baseline justify-between border-b border-[var(--border-1)] pb-3 last:border-0 last:pb-0"
          >
            <dt className="text-xs uppercase tracking-wider text-fg-mid">
              {s.label}
            </dt>
            <dd className="font-[family-name:var(--font-display)] text-xl font-semibold text-fg">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
