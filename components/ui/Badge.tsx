type Status = "완료" | "대기" | "진행중" | "반려";

const statusConfig: Record<Status, { bg: string; text: string; dot: string }> = {
  완료: { bg: "rgba(0,0,0,0.05)", text: "#4e4e4e", dot: "#22c55e" },
  대기: { bg: "rgba(245,242,239,0.8)", text: "#777169", dot: "#f59e0b" },
  진행중: { bg: "rgba(0,0,0,0.05)", text: "#000", dot: "#3b82f6" },
  반려: { bg: "rgba(0,0,0,0.05)", text: "#4e4e4e", dot: "#ef4444" },
};

interface BadgeProps {
  status: Status;
  className?: string;
}

export default function Badge({ status, className = "" }: BadgeProps) {
  const cfg = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[12px] font-medium ${className}`}
      style={{
        borderRadius: "9999px",
        backgroundColor: cfg.bg,
        color: cfg.text,
        letterSpacing: "0.14px",
      }}
    >
      <span
        className="w-[6px] h-[6px] rounded-full shrink-0"
        style={{ backgroundColor: cfg.dot }}
      />
      {status}
    </span>
  );
}
