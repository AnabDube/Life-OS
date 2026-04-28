"use client";

import { useState } from "react";
import TasksPanel from "./TasksPanel";
import ClassesPanel from "./ClassesPanel";
import Toast from "@/components/ui/Toast";
import type { ClassRow, ClassSession, Task } from "@/types";

interface WorkClientProps {
  userId: string;
  todayIso: string;
  initialTasks: Task[];
  initialClasses: ClassRow[];
  initialSessions: ClassSession[];
}

type Tab = "tasks" | "classes";

export default function WorkClient({
  userId,
  todayIso,
  initialTasks,
  initialClasses,
  initialSessions,
}: WorkClientProps) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);

  function showToast(message: string): void {
    setToast({ message, key: Date.now() });
  }

  return (
    <>
      <div className="mb-5 inline-flex rounded-full border border-[var(--border-1)] bg-bg-2 p-0.5 text-xs md:hidden">
        {(["tasks", "classes"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setTab(v)}
            aria-pressed={tab === v}
            className={
              "min-w-[96px] rounded-full px-3 py-1.5 capitalize transition-colors " +
              (tab === v
                ? "bg-[var(--green-glow)] text-green"
                : "text-fg-mid")
            }
          >
            {v}
          </button>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 md:gap-6">
        <div className={tab === "tasks" ? "block" : "hidden md:block"}>
          <TasksPanel
            userId={userId}
            initialTasks={initialTasks}
            onToast={showToast}
          />
        </div>
        <div className={tab === "classes" ? "block" : "hidden md:block"}>
          <ClassesPanel
            userId={userId}
            todayIso={todayIso}
            initialClasses={initialClasses}
            initialSessions={initialSessions}
          />
        </div>
      </div>

      <Toast
        message={toast?.message ?? null}
        toastKey={toast?.key}
        onDismiss={() => setToast(null)}
      />
    </>
  );
}
