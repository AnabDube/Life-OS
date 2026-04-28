/**
 * First-login seeder: insert the 12 default spiritual habits for a new user.
 * Idempotent — does nothing if the user already has habits.
 *
 * Called once after a successful magic-link login (Step 3).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types";
import { DEFAULT_HABITS } from "@/constants/habits";

type SB = SupabaseClient<Database>;

/** Returns the number of habits inserted (0 if the user was already seeded). */
export async function seedDefaultHabits(supabase: SB, userId: string): Promise<number> {
  const { count, error: countError } = await supabase
    .from("habits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (countError) throw countError;
  if ((count ?? 0) > 0) return 0;

  const rows = DEFAULT_HABITS.map((h) => ({
    user_id: userId,
    name: h.name,
    detail: h.detail,
    category: h.category,
    active_days: h.active_days,
    sort_order: h.sort_order,
    is_default: true,
  }));

  const { error } = await supabase.from("habits").insert(rows);
  if (error) throw error;
  return rows.length;
}
