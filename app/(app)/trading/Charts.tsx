"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Card from "@/components/ui/Card";
import {
  cumulativePnLSeries,
  pnLByPairSeries,
  emotionsVsOutcomeSeries,
} from "@/lib/trading-stats";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { Trade } from "@/types";

interface ChartsProps {
  trades: Trade[];
}

export default function Charts({ trades }: ChartsProps) {
  const c = useThemeColors();
  const TOOLTIP_STYLE: React.CSSProperties = {
    backgroundColor: c.card,
    border: `1px solid ${c.border1}`,
    borderRadius: 10,
    color: c.fgMid,
    fontSize: 12,
  };
  const GRID_STROKE = c.border1;
  const AXIS_COLOR = c.fgMid;
  if (trades.length === 0) {
    return (
      <Card>
        <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
          Charts
        </p>
        <p className="mt-3 text-sm text-fg-mid">
          Log a trade or two and the charts come alive.
        </p>
      </Card>
    );
  }

  const cumulative = cumulativePnLSeries(trades);
  const byPair = pnLByPairSeries(trades);
  const byEmotion = emotionsVsOutcomeSeries(trades);

  return (
    <Card className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-wider text-fg-dim">
          P&L over time
        </p>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulative} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="date" stroke={AXIS_COLOR} tick={{ fontSize: 10 }} hide />
              <YAxis stroke={AXIS_COLOR} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke={c.green}
                strokeWidth={2}
                dot={false}
                name="Cumulative P&L"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] uppercase tracking-wider text-fg-dim">
          Wins vs losses by pair
        </p>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byPair} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="pair" stroke={AXIS_COLOR} tick={{ fontSize: 10 }} interval={0} />
              <YAxis stroke={AXIS_COLOR} tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: c.fgMid }} />
              <Bar dataKey="wins" fill={c.green} name="Wins" />
              <Bar dataKey="losses" fill={c.danger} name="Losses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {byEmotion.length > 0 ? (
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-wider text-fg-dim">
            Emotions vs outcome
          </p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byEmotion} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                <XAxis dataKey="emotion" stroke={AXIS_COLOR} tick={{ fontSize: 10 }} interval={0} />
                <YAxis stroke={AXIS_COLOR} tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: c.fgMid }} />
                <Bar dataKey="wins" fill={c.green} name="Wins" />
                <Bar dataKey="losses" fill={c.danger} name="Losses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
