"use client";

import { CalendarClock, RefreshCw, ChartLine, type LucideIcon } from "lucide-react";
import TaskCard from "./TaskCard";
import { getUpcomingTasks, type HomeRole, type TaskStatus } from "@/data/home-tasks";

const ICON_MAP: Record<TaskStatus, LucideIcon> = {
  approval: CalendarClock,
  quote: CalendarClock,
  shipping: CalendarClock,
  schedule: RefreshCw,
  renewal: CalendarClock,
  review: ChartLine,
  insight: CalendarClock,
};

interface Props {
  role: HomeRole;
}

export default function UpcomingSection({ role }: Props) {
  const tasks = getUpcomingTasks(role);
  if (tasks.length === 0) return null;

  return (
    <section>
      <h2
        className="text-[13px] font-medium text-[#777169] mb-3 px-1"
        style={{ letterSpacing: "0.14px" }}
      >
        예정됨
      </h2>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            href={`/chat?q=${encodeURIComponent(t.prompt)}`}
            icon={ICON_MAP[t.status]}
            title={t.title}
            meta={t.meta}
          />
        ))}
      </div>
    </section>
  );
}
