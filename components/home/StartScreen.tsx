"use client";

import StartHero from "./StartHero";
import ScenarioHints from "./ScenarioHints";
import RecommendedSection from "./RecommendedSection";
import type { HomeRole } from "@/data/home-tasks";

interface Props {
  role: HomeRole;
}

export default function StartScreen({ role }: Props) {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="w-full max-w-[720px] mx-auto px-6 pt-20 pb-24">
        <StartHero />

        <ScenarioHints />

        <div className="mt-10 flex flex-col gap-10">
          <RecommendedSection role={role} />
        </div>
      </div>
    </div>
  );
}
