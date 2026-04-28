"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createTask, setTaskCompleted, deleteTask } from "@/lib/tasks";
import TaskRow from "./TaskRow";
import AddTaskSheet from "./AddTaskSheet";
import type { Task, TaskPriority, Inserts } from "@/types";

interface TasksPanelProps {
  userId: string;
  initialTasks: Task[];
  onToast: (message: string) => void;
}

const PRIORITY_ORDER: ReadonlyArray<TaskPriority> = ["high", "medium", "low"];
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: "High priority",
  medium: "Medium",
  low: "Low",
};

export default function TasksPanel({ userId, initialTasks, onToast }: TasksPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [addOpen, setAddOpen] = useState(false);

  const grouped = useMemo<Record<TaskPriority, Task[]>>(() => {
    const map: Record<TaskPriority, Task[]> = { high: [], medium: [], low: [] };
    for (const t of tasks) map[t.priority].push(t);
    for (const p of PRIORITY_ORDER) {
      map[p].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.completed) {
          return (b.completed_at ?? "").localeCompare(a.completed_at ?? "");
        }
        return (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31");
      });
    }
    return map;
  }, [tasks]);

  async function handleToggle(task: Task): Promise<void> {
    const wasCompleted = task.completed;
    const nowIso = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, completed: !wasCompleted, completed_at: !wasCompleted ? nowIso : null }
          : t,
      ),
    );
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
    if (!wasCompleted) onToast(`Done — ${task.title}`);
    try {
      await setTaskCompleted(supabase, task.id, !wasCompleted);
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  }

  async function handleDelete(task: Task): Promise<void> {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await deleteTask(supabase, task.id);
    } catch {
      setTasks((prev) => [task, ...prev]);
    }
  }

  async function handleAdd(input: Omit<Inserts<"tasks">, "user_id">): Promise<void> {
    const created = await createTask(supabase, { user_id: userId, ...input });
    setTasks((prev) => [created, ...prev]);
    setAddOpen(false);
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-fg">
          Tasks
        </h2>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--border-2)] bg-[var(--green-glow)] px-3 text-xs font-medium text-green hover:opacity-90"
        >
          <Plus size={14} /> Add task
        </button>
      </header>

      {tasks.length === 0 ? (
        <p className="rounded-[10px] border border-[var(--border-1)] bg-bg-2 p-5 text-center text-sm text-fg-mid">
          A clear list — start with one thing for today.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {PRIORITY_ORDER.map((p) =>
            grouped[p].length === 0 ? null : (
              <div key={p}>
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-fg-dim">
                  {PRIORITY_LABEL[p]}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {grouped[p].map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onToggleComplete={() => void handleToggle(t)}
                      onDelete={() => void handleDelete(t)}
                    />
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      )}

      <AddTaskSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleAdd}
      />
    </section>
  );
}
