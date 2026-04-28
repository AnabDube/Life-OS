import { redirect } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getHabitsForUser, getHabitLogsBetween } from "@/lib/habits";
import { todayInTimezone, formatLongDate } from "@/lib/dates";
import DeenClient from "./DeenClient";

export default async function DeenPage() {
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

  const [habits, logs] = await Promise.all([
    getHabitsForUser(supabase, user.id),
    // Wide range — habit data per user is small, RLS-scoped, and we need it
    // all to compute streaks / longest-ever / consistency.
    getHabitLogsBetween(supabase, user.id, "2020-01-01", "2099-12-31"),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-6 pb-8 lg:px-8 lg:pt-10">
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-fg-dim">
          {formatLongDate(today, tz)}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-fg">
          Deen
        </h1>
        <p className="mt-1 text-sm text-fg-mid">
          Your spiritual rhythm — track it gently.
        </p>
      </header>

      <DeenClient
        userId={user.id}
        initialHabits={habits}
        initialLogs={logs}
        todayIso={today}
      />
    </div>
  );
}
