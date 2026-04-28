import { redirect } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getDailyEntry, getReflection, getTimeBlocks } from "@/lib/daily";
import { getHabitsForUser, getHabitLogsBetween } from "@/lib/habits";
import { getTasks } from "@/lib/tasks";
import { isHabitActiveOnDay } from "@/constants/habits";
import {
  todayInTimezone,
  hourInTimezone,
  parseDateLocal,
  formatLongDate,
} from "@/lib/dates";

import MorningBlock from "./MorningBlock";
import HabitChecklist from "./HabitChecklist";
import PriorityTasks from "./PriorityTasks";
import TimeBlocksList from "./TimeBlocks";
import EveningBlock from "./EveningBlock";
import type { Task } from "@/types";

const PRIORITY_RANK: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function pickTopPriorities(tasks: Task[]): Task[] {
  return [...tasks]
    .sort((a, b) => {
      const r = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (r !== 0) return r;
      const ad = a.due_date ?? "9999-12-31";
      const bd = b.due_date ?? "9999-12-31";
      return ad.localeCompare(bd);
    })
    .slice(0, 3);
}

export default async function TodayPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, name")
    .eq("id", user.id)
    .maybeSingle();

  const tz = profile?.timezone ?? "UTC";
  const date = todayInTimezone(tz);
  const hour = hourInTimezone(tz);
  const dateObj = parseDateLocal(date);

  const [entry, allHabits, logs, openTasks, blocks, reflection] =
    await Promise.all([
      getDailyEntry(supabase, user.id, date),
      getHabitsForUser(supabase, user.id),
      getHabitLogsBetween(supabase, user.id, date, date),
      getTasks(supabase, user.id, { dueOnOrBefore: date }),
      getTimeBlocks(supabase, user.id, date),
      getReflection(supabase, user.id, date, "daily"),
    ]);

  const todayHabits = allHabits.filter((h) =>
    isHabitActiveOnDay(h.active_days, dateObj),
  );
  const top3 = pickTopPriorities(openTasks);

  const isMorning = hour < 12;
  const isEvening = hour >= 18;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-6 pb-8 lg:px-8 lg:pt-10">
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-fg-dim">
          {formatLongDate(date, tz)}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight text-fg">
          Today
        </h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
        <MorningBlock
          userId={user.id}
          date={date}
          initialEntry={entry}
          highlight={isMorning}
        />

        <div className="flex flex-col gap-5 lg:gap-6">
          <HabitChecklist
            userId={user.id}
            date={date}
            habits={todayHabits}
            initialLogs={logs}
          />
          <PriorityTasks tasks={top3} />
          <TimeBlocksList blocks={blocks} />
        </div>

        <EveningBlock
          userId={user.id}
          date={date}
          initialEntry={entry}
          initialReflection={reflection}
          highlight={isEvening}
        />
      </div>
    </div>
  );
}
