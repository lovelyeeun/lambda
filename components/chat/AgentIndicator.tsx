import { Package, Truck, Shield, BarChart3, Bot } from "lucide-react";

const agentConfig: Record<string, { label: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }> ; color: string }> = {
  주문:   { label: "구매 에이전트", icon: Package,   color: "#3b82f6" },
  배송:   { label: "배송 에이전트", icon: Truck,     color: "#22c55e" },
  권한:   { label: "권한 에이전트", icon: Shield,    color: "#f59e0b" },
  분석:   { label: "분석 에이전트", icon: BarChart3, color: "#8b5cf6" },
};

interface AgentIndicatorProps {
  agent: string;
}

export default function AgentIndicator({ agent }: AgentIndicatorProps) {
  const cfg = agentConfig[agent] ?? { label: `${agent} 에이전트`, icon: Bot, color: "#777169" };
  const Icon = cfg.icon;

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded-md"
      style={{
        backgroundColor: `${cfg.color}12`,
        color: cfg.color,
        letterSpacing: "0.14px",
      }}
    >
      <Icon size={12} strokeWidth={1.5} />
      {cfg.label}
    </span>
  );
}
