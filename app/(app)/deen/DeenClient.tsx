"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  toggleHabitLog,
  createCustomHabit,
  deleteCustomHabit,
} from "@/lib/habits";
import { isHabitActiveOnDay } from "@/constants/habits";
import {
  parseDateLocal,
  startOfWeek,
  startOfMonth,
  addDays,
} from "@/lib/dates";
import {
  buildLogIndex,
  computeAggregateStats,
  computeHabitStats,
  type LogIndex,
} from "@/lib/stats";
import type { Habit, HabitLog, Inserts } from "@/types";

import DayStrip from "./DayStrip";
import HabitRow from "./HabitRow";
import StatsPanel from "./StatsPanel";
import MonthHeatmap, { moveMonth } from "./MonthHeatmap";
import HabitStatsDrawer from "./HabitStatsDrawer";
import AddHabitModal from "./AddHabitModal";
import DeleteHabitDialog from "./DeleteHabitDialog";
import Toast from "@/components/ui/Toast";

interface DeenClientProps {
  userId: string;
  initialHabits: Habit[];
  initialLogs: HabitLog[];
  todayIso: string;
}

type View = "week" | "month";

export default function DeenClient({
  userId,
  initialHabits,
  initialLogs,
  todayIso,
}: DeenClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [index, setIndex] = useState<LogIndex>(() => buildLogIndex(initialLogs));
  const [view, setView] = useState<View>("week");
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(parseDateLocal(todayIso)),
  );
  const [monthAnchor, setMonthAnchor] = useState<Date>(() =>
    startOfMonth(parseDateLocal(todayIso)),
  );
  const [statsHabit, setStatsHabit] = useState<Habit | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);

  const aggregate = useMemo(
    () => computeAggregateStats(habits, index, todayIso),
    [habits, index, todayIso],
  );
  const selectedDateObj = useMemo(() => parseDateLocal(selectedDate), [selectedDate]);
  const visibleHabits = useMemo(
    () => habits.filter((h) => isHabitActiveOnDay(h.active_days, selectedDateObj)),
    [habits, selectedDateObj],
  );

  function applyToggle(habitId: string, date: string, makeDone: boolean): void {
    setIndex((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(habitId) ?? []);
      if (makeDone) set.add(date);
      else set.delete(date);
      next.set(habitId, set);
      return next;
    });
  }

  async function handleToggle(habit: Habit): Promise<void> {
    const dones = index.get(habit.id);
    const wasDone = dones?.has(selectedDate) ?? false;
    applyToggle(habit.id, selectedDate, !wasDone);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
    if (!wasDone) setToast({ message: `Mashallah — ${habit.name}`, key: Date.now() });
    try {
      await toggleHabitLog(supabase, userId, habit.id, selectedDate, !wasDone);
    } catch {
      applyToggle(habit.id, selectedDate, wasDone);
    }
  }

  async function handleAdd(
    input: Omit<Inserts<"habits">, "is_default" | "user_id">,
  ): Promise<void> {
    const maxSort = habits.reduce((m, h) => (h.sort_order > m ? h.sort_order : m), 0);
    const habit = await createCustomHabit(supabase, {
      user_id: userId,
      sort_order: maxSort + 1,
      ...input,
    });
    setHabits((prev) => [...prev, habit]);
    setAddOpen(false);
  }

  async function handleDelete(): Promise<void> {
    const target = deleteTarget;
    if (!target) return;
    setHabits((prev) => prev.filter((h) => h.id !== target.id));
    setDeleteTarget(null);
    try {
      await deleteCustomHabit(supabase, target.id);
    } catch {
      setHabits((prev) => [...prev, target]);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="flex items-center gap-2 lg:hidden">
          <StatsPanel stats={aggregate} compact />
        </div>

        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-full border border-[var(--border-1)] bg-bg-2 p-0.5 text-xs">
            {(["week", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={
                  "min-w-[72px] rounded-full px-3 py-1.5 capitalize transition-colors " +
                  (view === v ? "bg-[var(--green-glow)] text-green" : "text-fg-mid")
                }
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--border-2)] bg-[var(--green-glow)] px-3 text-xs font-medium text-green hover:opacity-90"
          >
            <Plus size={14} /> Add habit
          </button>
        </div>

        {view === "week" ? (
          <DayStrip
            weekStart={weekStart}
            selectedDate={selectedDate}
            todayIso={todayIso}
            onSelectDate={setSelectedDate}
            onPrevWeek={() => setWeekStart((d) => addDays(d, -7))}
            onNextWeek={() => setWeekStart((d) => addDays(d, 7))}
          />
        ) : (
          <MonthHeatmap
            monthAnchor={monthAnchor}
            habits={habits}
            index={index}
            todayIso={todayIso}
            onSelectDate={(iso) => {
              setSelectedDate(iso);
              setWeekStart(startOfWeek(parseDateLocal(iso)));
              setView("week");
            }}
            onPrevMonth={() => setMonthAnchor((d) => moveMonth(d, -1))}
            onNextMonth={() => setMonthAnchor((d) => moveMonth(d, 1))}
          />
        )}

        {view === "week" ? (
          <ul className="flex flex-col gap-1">
            {visibleHabits.length === 0 ? (
              <li className="rounded-[10px] border border-[var(--border-1)] bg-bg-2 p-5 text-center text-sm text-fg-mid">
                A lighter day — nothing scheduled. Add a habit to start tracking.
              </li>
            ) : (
              visibleHabits.map((habit) => {
                const dones = index.get(habit.id) ?? new Set<string>();
                const stats = computeHabitStats(habit, dones, todayIso);
                const isCustom = !habit.is_default;
                return (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    done={dones.has(selectedDate)}
                    streak={stats.current}
                    onToggle={() => void handleToggle(habit)}
                    onOpenStats={() => setStatsHabit(habit)}
                    onLongPressDelete={isCustom ? () => setDeleteTarget(habit) : undefined}
                  />
                );
              })
            )}
          </ul>
        ) : null}
      </div>

      <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
        <StatsPanel stats={aggregate} />
      </aside>

      <HabitStatsDrawer
        habit={statsHabit}
        index={index}
        todayIso={todayIso}
        onClose={() => setStatsHabit(null)}
      />
      <AddHabitModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleAdd}
      />
      <DeleteHabitDialog
        habit={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <Toast
        message={toast?.message ?? null}
        toastKey={toast?.key}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}
