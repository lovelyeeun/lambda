"use client";

import { BarChart3 } from "lucide-react";
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
      <div className="flex items-center gap-1.5 mb-1 px-1">
        <BarChart3 size={13} strokeWidth={1.75} color="#6366f1" />
        <h2
          className="text-[13px] font-medium"
          style={{ letterSpacing: "0.14px", color: "#6366f1" }}
        >
          AI 인사이트
        </h2>
      </div>
      <p
        className="text-[11px] text-[#b8b2a8] mb-3 px-1"
        style={{ letterSpacing: "0.14px" }}
      >
        비용 인텔리전스 기반 · 클릭하면 채팅에서 분석 결과를 확인합니다
      </p>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            href={`/chat?q=${encodeURIComponent(t.prompt)}`}
            icon={BarChart3}
            title={t.title}
            meta={t.meta}
            variant="highlight"
          />
        ))}
      </div>
    </section>
  );
}
