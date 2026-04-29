import Card from "@/components/ui/Card";
import type { Task } from "@/types";

interface PriorityTasksProps {
  tasks: Task[];
}

const PRIORITY_BADGE: Record<Task["priority"], string> = {
  high: "bg-danger/15 text-danger-soft border-danger/25",
  medium: "bg-gold/15 text-gold border-gold/25",
  low: "bg-bg-3 text-fg-mid border-[var(--border-1)]",
};

const CATEGORY_LABEL: Record<Task["category"], string> = {
  work: "Work",
  class: "Class",
  personal: "Personal",
};

export default function PriorityTasks({ tasks }: PriorityTasksProps) {
  return (
    <Card>
      <header className="mb-3">
        <p className="font-[family-name:var(--font-display)] text-[11px] uppercase tracking-[0.22em] text-gold opacity-90">
          Top priorities
        </p>
      </header>

      {tasks.length === 0 ? (
        <p className="text-sm text-fg-mid">
          Nothing urgent on the list — a clear day to choose from.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-start gap-3 rounded-[10px] border border-[var(--border-1)] bg-bg-2 px-3 py-2"
            >
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${PRIORITY_BADGE[task.priority]}`}
              >
                {task.priority}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-fg">{task.title}</p>
                <p className="text-[11px] text-fg-mid">
                  {CATEGORY_LABEL[task.category]}
                  {task.due_date ? ` · due ${task.due_date}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
