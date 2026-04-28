/**
 * Typed query helpers for the Daily OS: daily_entries, time_blocks, and
 * reflections. All Supabase access for the Today screen goes through here.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  DailyEntry,
  TimeBlock,
  Reflection,
  ReflectionType,
  Inserts,
  Updates,
} from "@/types";

type SB = SupabaseClient<Database>;

// ── Daily entries (morning intention / evening reflection) ──────────────────
export async function getDailyEntry(
  supabase: SB,
  userId: string,
  dateIso: string,
): Promise<DailyEntry | null> {
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateIso)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertDailyEntry(
  supabase: SB,
  input: Inserts<"daily_entries">,
): Promise<DailyEntry> {
  const { data, error } = await supabase
    .from("daily_entries")
    .upsert(input, { onConflict: "user_id,date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Time blocks ─────────────────────────────────────────────────────────────
export async function getTimeBlocks(
  supabase: SB,
  userId: string,
  dateIso: string,
): Promise<TimeBlock[]> {
  const { data, error } = await supabase
    .from("time_blocks")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateIso)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTimeBlock(
  supabase: SB,
  input: Inserts<"time_blocks">,
): Promise<TimeBlock> {
  const { data, error } = await supabase
    .from("time_blocks")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTimeBlock(
  supabase: SB,
  blockId: string,
  patch: Updates<"time_blocks">,
): Promise<TimeBlock> {
  const { data, error } = await supabase
    .from("time_blocks")
    .update(patch)
    .eq("id", blockId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTimeBlock(supabase: SB, blockId: string): Promise<void> {
  const { error } = await supabase.from("time_blocks").delete().eq("id", blockId);
  if (error) throw error;
}

// ── Reflections (AI-generated, daily or weekly) ─────────────────────────────
export async function getReflection(
  supabase: SB,
  userId: string,
  dateIso: string,
  type: ReflectionType = "daily",
): Promise<Reflection | null> {
  const { data, error } = await supabase
    .from("reflections")
    .select("*")
    .eq("user_id", userId)
    .eq("date", dateIso)
    .eq("type", type)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveReflection(
  supabase: SB,
  input: Inserts<"reflections">,
): Promise<Reflection> {
  const { data, error } = await supabase
    .from("reflections")
    .upsert(input, { onConflict: "user_id,date,type" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
