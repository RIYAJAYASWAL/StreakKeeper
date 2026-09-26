"use client";

import { useMemo, useState } from "react";

export interface LogEntry {
  date: string; // YYYY-MM-DD
  status: "DONE" | "MISSED" | "FROZEN";
  streakCount?: number;
}

export interface HeatmapCalendarProps {
  logs: LogEntry[];
  startDate: string | Date;
}

export default function HeatmapCalendar({ logs, startDate }: HeatmapCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    dateStr: string;
    formattedDate: string;
    statusText: string;
    x: number;
    y: number;
  } | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    // Build a map of logs by YYYY-MM-DD
    const logMap = new Map<string, { status: "DONE" | "MISSED" | "FROZEN"; streakCount: number }>();
    
    // Sort logs chronologically to compute running streaks
    const sortedLogs = [...logs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningStreak = 0;
    sortedLogs.forEach((log) => {
      const dStr = new Date(log.date).toISOString().split("T")[0];
      if (log.status === "DONE" || log.status === "FROZEN") {
        runningStreak += 1;
      } else {
        runningStreak = 0;
      }
      logMap.set(dStr, { status: log.status, streakCount: runningStreak });
    });

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Set timeline range: at least 16 weeks (~4 months) or up to 52 weeks (~1 year)
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 364);

    // Adjust rangeStart to the preceding Sunday so columns align cleanly by week
    const dayOfWeek = rangeStart.getDay();
    rangeStart.setDate(rangeStart.getDate() - dayOfWeek);

    const weeksArr: Array<
      Array<{
        date: Date;
        dateStr: string;
        isBeforeStart: boolean;
        isFuture: boolean;
        status: "DONE" | "MISSED" | "FROZEN" | null;
        streakCount: number;
      }>
    > = [];

    const monthLabelsArr: Array<{ name: string; colIndex: number }> = [];
    let currentMonth = -1;

    let curr = new Date(rangeStart);
    let currentWeek: (typeof weeksArr)[0] = [];

    while (curr <= today) {
      const dateStr = curr.toISOString().split("T")[0];
      const isBeforeStart = curr < start;
      const isFuture = curr > today;
      const logInfo = logMap.get(dateStr);

      const month = curr.getMonth();
      if (month !== currentMonth) {
        currentMonth = month;
        monthLabelsArr.push({
          name: curr.toLocaleDateString("en-US", { month: "short" }),
          colIndex: weeksArr.length,
        });
      }

      currentWeek.push({
        date: new Date(curr),
        dateStr,
        isBeforeStart,
        isFuture,
        status: logInfo?.status || null,
        streakCount: logInfo?.streakCount || 0,
      });

      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeksArr.push(currentWeek);
    }

    return { weeks: weeksArr, monthLabels: monthLabelsArr };
  }, [logs, startDate]);

  // Color helper based on status and streak intensity
  const getCellColor = (
    status: "DONE" | "MISSED" | "FROZEN" | null,
    streakCount: number,
    isBeforeStart: boolean,
    isFuture: boolean
  ) => {
    if (isBeforeStart || isFuture) {
      return "bg-[#232336]/20 border border-transparent";
    }

    if (status === "DONE") {
      // Shorter streaks (1-5 days): Lighter Gold (#FFD23F)
      // Medium streaks (6-14 days): Orange-Gold (#FF9F1C)
      // Longer streaks (15+ days): Deep Coral (#FF6B6B)
      if (streakCount >= 15) {
        return "bg-[#FF6B6B] shadow-sm shadow-[#FF6B6B]/40";
      } else if (streakCount >= 6) {
        return "bg-[#FF9F1C] shadow-sm shadow-[#FF9F1C]/40";
      } else {
        return "bg-[#FFD23F] shadow-sm shadow-[#FFD23F]/40";
      }
    }

    if (status === "FROZEN") {
      return "bg-[#5EEAD4] shadow-sm shadow-[#5EEAD4]/40";
    }

    if (status === "MISSED") {
      return "bg-[#3F3F52]";
    }

    // Untracked active date
    return "bg-[#232336]/50 border border-surfaceBorder/40";
  };

  const handleMouseEnter = (
    e: React.MouseEvent,
    day: { date: Date; dateStr: string; status: "DONE" | "MISSED" | "FROZEN" | null; isBeforeStart: boolean; isFuture: boolean }
  ) => {
    if (day.isFuture) return;

    const formattedDate = day.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    let statusText = "No activity logged";
    if (day.isBeforeStart) statusText = "Before habit creation";
    else if (day.status === "DONE") statusText = "Completed";
    else if (day.status === "FROZEN") statusText = "Streak Frozen 🧊";
    else if (day.status === "MISSED") statusText = "Missed";

    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay({
      dateStr: day.dateStr,
      formattedDate,
      statusText,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
  };

  return (
    <div className="relative p-6 rounded-2xl bg-surface border border-surfaceBorder">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-textPrimary text-sm tracking-tight">
          Consistency Heatmap
        </h3>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-textSecondary">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#FFD23F]" />
            <span>Short Streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#FF6B6B]" />
            <span>Long Streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#5EEAD4]" />
            <span>Frozen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#3F3F52]" />
            <span>Missed</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-surfaceBorder">
        <div className="inline-block min-w-max">
          {/* Month Labels Header */}
          <div className="flex text-[10px] font-mono text-textSecondary mb-2 h-4 relative">
            {monthLabels.map((m, idx) => (
              <span
                key={idx}
                className="absolute"
                style={{ left: `${m.colIndex * 15}px` }}
              >
                {m.name}
              </span>
            ))}
          </div>

          {/* Heatmap Grid (7 rows for Sun-Sat) */}
          <div className="flex gap-[3px]">
            {/* Day of Week Side Labels */}
            <div className="grid grid-rows-7 gap-[3px] pr-2 text-[9px] font-mono text-textSecondary select-none">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Weeks Columns */}
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-rows-7 gap-[3px]">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    onMouseEnter={(e) => handleMouseEnter(e, day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-3 h-3 rounded-[3px] transition-transform hover:scale-125 cursor-pointer ${getCellColor(
                      day.status,
                      day.streakCount,
                      day.isBeforeStart,
                      day.isFuture
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Tooltip */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-surfaceBorder shadow-xl text-xs whitespace-nowrap"
          style={{ left: `${hoveredDay.x}px`, top: `${hoveredDay.y}px` }}
        >
          <div className="font-semibold text-[#F4F4F8]">{hoveredDay.formattedDate}</div>
          <div className="text-[11px] text-textSecondary">{hoveredDay.statusText}</div>
        </div>
      )}
    </div>
  );
}
