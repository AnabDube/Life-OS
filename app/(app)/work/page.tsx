import { redirect } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getTasks, getClasses, getAllClassSessions } from "@/lib/tasks";
import { todayInTimezone, formatLongDate } from "@/lib/dates";
import WorkClient from "./WorkClient";

export default async function WorkPage() {
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

  const [tasks, classes, sessions] = await Promise.all([
    getTasks(supabase, user.id, { includeCompleted: true }),
    getClasses(supabase, user.id),
    getAllClassSessions(supabase, user.id),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-6 pb-8 lg:px-8 lg:pt-10">
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-fg-dim">
          {formatLongDate(today, tz)}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-fg">
          Work
        </h1>
        <p className="mt-1 text-sm text-fg-mid">
          Tasks and classes — what&apos;s pressing, what&apos;s growing.
        </p>
      </header>

      <WorkClient
        userId={user.id}
        todayIso={today}
        initialTasks={tasks}
        initialClasses={classes}
        initialSessions={sessions}
      />
    </div>
  );
}
