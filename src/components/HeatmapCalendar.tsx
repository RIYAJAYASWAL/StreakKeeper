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
  combinedHabitCounts?: Record<string, { completed: number; total: number }>;
}

function toDateKey(value: string | Date): string {
  if (typeof value === "string") return value.split("T")[0];
  return value.toISOString().split("T")[0];
}

function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HeatmapCalendar({ logs, startDate, combinedHabitCounts }: HeatmapCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const { weeks, monthLabels, currentStreak, longestStreak, completionRate } = useMemo(() => {
    // Build a map of logs by YYYY-MM-DD
    const logMap = new Map<string, { status: "DONE" | "MISSED" | "FROZEN"; streakCount: number }>();
    // Sort logs chronologically to compute running streaks
    const sortedLogs = [...logs]
      .map((log) => ({ ...log, dateKey: toDateKey(log.date) }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    let runningStreak = 0;
    let longestStreak = 0;
    sortedLogs.forEach((log) => {
      if (log.status === "DONE" || log.status === "FROZEN") {
        runningStreak += 1;
      } else {
        runningStreak = 0;
      }
      longestStreak = Math.max(longestStreak, runningStreak);
      logMap.set(log.dateKey, { status: log.status, streakCount: runningStreak });
    });

    const startDateKey = toDateKey(startDate);
    const start = fromDateKey(startDateKey);
    const today = fromDateKey(formatDateKey(new Date()));
    const todayKey = formatDateKey(today);

    // Set timeline range: at least 16 weeks (~4 months) or up to 52 weeks (~1 year)
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 364);

    // Adjust rangeStart to the preceding Sunday so columns align cleanly by week
    const dayOfWeek = rangeStart.getDay();
    rangeStart.setDate(rangeStart.getDate() - dayOfWeek);
    const rangeEnd = new Date(today);
    rangeEnd.setDate(rangeEnd.getDate() + (6 - rangeEnd.getDay()));

    const weeksArr: Array<
      Array<{
        date: Date;
        dateStr: string;
        isBeforeStart: boolean;
        isFuture: boolean;
        isToday: boolean;
        status: "DONE" | "MISSED" | "FROZEN" | null;
        streakCount: number;
      }>
    > = [];

    const monthLabelsArr: Array<{ name: string; colIndex: number }> = [];
    let currentMonth = -1;

    let curr = new Date(rangeStart);
    let currentWeek: (typeof weeksArr)[0] = [];

    while (curr <= rangeEnd) {
      const dateStr = formatDateKey(curr);
      const isBeforeStart = dateStr < startDateKey;
      const isFuture = dateStr > todayKey;
      const isToday = dateStr === todayKey;
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
        isToday,
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

    const last30Start = new Date(today);
    last30Start.setDate(last30Start.getDate() - 29);
    const last30StartKey = formatDateKey(last30Start);
    const trackedLast30Days = sortedLogs.filter(
      (log) => log.dateKey >= last30StartKey && log.dateKey <= todayKey
    );
    const completedLast30Days = trackedLast30Days.filter(
      (log) => log.status === "DONE" || log.status === "FROZEN"
    ).length;
    const completionRate = trackedLast30Days.length
      ? Math.round((completedLast30Days / trackedLast30Days.length) * 100)
      : 0;

    return {
      weeks: weeksArr,
      monthLabels: monthLabelsArr,
      currentStreak: runningStreak,
      longestStreak,
      completionRate,
    };
  }, [logs, startDate]);

  // Color helper based on status and streak intensity
  const getCellColor = (
    status: "DONE" | "MISSED" | "FROZEN" | null,
    streakCount: number,
    isBeforeStart: boolean,
    isFuture: boolean
  ) => {
    if (isBeforeStart) {
      return "bg-[#232336]/20 border border-transparent";
    }

    if (isFuture) {
      return "bg-[#232336]/10 border border-transparent";
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
    day: { date: Date; dateStr: string; status: "DONE" | "MISSED" | "FROZEN" | null; isBeforeStart: boolean; isFuture: boolean },
    combinedCount?: { completed: number; total: number }
  ) => {
    if (day.isFuture) return;

    const formattedDate = day.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    let statusText = "Not logged";
    if (day.isBeforeStart) statusText = "Before habit creation";
    else if (day.status === "DONE") statusText = "Completed";
    else if (day.status === "FROZEN") statusText = "Frozen";
    else if (day.status === "MISSED") statusText = "Missed";
    if (combinedCount) statusText = `${combinedCount.completed} of ${combinedCount.total} habits`;

    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredDay({
      text: `${formattedDate}: ${statusText}`,
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

      <div className="grid grid-cols-3 divide-x divide-surfaceBorder border-y border-surfaceBorder py-3 mb-4 text-center">
        <div>
          <div className="text-[10px] uppercase text-textSecondary">Current Streak</div>
          <div className="mt-1 text-sm font-semibold text-textPrimary">{currentStreak} days</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-textSecondary">Longest Streak</div>
          <div className="mt-1 text-sm font-semibold text-textPrimary">{longestStreak} days</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-textSecondary">Last 30 Days</div>
          <div className="mt-1 text-sm font-semibold text-textPrimary">{completionRate}% complete</div>
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
                    onMouseEnter={(e) => handleMouseEnter(e, day, combinedHabitCounts?.[day.dateStr])}
                    onMouseLeave={() => setHoveredDay(null)}
                    aria-label={day.isFuture ? undefined : `${day.dateStr}: ${day.status || "Not logged"}`}
                    className={`w-3 h-3 rounded-[3px] transition-transform hover:scale-125 ${day.isFuture ? "cursor-default" : "cursor-pointer"} ${day.isToday ? "ring-1 ring-inset ring-white/70" : ""} ${getCellColor(
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
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-surfaceBorder shadow-xl text-xs whitespace-nowrap text-[#F4F4F8]"
          style={{ left: `${hoveredDay.x}px`, top: `${hoveredDay.y}px` }}
        >
          {hoveredDay.text}
        </div>
      )}
    </div>
  );
}
