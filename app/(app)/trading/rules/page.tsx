import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getTradingRules } from "@/lib/trades";
import RulesClient from "./RulesClient";

export default async function TradingRulesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rules = await getTradingRules(supabase, user.id);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-6 pb-8 lg:px-8 lg:pt-10">
      <Link
        href="/trading"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-fg-mid hover:text-fg"
      >
        <ArrowLeft size={14} /> Back to journal
      </Link>

      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold opacity-90">
          Trading
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-fg">
          Your rules
        </h1>
        <p className="mt-1 text-sm text-fg-mid">
          The personal contract you check against every trade.
        </p>
      </header>

      <RulesClient userId={user.id} initialRules={rules} />
    </div>
  );
}
