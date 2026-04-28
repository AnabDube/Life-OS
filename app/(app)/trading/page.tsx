import { redirect } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getTrades, getTradingRules } from "@/lib/trades";
import { todayInTimezone, formatLongDate } from "@/lib/dates";
import TradingClient from "./TradingClient";

export default async function TradingPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  const tz = profile?.timezone ?? "UTC";
  const today = todayInTimezone(tz);

  const [trades, rules] = await Promise.all([
    getTrades(supabase, user.id, {}, 500),
    getTradingRules(supabase, user.id, { activeOnly: true }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-6 pb-8 lg:px-8 lg:pt-10">
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-fg-dim">
          {formatLongDate(today, tz)}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-fg">
          Trading
        </h1>
        <p className="mt-1 text-sm text-fg-mid">
          Your Forex journal — every trade is data, every emotion is data.
        </p>
      </header>

      <TradingClient
        userId={user.id}
        todayIso={today}
        initialTrades={trades}
        rules={rules}
      />
    </div>
  );
}
