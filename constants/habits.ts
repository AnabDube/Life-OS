import type { HabitCategory } from "@/types";

/**
 * Date the tracker "begins". Dates before this are shown as N/A in week views.
 * Matches `START` in `prototype.html`.
 */
export const TRACKER_START_DATE = new Date(2026, 3, 28); // 28 April 2026

/**
 * Shape of a default-habit seed row. Mirrors the writable subset of
 * `Inserts<"habits">` minus user_id, which the seeder fills in.
 */
export interface DefaultHabitSeed {
  name: string;
  detail: string;
  category: HabitCategory;
  /** null = every day. e.g. `[5]` = Friday only; `[1,4]` = Mon + Thu. */
  active_days: number[] | null;
  sort_order: number;
}

/**
 * The 12 default spiritual habits, ported from `prototype.html`.
 * Inserted for every new user on first login (see `lib/seed.ts`).
 */
export const DEFAULT_HABITS: readonly DefaultHabitSeed[] = [
  { name: "La ilaha illa Allah",                detail: "× 100",            category: "dhikr",   active_days: null,  sort_order: 0  },
  { name: "La hawla wala quwwata illa billah",  detail: "× 100",            category: "dhikr",   active_days: null,  sort_order: 1  },
  { name: "Astaghfirullah",                     detail: "× 100",            category: "dhikr",   active_days: null,  sort_order: 2  },
  { name: "Salawat",                            detail: "× 100",            category: "dhikr",   active_days: null,  sort_order: 3  },
  { name: "Tasbeeh, Tahmeed, Takbir",           detail: "× 100",            category: "dhikr",   active_days: null,  sort_order: 4  },
  { name: "Surah Al-Baqarah",                   detail: "3 days complete",  category: "quran",   active_days: null,  sort_order: 5  },
  { name: "Quran translation",                  detail: "Page to page",     category: "quran",   active_days: null,  sort_order: 6  },
  { name: "Quran + at least 1 surah",           detail: "Daily",            category: "quran",   active_days: null,  sort_order: 7  },
  { name: "Surah Al-Mulk",                      detail: "Every night",      category: "ibadah",  active_days: null,  sort_order: 8  },
  { name: "Surah Al-Waqiah",                    detail: "Every night",      category: "ibadah",  active_days: null,  sort_order: 9  },
  { name: "Surah Al-Kahf",                      detail: "Every Friday",     category: "ibadah",  active_days: [5],   sort_order: 10 },
  { name: "Fast Mondays & Thursdays",           detail: "",                 category: "fasting", active_days: [1, 4], sort_order: 11 },
] as const;

/** Whether a habit with the given `active_days` should show as actionable on `date`. */
export function isHabitActiveOnDay(activeDays: number[] | null, date: Date): boolean {
  return activeDays === null || activeDays.includes(date.getDay());
}

/** Whether `date` is before the tracker start date (renders as N/A). */
export function isBeforeTrackerStart(date: Date): boolean {
  const start = new Date(TRACKER_START_DATE);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < start;
}
