/**
 * Typed query helpers for habits + habit_logs.
 *
 * Components never call Supabase directly — they import these named async
 * functions and pass a `SupabaseClient<Database>` (created via the server
 * or browser factory in `lib/supabase/`).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Habit, HabitLog, Inserts, Updates } from "@/types";

type SB = SupabaseClient<Database>;

/** Every habit (default + custom) for a user, ordered by `sort_order`. */
export async function getHabitsForUser(supabase: SB, userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** All habit logs for a user between two ISO dates (inclusive). */
export async function getHabitLogsBetween(
  supabase: SB,
  userId: string,
  fromIso: string,
  toIso: string,
): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", fromIso)
    .lte("date", toIso);
  if (error) throw error;
  return data ?? [];
}

/** All logs for one habit, newest first. Used by the per-habit stats drawer. */
export async function getLogsForHabit(supabase: SB, habitId: string): Promise<HabitLog[]> {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("habit_id", habitId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Toggle the log for `(user, habit, date)` to `done`.
 * `true` upserts a row; `false` deletes any existing row.
 */
export async function toggleHabitLog(
  supabase: SB,
  userId: string,
  habitId: string,
  dateIso: string,
  done: boolean,
): Promise<void> {
  if (done) {
    const { error } = await supabase
      .from("habit_logs")
      .upsert(
        { user_id: userId, habit_id: habitId, date: dateIso, done: true },
        { onConflict: "user_id,habit_id,date" },
      );
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("habit_logs")
    .delete()
    .eq("user_id", userId)
    .eq("habit_id", habitId)
    .eq("date", dateIso);
  if (error) throw error;
}

/** Insert a user-defined habit (always `is_default: false`). */
export async function createCustomHabit(
  supabase: SB,
  input: Omit<Inserts<"habits">, "is_default">,
): Promise<Habit> {
  const { data, error } = await supabase
    .from("habits")
    .insert({ ...input, is_default: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Update an existing habit. Allowed for both default and custom habits. */
export async function updateHabit(
  supabase: SB,
  habitId: string,
  patch: Updates<"habits">,
): Promise<Habit> {
  const { data, error } = await supabase
    .from("habits")
    .update(patch)
    .eq("id", habitId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Delete a habit. Guard rail: only custom (`is_default: false`) habits are removable. */
export async function deleteCustomHabit(supabase: SB, habitId: string): Promise<void> {
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("is_default", false);
  if (error) throw error;
}
