"use server";

import Groq from "groq-sdk";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getDailyEntry, getReflection, saveReflection } from "@/lib/daily";
import { getHabitsForUser, getHabitLogsBetween } from "@/lib/habits";
import { getTrades } from "@/lib/trades";

export interface ReflectionResult {
  ok: boolean;
  content: string | null;
  error: string | null;
}

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a warm, gentle Islamic companion writing a brief evening reflection for a Muslim woman who just closed her day. Speak in second person ("you") with intimacy but never preach. Acknowledge what she actually did today — be specific, not generic. End with one short, relevant ayah or hadith and cite the source briefly (e.g. "Qur'an 94:5–6" or "Bukhari 6502").

Keep it 4–6 sentences. Use transliterated Arabic naturally (Alhamdulillah, InshaAllah). If a data field is missing or zero, gently move past it — never call her out for what she didn't do.`;

/**
 * Generate (or refresh) tonight's AI reflection. Pulls the day's data from
 * Supabase, sends it to Groq's Llama 3.3 70B, and caches the result in the
 * `reflections` table keyed on (user_id, date, type='daily').
 */
export async function generateDailyReflection(date: string): Promise<ReflectionResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, content: null, error: "Not signed in." };

  if (!process.env.GROQ_API_KEY) {
    return {
      ok: false,
      content: null,
      error: "AI is not configured. Add GROQ_API_KEY to .env.local.",
    };
  }

  try {
    const [entry, allHabits, logs, trades] = await Promise.all([
      getDailyEntry(supabase, user.id, date),
      getHabitsForUser(supabase, user.id),
      getHabitLogsBetween(supabase, user.id, date, date),
      getTrades(supabase, user.id, { from: date, to: date }, 50),
    ]);

    const completedIds = new Set(logs.filter((l) => l.done).map((l) => l.habit_id));
    const completedNames = allHabits
      .filter((h) => completedIds.has(h.id))
      .map((h) => h.name);

    const wins = trades.filter((t) => t.outcome === "win").length;
    const losses = trades.filter((t) => t.outcome === "loss").length;

    const completedTasks = await supabase
      .from("tasks")
      .select("title")
      .eq("user_id", user.id)
      .eq("completed", true)
      .gte("completed_at", `${date}T00:00:00.000Z`)
      .lt("completed_at", `${date}T23:59:59.999Z`);

    const tasksDoneCount = completedTasks.data?.length ?? 0;

    const lines: string[] = [
      `Date: ${date}`,
      `Spiritual habits completed (${completedNames.length}): ${completedNames.join(", ") || "none recorded"}`,
      `Mood: ${entry?.mood ?? "—"}/5    Energy: ${entry?.energy ?? "—"}/5`,
      `Day rating: ${entry?.day_rating ?? "—"}/5`,
      `Tasks completed: ${tasksDoneCount}`,
      `Trades today: ${trades.length} (${wins} wins, ${losses} losses)`,
    ];
    if (entry?.morning_intention) lines.push(`Morning intention: ${entry.morning_intention}`);
    if (entry?.evening_reflection) lines.push(`Her own reflection: ${entry.evening_reflection}`);

    const userPrompt = `Reflect on this day for me.\n\n${lines.join("\n")}`;

    const groq = new Groq();
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!content) {
      return { ok: false, content: null, error: "No reflection produced." };
    }

    await saveReflection(supabase, {
      user_id: user.id,
      date,
      type: "daily",
      content,
      habits_summary: {
        completed: completedNames,
        mood: entry?.mood ?? null,
        energy: entry?.energy ?? null,
        day_rating: entry?.day_rating ?? null,
        tasks_done: tasksDoneCount,
        trades: { total: trades.length, wins, losses },
      },
    });

    return { ok: true, content, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reflection failed.";
    return { ok: false, content: null, error: message };
  }
}

/**
 * Look up the previously-cached daily reflection so the client can render it
 * after a refresh without re-calling the model.
 */
export async function loadCachedReflection(date: string): Promise<string | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const reflection = await getReflection(supabase, user.id, date, "daily");
  return reflection?.content ?? null;
}
