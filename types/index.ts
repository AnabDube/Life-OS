/**
 * Life OS — single source of truth for application types.
 *
 * The `Database` interface mirrors `lib/schema.sql`. Every table has Row,
 * Insert, and Update shapes so Supabase queries are end-to-end typed.
 * Convenience aliases (`Habit`, `Trade`, etc.) are provided for ergonomic
 * imports throughout the app.
 *
 * Hand-maintained for now; once the schema stabilises, regenerate with
 * `npx supabase gen types typescript --project-id <ref> --schema public`.
 */

// ── Domain enums (mirror DB CHECK constraints) ──────────────────────────────
export type HabitCategory = "dhikr" | "quran" | "ibadah" | "fasting" | "general";
export type TimeBlockCategory = "deen" | "work" | "trading" | "personal";
export type TaskCategory = "work" | "class" | "personal";
export type TaskPriority = "low" | "medium" | "high";
export type TradeDirection = "buy" | "sell";
export type TradeSession = "london" | "new_york" | "asian" | "overlap";
export type TradeOutcome = "win" | "loss" | "breakeven";
export type AccountType = "bank" | "trading" | "savings" | "mobile_money";
export type TransactionType = "income" | "expense" | "transfer";
export type ReflectionType = "daily" | "weekly";

/** 0 = Sunday … 6 = Saturday (matches `Date#getDay`). */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ── Database ────────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          timezone: string | null;
          avatar_url: string | null;
          daily_reminder_time: string | null;
          morning_start_time: string | null;
          evening_start_time: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          timezone?: string | null;
          avatar_url?: string | null;
          daily_reminder_time?: string | null;
          morning_start_time?: string | null;
          evening_start_time?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          timezone?: string | null;
          avatar_url?: string | null;
          daily_reminder_time?: string | null;
          morning_start_time?: string | null;
          evening_start_time?: string | null;
        };
        Relationships: [];
      };

      daily_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          morning_intention: string | null;
          evening_reflection: string | null;
          mood: number | null;
          energy: number | null;
          day_rating: number | null;
          gratitude: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          morning_intention?: string | null;
          evening_reflection?: string | null;
          mood?: number | null;
          energy?: number | null;
          day_rating?: number | null;
          gratitude?: string | null;
          created_at?: string;
        };
        Update: {
          date?: string;
          morning_intention?: string | null;
          evening_reflection?: string | null;
          mood?: number | null;
          energy?: number | null;
          day_rating?: number | null;
          gratitude?: string | null;
        };
        Relationships: [];
      };

      time_blocks: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          start_time: string;
          end_time: string;
          label: string;
          category: TimeBlockCategory;
          color: string | null;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          start_time: string;
          end_time: string;
          label: string;
          category: TimeBlockCategory;
          color?: string | null;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          date?: string;
          start_time?: string;
          end_time?: string;
          label?: string;
          category?: TimeBlockCategory;
          color?: string | null;
          completed?: boolean;
        };
        Relationships: [];
      };

      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          detail: string;
          category: HabitCategory;
          /** null = active every day; otherwise weekday indices (0..6, Sun..Sat). */
          active_days: number[] | null;
          is_default: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          detail?: string;
          category: HabitCategory;
          active_days?: number[] | null;
          is_default?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          detail?: string;
          category?: HabitCategory;
          active_days?: number[] | null;
          is_default?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };

      habit_logs: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          date: string;
          done: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id: string;
          date: string;
          done?: boolean;
          created_at?: string;
        };
        Update: {
          done?: boolean;
        };
        Relationships: [];
      };

      reflections: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          type: ReflectionType;
          content: string;
          habits_summary: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          type?: ReflectionType;
          content: string;
          habits_summary?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          content?: string;
          habits_summary?: Record<string, unknown> | null;
          type?: ReflectionType;
        };
        Relationships: [];
      };

      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          category: TaskCategory;
          priority: TaskPriority;
          due_date: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          notes?: string | null;
          category: TaskCategory;
          priority?: TaskPriority;
          due_date?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          notes?: string | null;
          category?: TaskCategory;
          priority?: TaskPriority;
          due_date?: string | null;
          completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: [];
      };

      classes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          platform: string | null;
          schedule_days: number[] | null;
          schedule_time: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          platform?: string | null;
          schedule_days?: number[] | null;
          schedule_time?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          platform?: string | null;
          schedule_days?: number[] | null;
          schedule_time?: string | null;
          notes?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };

      class_sessions: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          date: string;
          attended: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          date: string;
          attended?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          attended?: boolean;
          notes?: string | null;
          date?: string;
        };
        Relationships: [];
      };

      trades: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          pair: string;
          direction: TradeDirection;
          entry_price: number;
          exit_price: number | null;
          lot_size: number;
          stop_loss: number | null;
          take_profit: number | null;
          pips: number | null;
          profit_loss: number | null;
          session: TradeSession | null;
          confluences: string[];
          emotions_before: string[];
          emotions_after: string[];
          outcome: TradeOutcome | null;
          screenshot_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          pair: string;
          direction: TradeDirection;
          entry_price: number;
          exit_price?: number | null;
          lot_size: number;
          stop_loss?: number | null;
          take_profit?: number | null;
          pips?: number | null;
          profit_loss?: number | null;
          session?: TradeSession | null;
          confluences?: string[];
          emotions_before?: string[];
          emotions_after?: string[];
          outcome?: TradeOutcome | null;
          screenshot_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          date?: string;
          pair?: string;
          direction?: TradeDirection;
          entry_price?: number;
          exit_price?: number | null;
          lot_size?: number;
          stop_loss?: number | null;
          take_profit?: number | null;
          pips?: number | null;
          profit_loss?: number | null;
          session?: TradeSession | null;
          confluences?: string[];
          emotions_before?: string[];
          emotions_after?: string[];
          outcome?: TradeOutcome | null;
          screenshot_url?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };

      trading_rules: {
        Row: {
          id: string;
          user_id: string;
          rule: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rule: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          rule?: string;
          is_active?: boolean;
        };
        Relationships: [];
      };

      trade_rule_checks: {
        Row: {
          trade_id: string;
          rule_id: string;
          followed: boolean;
        };
        Insert: {
          trade_id: string;
          rule_id: string;
          followed?: boolean;
        };
        Update: {
          followed?: boolean;
        };
        Relationships: [];
      };

      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: AccountType;
          currency: string;
          balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: AccountType;
          currency?: string;
          balance?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          type?: AccountType;
          currency?: string;
          balance?: number;
        };
        Relationships: [];
      };

      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          amount: number;
          type: TransactionType;
          category: string;
          description: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          amount: number;
          type: TransactionType;
          category: string;
          description?: string | null;
          date: string;
          created_at?: string;
        };
        Update: {
          amount?: number;
          type?: TransactionType;
          category?: string;
          description?: string | null;
          date?: string;
          account_id?: string;
        };
        Relationships: [];
      };

      budgets: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          monthly_limit: number;
          /** "YYYY-MM" */
          month: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          monthly_limit: number;
          month: string;
          created_at?: string;
        };
        Update: {
          monthly_limit?: number;
          category?: string;
          month?: string;
        };
        Relationships: [];
      };

      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          deadline: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          deadline?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          target_amount?: number;
          current_amount?: number;
          deadline?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ── Convenience aliases ─────────────────────────────────────────────────────
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type DailyEntry = Tables<"daily_entries">;
export type TimeBlock = Tables<"time_blocks">;
export type Habit = Tables<"habits">;
export type HabitLog = Tables<"habit_logs">;
export type Reflection = Tables<"reflections">;
export type Task = Tables<"tasks">;
export type ClassRow = Tables<"classes">;
export type ClassSession = Tables<"class_sessions">;
export type Trade = Tables<"trades">;
export type TradingRule = Tables<"trading_rules">;
export type TradeRuleCheck = Tables<"trade_rule_checks">;
export type Account = Tables<"accounts">;
export type Transaction = Tables<"transactions">;
export type Budget = Tables<"budgets">;
export type SavingsGoal = Tables<"savings_goals">;

// ── Derived / aggregate shapes used by the UI ───────────────────────────────
/** Aggregated completion stats over a window of days (a week, a month, etc.). */
export interface WeekStats {
  done: number;
  possible: number;
  /** 0..100, rounded. */
  percent: number;
}

/** Streak info for a single habit. */
export interface StreakData {
  habitId: string;
  /** Current consecutive applicable-days completed, anchored on today. */
  current: number;
  /** Longest consecutive applicable-days completed ever. */
  longest: number;
}
