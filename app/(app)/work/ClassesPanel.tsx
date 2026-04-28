"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createClass } from "@/lib/tasks";
import ClassCard from "./ClassCard";
import AddClassSheet from "./AddClassSheet";
import ClassDetailDrawer from "./ClassDetailDrawer";
import { addDays, formatDateLocal, parseDateLocal } from "@/lib/dates";
import type { ClassRow, ClassSession, Inserts } from "@/types";

interface ClassesPanelProps {
  userId: string;
  todayIso: string;
  initialClasses: ClassRow[];
  initialSessions: ClassSession[];
}

const RECENT_WINDOW_DAYS = 14;

export default function ClassesPanel({
  userId,
  todayIso,
  initialClasses,
  initialSessions,
}: ClassesPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [classes, setClasses] = useState<ClassRow[]>(initialClasses);
  const [sessions, setSessions] = useState<ClassSession[]>(initialSessions);
  const [addOpen, setAddOpen] = useState(false);
  const [openClass, setOpenClass] = useState<ClassRow | null>(null);

  const recentSince = useMemo(
    () => formatDateLocal(addDays(parseDateLocal(todayIso), -RECENT_WINDOW_DAYS)),
    [todayIso],
  );

  function recentAttendedCount(classId: string): number {
    let n = 0;
    for (const s of sessions) {
      if (s.class_id === classId && s.attended && s.date >= recentSince) n++;
    }
    return n;
  }

  async function handleAdd(input: Omit<Inserts<"classes">, "user_id">): Promise<void> {
    const created = await createClass(supabase, { user_id: userId, ...input });
    setClasses((prev) => [...prev, created]);
    setAddOpen(false);
  }

  function handleSessionLogged(session: ClassSession): void {
    setSessions((prev) => {
      const filtered = prev.filter(
        (s) => !(s.class_id === session.class_id && s.date === session.date),
      );
      return [session, ...filtered];
    });
  }

  const active = classes.filter((c) => c.is_active);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-fg">
          Classes
        </h2>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--border-2)] bg-[var(--green-glow)] px-3 text-xs font-medium text-green hover:opacity-90"
        >
          <Plus size={14} /> Add class
        </button>
      </header>

      {active.length === 0 ? (
        <p className="rounded-[10px] border border-[var(--border-1)] bg-bg-2 p-5 text-center text-sm text-fg-mid">
          No classes tracked yet. Add the first one to start logging
          attendance.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {active.map((c) => (
            <ClassCard
              key={c.id}
              classRow={c}
              todayIso={todayIso}
              attendedRecently={recentAttendedCount(c.id)}
              onClick={() => setOpenClass(c)}
            />
          ))}
        </div>
      )}

      <AddClassSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleAdd}
      />
      <ClassDetailDrawer
        classRow={openClass}
        userId={userId}
        todayIso={todayIso}
        allSessions={sessions}
        onClose={() => setOpenClass(null)}
        onSessionLogged={handleSessionLogged}
      />
    </section>
  );
}
