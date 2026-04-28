/**
 * Typed query helpers for the Work module: tasks, classes, and class sessions.
 * All Supabase access for that module goes through these named async functions.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Task,
  ClassRow,
  ClassSession,
  Inserts,
  Updates,
} from "@/types";

type SB = SupabaseClient<Database>;

// ── Tasks ───────────────────────────────────────────────────────────────────
export interface TaskFilter {
  /** When false (default), already-completed tasks are excluded. */
  includeCompleted?: boolean;
  category?: Task["category"];
  /** ISO date — only tasks due on or before this date. */
  dueOnOrBefore?: string;
}

export async function getTasks(
  supabase: SB,
  userId: string,
  filter: TaskFilter = {},
): Promise<Task[]> {
  let query = supabase.from("tasks").select("*").eq("user_id", userId);
  if (!filter.includeCompleted) query = query.eq("completed", false);
  if (filter.category) query = query.eq("category", filter.category);
  if (filter.dueOnOrBefore) query = query.lte("due_date", filter.dueOnOrBefore);
  const { data, error } = await query.order("due_date", {
    ascending: true,
    nullsFirst: false,
  });
  if (error) throw error;
  return data ?? [];
}

export async function createTask(supabase: SB, input: Inserts<"tasks">): Promise<Task> {
  const { data, error } = await supabase.from("tasks").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(
  supabase: SB,
  taskId: string,
  patch: Updates<"tasks">,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Mark a task complete or incomplete; stamps `completed_at` accordingly. */
export async function setTaskCompleted(
  supabase: SB,
  taskId: string,
  completed: boolean,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(supabase: SB, taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

// ── Classes ─────────────────────────────────────────────────────────────────
export async function getClasses(
  supabase: SB,
  userId: string,
  opts: { activeOnly?: boolean } = {},
): Promise<ClassRow[]> {
  let query = supabase.from("classes").select("*").eq("user_id", userId);
  if (opts.activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createClass(
  supabase: SB,
  input: Inserts<"classes">,
): Promise<ClassRow> {
  const { data, error } = await supabase
    .from("classes")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClass(
  supabase: SB,
  classId: string,
  patch: Updates<"classes">,
): Promise<ClassRow> {
  const { data, error } = await supabase
    .from("classes")
    .update(patch)
    .eq("id", classId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClass(supabase: SB, classId: string): Promise<void> {
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) throw error;
}

// ── Class sessions ──────────────────────────────────────────────────────────
export async function getClassSessions(
  supabase: SB,
  classId: string,
): Promise<ClassSession[]> {
  const { data, error } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("class_id", classId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** All class sessions for a user across every class — used to render history without N+1 fetches. */
export async function getAllClassSessions(
  supabase: SB,
  userId: string,
): Promise<ClassSession[]> {
  const { data, error } = await supabase
    .from("class_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Upsert today's attendance/notes for a class — keyed on (class_id, date). */
export async function logClassSession(
  supabase: SB,
  input: Inserts<"class_sessions">,
): Promise<ClassSession> {
  const { data, error } = await supabase
    .from("class_sessions")
    .upsert(input, { onConflict: "class_id,date" })
    .select()
    .single();
  if (error) throw error;
  return data;
}
