import Card from "@/components/ui/Card";
import type { TimeBlock } from "@/types";

interface TimeBlocksListProps {
  blocks: TimeBlock[];
}

const CATEGORY_TINT: Record<TimeBlock["category"], string> = {
  deen: "bg-[var(--green-glow)] text-green border-green/30",
  work: "bg-bg-3 text-fg border-[var(--border-1)]",
  trading: "bg-gold/12 text-gold border-gold/25",
  personal: "bg-[#b39dff]/12 text-[#c4b5fd] border-[#b39dff]/25",
};

export default function TimeBlocksList({ blocks }: TimeBlocksListProps) {
  return (
    <Card>
      <header className="mb-3">
        <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
          Time blocks
        </p>
      </header>

      {blocks.length === 0 ? (
        <p className="text-sm text-fg-mid">
          No time blocks for today. Plan one to anchor your day.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {blocks.map((b) => (
            <li
              key={b.id}
              className={`flex items-center gap-3 rounded-[10px] border px-3 py-2 ${CATEGORY_TINT[b.category]}`}
            >
              <span className="font-mono text-[11px] tabular-nums opacity-80">
                {b.start_time}–{b.end_time}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{b.label}</span>
              {b.completed ? (
                <span className="text-[10px] uppercase tracking-wider opacity-80">
                  done
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
