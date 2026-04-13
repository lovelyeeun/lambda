"use client";

import { CheckCircle2, FileSearch, Truck, type LucideIcon } from "lucide-react";
import TaskCard from "./TaskCard";
import { getActiveTasks, type HomeRole, type TaskStatus } from "@/data/home-tasks";

const ICON_MAP: Record<TaskStatus, LucideIcon> = {
  approval: CheckCircle2,
  quote: FileSearch,
  shipping: Truck,
  schedule: CheckCircle2,
  renewal: CheckCircle2,
  review: CheckCircle2,
  insight: CheckCircle2,
};

interface Props {
  role: HomeRole;
}

export default function ActiveTasksSection({ role }: Props) {
  const tasks = getActiveTasks(role);
  if (tasks.length === 0) return null;

  return (
    <section>
      <h2
        className="text-[13px] font-medium text-[#777169] mb-3 px-1"
        style={{ letterSpacing: "0.14px" }}
      >
        지금 진행 중
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
