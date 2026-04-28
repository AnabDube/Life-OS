/**
 * Pure stats helpers for the Deen module. Streaks and consistency are computed
 * from a `Map<habit_id, Set<dateIso>>` of completed-log dates so the page can
 * render every number without round-tripping to the server.
 */
import type { Habit } from "@/types";
import { isHabitActiveOnDay } from "@/constants/habits";
import {
  parseDateLocal,
  formatDateLocal,
  addDays,
  startOfWeek,
} from "@/lib/dates";

export type LogIndex = Map<string, Set<string>>;

export interface HabitStats {
  /** Consecutive applicable days completed, anchored on `todayIso`. */
  current: number;
  /** Longest run of applicable days completed in the habit's lifetime. */
  longest: number;
  /** Total number of done logs ever. */
  total: number;
  /** done / applicable (since habit creation) — 0..100, rounded. */
  consistencyPercent: number;
}

export function computeHabitStats(
  habit: Habit,
  doneDates: Set<string>,
  todayIso: string,
): HabitStats {
  const today = parseDateLocal(todayIso);
  const start = parseDateLocal(habit.created_at.slice(0, 10));

  let current = 0;
  let longest = 0;
  let running = 0;
  let total = 0;
  let applicable = 0;

  for (let d = new Date(start); d <= today; d = addDays(d, 1)) {
    if (!isHabitActiveOnDay(habit.active_days, d)) continue;
    applicable++;
    if (doneDates.has(formatDateLocal(d))) {
      total++;
      running++;
      if (running > longest) longest = running;
    } else {
      running = 0;
    }
  }

  for (let d = new Date(today); d >= start; d = addDays(d, -1)) {
    if (!isHabitActiveOnDay(habit.active_days, d)) continue;
    if (doneDates.has(formatDateLocal(d))) current++;
    else break;
  }

  const consistencyPercent =
    applicable === 0 ? 0 : Math.round((total / applicable) * 100);
  return { current, longest, total, consistencyPercent };
}

export interface AggregateStats {
  todayDone: number;
  todayPossible: number;
  /** Completion percentage for the current week so far (Sun→today). */
  weekPercent: number;
  /** Total `done` logs across all habits. */
  allTimeTotal: number;
  /** Longest run any habit has ever achieved. */
  bestEverStreak: number;
}

export function buildLogIndex(
  logs: ReadonlyArray<{ habit_id: string; date: string; done: boolean }>,
): LogIndex {
  const map: LogIndex = new Map();
  for (const log of logs) {
    if (!log.done) continue;
    let set = map.get(log.habit_id);
    if (!set) {
      set = new Set();
      map.set(log.habit_id, set);
    }
    set.add(log.date);
  }
  return map;
}

export function computeAggregateStats(
  habits: ReadonlyArray<Habit>,
  index: LogIndex,
  todayIso: string,
): AggregateStats {
  const today = parseDateLocal(todayIso);
  const weekStart = startOfWeek(today);

  let todayDone = 0;
  let todayPossible = 0;
  let weekDone = 0;
  let weekPossible = 0;
  let allTimeTotal = 0;
  let bestEverStreak = 0;

  for (const habit of habits) {
    const dones = index.get(habit.id) ?? new Set<string>();

    if (isHabitActiveOnDay(habit.active_days, today)) {
      todayPossible++;
      if (dones.has(todayIso)) todayDone++;
    }

    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      if (d > today) break;
      if (!isHabitActiveOnDay(habit.active_days, d)) continue;
      weekPossible++;
      if (dones.has(formatDateLocal(d))) weekDone++;
    }

    allTimeTotal += dones.size;

    const stats = computeHabitStats(habit, dones, todayIso);
    if (stats.longest > bestEverStreak) bestEverStreak = stats.longest;
  }

  const weekPercent =
    weekPossible === 0 ? 0 : Math.round((weekDone / weekPossible) * 100);
  return { todayDone, todayPossible, weekPercent, allTimeTotal, bestEverStreak };
}

/** Per-day completion ratio (done / applicable) for a date range. Used by the heatmap. */
export function dailyCompletionRatios(
  habits: ReadonlyArray<Habit>,
  index: LogIndex,
  fromIso: string,
  toIso: string,
): Map<string, number> {
  const out = new Map<string, number>();
  const start = parseDateLocal(fromIso);
  const end = parseDateLocal(toIso);
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    let possible = 0;
    let done = 0;
    for (const habit of habits) {
      if (!isHabitActiveOnDay(habit.active_days, d)) continue;
      possible++;
      const dones = index.get(habit.id);
      if (dones?.has(formatDateLocal(d))) done++;
    }
    out.set(formatDateLocal(d), possible === 0 ? 0 : done / possible);
  }
  return out;
}
