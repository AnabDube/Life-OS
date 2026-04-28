/**
 * Typed query helpers for the trading journal: trades, trading rules, and
 * the per-trade rule checklist. All Supabase access for the trading module
 * goes through these named async functions.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Trade,
  TradingRule,
  TradeRuleCheck,
  Inserts,
  Updates,
} from "@/types";

type SB = SupabaseClient<Database>;

// ── Trades ──────────────────────────────────────────────────────────────────
export interface TradeFilter {
  pair?: string;
  outcome?: Trade["outcome"];
  session?: Trade["session"];
  from?: string;
  to?: string;
}

export async function getTrades(
  supabase: SB,
  userId: string,
  filter: TradeFilter = {},
  limit = 200,
): Promise<Trade[]> {
  let query = supabase.from("trades").select("*").eq("user_id", userId);
  if (filter.pair) query = query.eq("pair", filter.pair);
  if (filter.outcome) query = query.eq("outcome", filter.outcome);
  if (filter.session) query = query.eq("session", filter.session);
  if (filter.from) query = query.gte("date", filter.from);
  if (filter.to) query = query.lte("date", filter.to);
  const { data, error } = await query
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getTrade(supabase: SB, tradeId: string): Promise<Trade | null> {
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", tradeId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createTrade(supabase: SB, input: Inserts<"trades">): Promise<Trade> {
  const { data, error } = await supabase.from("trades").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTrade(
  supabase: SB,
  tradeId: string,
  patch: Updates<"trades">,
): Promise<Trade> {
  const { data, error } = await supabase
    .from("trades")
    .update(patch)
    .eq("id", tradeId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTrade(supabase: SB, tradeId: string): Promise<void> {
  const { error } = await supabase.from("trades").delete().eq("id", tradeId);
  if (error) throw error;
}

// ── Trading rules ───────────────────────────────────────────────────────────
export async function getTradingRules(
  supabase: SB,
  userId: string,
  opts: { activeOnly?: boolean } = {},
): Promise<TradingRule[]> {
  let query = supabase.from("trading_rules").select("*").eq("user_id", userId);
  if (opts.activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTradingRule(
  supabase: SB,
  input: Inserts<"trading_rules">,
): Promise<TradingRule> {
  const { data, error } = await supabase
    .from("trading_rules")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTradingRule(
  supabase: SB,
  ruleId: string,
  patch: Updates<"trading_rules">,
): Promise<TradingRule> {
  const { data, error } = await supabase
    .from("trading_rules")
    .update(patch)
    .eq("id", ruleId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTradingRule(supabase: SB, ruleId: string): Promise<void> {
  const { error } = await supabase.from("trading_rules").delete().eq("id", ruleId);
  if (error) throw error;
}

// ── Rule checks (per trade) ─────────────────────────────────────────────────
export async function getTradeRuleChecks(
  supabase: SB,
  tradeId: string,
): Promise<TradeRuleCheck[]> {
  const { data, error } = await supabase
    .from("trade_rule_checks")
    .select("*")
    .eq("trade_id", tradeId);
  if (error) throw error;
  return data ?? [];
}

export async function recordTradeRuleChecks(
  supabase: SB,
  tradeId: string,
  checks: ReadonlyArray<{ rule_id: string; followed: boolean }>,
): Promise<void> {
  if (checks.length === 0) return;
  const rows = checks.map((c) => ({
    trade_id: tradeId,
    rule_id: c.rule_id,
    followed: c.followed,
  }));
  const { error } = await supabase
    .from("trade_rule_checks")
    .upsert(rows, { onConflict: "trade_id,rule_id" });
  if (error) throw error;
}
