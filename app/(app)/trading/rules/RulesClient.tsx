"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  createTradingRule,
  updateTradingRule,
  deleteTradingRule,
} from "@/lib/trades";
import type { TradingRule } from "@/types";

interface RulesClientProps {
  userId: string;
  initialRules: TradingRule[];
}

export default function RulesClient({ userId, initialRules }: RulesClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [rules, setRules] = useState<TradingRule[]>(initialRules);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(): Promise<void> {
    const text = draft.trim();
    if (!text) return;
    setAdding(true);
    setError(null);
    try {
      const created = await createTradingRule(supabase, {
        user_id: userId,
        rule: text,
      });
      setRules((prev) => [...prev, created]);
      setDraft("");
    } catch {
      setError("Couldn't save just now — try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(rule: TradingRule): Promise<void> {
    const next = !rule.is_active;
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, is_active: next } : r)),
    );
    try {
      await updateTradingRule(supabase, rule.id, { is_active: next });
    } catch {
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: rule.is_active } : r)),
      );
    }
  }

  async function handleEdit(rule: TradingRule, text: string): Promise<void> {
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, rule: text } : r)),
    );
    try {
      await updateTradingRule(supabase, rule.id, { rule: text });
    } catch {
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? rule : r)),
      );
    }
  }

  async function handleDelete(rule: TradingRule): Promise<void> {
    if (!window.confirm("Delete this rule?")) return;
    setRules((prev) => prev.filter((r) => r.id !== rule.id));
    try {
      await deleteTradingRule(supabase, rule.id);
    } catch {
      setRules((prev) => [...prev, rule]);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[10px] border border-[var(--border-1)] bg-bg-2 p-3">
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-wider text-fg-dim">
            Add a new rule
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
              placeholder="No trading after a loss for 30 minutes."
              maxLength={200}
              className="flex-1 rounded-md border border-[var(--border-1)] bg-card px-3 py-2 text-sm text-fg placeholder:text-fg-dim outline-none focus:border-[var(--border-2)]"
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={adding || !draft.trim()}
              className="flex items-center gap-1 rounded-md border border-[var(--border-2)] bg-[var(--green-glow)] px-3 text-xs font-medium text-green disabled:opacity-60"
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-[11px] text-danger-text">
              {error}
            </p>
          ) : null}
        </label>
      </div>

      {rules.length === 0 ? (
        <p className="rounded-[10px] border border-[var(--border-1)] bg-bg-2 p-5 text-center text-sm text-fg-mid">
          No rules yet. The first one is often the most important.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center gap-3 rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2"
            >
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rule.is_active}
                  onChange={() => void handleToggle(rule)}
                  aria-label={rule.is_active ? "Disable rule" : "Enable rule"}
                  className="h-4 w-4 accent-green"
                />
              </label>
              <input
                type="text"
                defaultValue={rule.rule}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== rule.rule) {
                    void handleEdit(rule, e.target.value.trim());
                  }
                }}
                className={
                  "flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none focus:border-[var(--border-2)] focus:bg-bg-3 " +
                  (rule.is_active ? "text-fg" : "text-fg-mid line-through")
                }
              />
              <button
                type="button"
                onClick={() => void handleDelete(rule)}
                aria-label="Delete rule"
                className="flex h-9 w-9 items-center justify-center rounded-md text-fg-mid hover:bg-bg-3 hover:text-danger-soft"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
