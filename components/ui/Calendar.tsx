"use client";

import { useState, useMemo } from "react";

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  label: string;
  color?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  onDateClick?: (date: string) => void;
  selectedDate?: string | null;
  size?: "default" | "large";
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function Calendar({
  events = [],
  onDateClick,
  selectedDate,
  size = "default",
}: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prev = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };
  const next = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isLarge = size === "large";

  /* ═══ DEFAULT (small) ═══ */
  if (!isLarge) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={prev} className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4e4e4e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span className="text-[15px] font-medium" style={{ letterSpacing: "0.15px" }}>{year}년 {month + 1}월</span>
          <button onClick={next} className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4e4e4e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-[#777169] py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const dateStr = formatDate(year, month, day);
            const isToday = dateStr === todayStr;
            const dayEvents = eventMap.get(dateStr);
            return (
              <button key={dateStr} onClick={() => onDateClick?.(dateStr)} className="flex flex-col items-center py-1 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]" style={{ minHeight: "36px" }}>
                <span className="flex items-center justify-center w-6 h-6 text-[13px] rounded-full" style={{ backgroundColor: isToday ? "#000" : "transparent", color: isToday ? "#fff" : "#000", fontWeight: isToday ? 600 : 400 }}>{day}</span>
                {dayEvents && dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((ev, j) => (
                      <span key={j} className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: ev.color ?? "#3b82f6" }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ═══ LARGE — Google Calendar style ═══ */

  // 빈 셀을 포함해서 전체 줄 수 계산
  const totalCells = cells.length;
  const totalRows = Math.ceil(totalCells / 7);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={prev}
          className="flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-colors hover:bg-[#f5f5f5]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4e4e4e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[20px] font-semibold" style={{ letterSpacing: "-0.3px" }}>
          {year}년 {month + 1}월
        </span>
        <button
          onClick={next}
          className="flex items-center justify-center w-10 h-10 rounded-xl cursor-pointer transition-colors hover:bg-[#f5f5f5]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4e4e4e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div
        className="grid grid-cols-7"
        style={{ borderBottom: "1px solid #e5e5e5" }}
      >
        {DAYS.map((d, i) => (
          <div
            key={d}
            className="text-center text-[12px] font-medium py-2"
            style={{
              color: i === 0 ? "#ef4444" : i === 6 ? "#3b82f6" : "#777169",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Date grid — Google Calendar style */}
      <div className="grid grid-cols-7" style={{ borderLeft: "1px solid #f0f0f0" }}>
        {cells.map((day, i) => {
          const colIdx = i % 7;
          const rowIdx = Math.floor(i / 7);
          const isLastRow = rowIdx === totalRows - 1;

          if (day === null) {
            return (
              <div
                key={`e-${i}`}
                style={{
                  borderRight: "1px solid #f0f0f0",
                  borderBottom: isLastRow ? "none" : "1px solid #f0f0f0",
                  minHeight: "100px",
                }}
              />
            );
          }

          const dateStr = formatDate(year, month, day);
          const isToday = dateStr === todayStr;
          const isSelected = selectedDate === dateStr;
          const dayEvents = eventMap.get(dateStr) ?? [];
          const visibleEvents = dayEvents.slice(0, 2);
          const moreCount = dayEvents.length - 2;

          return (
            <button
              key={dateStr}
              onClick={() => onDateClick?.(dateStr)}
              className="flex flex-col items-stretch text-left cursor-pointer transition-colors"
              style={{
                minHeight: "100px",
                padding: "4px",
                borderRight: "1px solid #f0f0f0",
                borderBottom: isLastRow ? "none" : "1px solid #f0f0f0",
                backgroundColor: isSelected
                  ? "rgba(59,130,246,0.04)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isSelected)
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#fafafa";
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? "rgba(59,130,246,0.04)" : "transparent";
              }}
            >
              {/* Date number */}
              <div className="flex items-start justify-between mb-1">
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "28px",
                    height: "28px",
                    fontSize: "13px",
                    fontWeight: isToday ? 600 : 400,
                    backgroundColor: isToday
                      ? "#000"
                      : isSelected
                      ? "rgba(59,130,246,0.12)"
                      : "transparent",
                    color: isToday
                      ? "#fff"
                      : isSelected
                      ? "#2563eb"
                      : colIdx === 0
                      ? "#ef4444"
                      : colIdx === 6
                      ? "#3b82f6"
                      : "#333",
                  }}
                >
                  {day}
                </span>
              </div>

              {/* Event chips */}
              <div className="flex flex-col gap-[3px] flex-1">
                {visibleEvents.map((ev, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-1 px-1.5 py-[2px] rounded-[4px] truncate"
                    style={{
                      backgroundColor: `${ev.color ?? "#3b82f6"}14`,
                    }}
                  >
                    <span
                      className="w-[5px] h-[5px] rounded-full shrink-0"
                      style={{ backgroundColor: ev.color ?? "#3b82f6" }}
                    />
                    <span
                      className="text-[10px] truncate"
                      style={{ color: ev.color ?? "#3b82f6", fontWeight: 500 }}
                    >
                      {ev.label}
                    </span>
                  </div>
                ))}
                {moreCount > 0 && (
                  <span className="text-[9px] text-[#999] font-medium px-1.5">
                    +{moreCount}건 더
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
