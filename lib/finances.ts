/**
 * Typed query helpers for the Money module: accounts, transactions, budgets,
 * and savings goals. All Supabase access for that module goes through these
 * named async functions.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Account,
  Transaction,
  Budget,
  SavingsGoal,
  Inserts,
  Updates,
} from "@/types";

type SB = SupabaseClient<Database>;

// ── Accounts ────────────────────────────────────────────────────────────────
export async function getAccounts(supabase: SB, userId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createAccount(
  supabase: SB,
  input: Inserts<"accounts">,
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccount(
  supabase: SB,
  accountId: string,
  patch: Updates<"accounts">,
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .update(patch)
    .eq("id", accountId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAccount(supabase: SB, accountId: string): Promise<void> {
  const { error } = await supabase.from("accounts").delete().eq("id", accountId);
  if (error) throw error;
}

// ── Transactions ────────────────────────────────────────────────────────────
export interface TransactionFilter {
  from?: string;
  to?: string;
  accountId?: string;
  category?: string;
  type?: Transaction["type"];
}

export async function getTransactions(
  supabase: SB,
  userId: string,
  filter: TransactionFilter = {},
  limit = 500,
): Promise<Transaction[]> {
  let query = supabase.from("transactions").select("*").eq("user_id", userId);
  if (filter.from) query = query.gte("date", filter.from);
  if (filter.to) query = query.lte("date", filter.to);
  if (filter.accountId) query = query.eq("account_id", filter.accountId);
  if (filter.category) query = query.eq("category", filter.category);
  if (filter.type) query = query.eq("type", filter.type);
  const { data, error } = await query
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function createTransaction(
  supabase: SB,
  input: Inserts<"transactions">,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTransaction(supabase: SB, transactionId: string): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);
  if (error) throw error;
}

// ── Budgets ─────────────────────────────────────────────────────────────────
/** All budgets for a given month (YYYY-MM). */
export async function getBudgets(
  supabase: SB,
  userId: string,
  month: string,
): Promise<Budget[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month);
  if (error) throw error;
  return data ?? [];
}

/** Upsert keyed on (user_id, category, month). */
export async function upsertBudget(
  supabase: SB,
  input: Inserts<"budgets">,
): Promise<Budget> {
  const { data, error } = await supabase
    .from("budgets")
    .upsert(input, { onConflict: "user_id,category,month" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBudget(supabase: SB, budgetId: string): Promise<void> {
  const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
  if (error) throw error;
}

// ── Savings goals ───────────────────────────────────────────────────────────
export async function getSavingsGoals(
  supabase: SB,
  userId: string,
): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("deadline", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSavingsGoal(
  supabase: SB,
  input: Inserts<"savings_goals">,
): Promise<SavingsGoal> {
  const { data, error } = await supabase
    .from("savings_goals")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSavingsGoal(
  supabase: SB,
  goalId: string,
  patch: Updates<"savings_goals">,
): Promise<SavingsGoal> {
  const { data, error } = await supabase
    .from("savings_goals")
    .update(patch)
    .eq("id", goalId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSavingsGoal(supabase: SB, goalId: string): Promise<void> {
  const { error } = await supabase.from("savings_goals").delete().eq("id", goalId);
  if (error) throw error;
}
