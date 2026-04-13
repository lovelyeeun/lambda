"use client";

import { Sparkles } from "lucide-react";
import TaskCard from "./TaskCard";
import { getRecommendedTasks, type HomeRole } from "@/data/home-tasks";

interface Props {
  role: HomeRole;
}

export default function RecommendedSection({ role }: Props) {
  const tasks = getRecommendedTasks(role);
  if (tasks.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <Sparkles size={13} strokeWidth={1.75} color="#6366f1" />
        <h2
          className="text-[13px] font-medium"
          style={{ letterSpacing: "0.14px", color: "#6366f1" }}
        >
          AI 추천
        </h2>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            href={`/chat?q=${encodeURIComponent(t.prompt)}`}
            icon={Sparkles}
            title={t.title}
            meta={t.meta}
            variant="highlight"
          />
        ))}
      </div>
    </section>
  );
}
