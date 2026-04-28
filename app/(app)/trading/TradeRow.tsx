"use client";

import type { Trade } from "@/types";

interface TradeRowProps {
  trade: Trade;
  onClick?: () => void;
}

const SESSION_LABEL: Record<NonNullable<Trade["session"]>, string> = {
  london: "London",
  new_york: "New York",
  asian: "Asian",
  overlap: "Overlap",
};

function pnlTone(pnl: number | null): string {
  if (pnl === null) return "text-fg-mid";
  if (pnl > 0) return "text-green";
  if (pnl < 0) return "text-[#fca5a5]";
  return "text-fg-mid";
}

function outcomeStyle(outcome: Trade["outcome"]): string {
  switch (outcome) {
    case "win":
      return "border-green/40 bg-[var(--green-glow)] text-green";
    case "loss":
      return "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#fca5a5]";
    case "breakeven":
      return "border-gold/40 bg-gold/10 text-gold";
    default:
      return "border-[var(--border-1)] bg-bg-3 text-fg-mid";
  }
}

const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TradeRow({ trade, onClick }: TradeRowProps) {
  const pnl = trade.profit_loss === null ? null : Number(trade.profit_loss);
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col gap-2 rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-3 text-left outline-none transition-colors hover:border-[var(--border-2)] hover:bg-bg-3 focus-visible:border-[var(--border-2)]"
      >
        <div className="flex items-center gap-2">
          <span
            className={
              "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
              (trade.direction === "buy"
                ? "border-green/40 bg-[var(--green-glow)] text-green"
                : "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#fca5a5]")
            }
          >
            {trade.direction}
          </span>
          <span className="text-sm font-medium text-fg">{trade.pair}</span>
          <span className={`ml-auto font-mono text-sm tabular-nums ${pnlTone(pnl)}`}>
            {pnl === null ? "—" : `${pnl >= 0 ? "+" : ""}$${fmt.format(pnl)}`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-fg-mid">
          <span
            className={
              "rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider " +
              outcomeStyle(trade.outcome)
            }
          >
            {trade.outcome ?? "open"}
          </span>
          {trade.pips !== null ? (
            <span className="font-mono tabular-nums">{Number(trade.pips).toFixed(1)} pips</span>
          ) : null}
          {trade.session ? <span>{SESSION_LABEL[trade.session]}</span> : null}
          <span className="ml-auto font-mono tabular-nums">{trade.date}</span>
        </div>
      </button>
    </li>
  );
}
