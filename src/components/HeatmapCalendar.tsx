"use client";

import { useMemo, useState } from "react";
import {
  calculateCurrentStreak,
  calculateLast30DayCompletionRate,
  calculateLongestStreak,
  Frequency,
  getTodayInTimezone,
  shouldExpectLogOnDate,
} from "@/lib/streakEngine";

export interface LogEntry {
  date: string; // YYYY-MM-DD
  status: "DONE" | "MISSED" | "FROZEN";
  streakCount?: number;
}

export interface HeatmapCalendarProps {
  logs: LogEntry[];
  startDate: string | Date;
  today?: string;
  frequency?: Frequency;
  targetDays?: string[];
  timezone?: string;
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

export default function HeatmapCalendar({
  logs,
  startDate,
  today = getTodayInTimezone(),
  frequency = "DAILY",
  targetDays = [],
  timezone = "UTC",
  combinedHabitCounts,
}: HeatmapCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    const sortedLogs = [...logs]
      .map((log) => ({ ...log, dateKey: toDateKey(log.date) }))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    const statuses = new Map(sortedLogs.map((log) => [log.dateKey, log.status]));
    const logMap = new Map<string, { status: "DONE" | "MISSED" | "FROZEN"; streakCount: number }>();
    if (sortedLogs.length > 0) {
      const cursor = new Date(`${sortedLogs[0].dateKey}T00:00:00.000Z`);
      const lastDate = new Date(`${sortedLogs[sortedLogs.length - 1].dateKey}T00:00:00.000Z`);
      let streakCount = 0;
      while (cursor <= lastDate) {
        const dateKey = cursor.toISOString().split("T")[0];
        if (shouldExpectLogOnDate(dateKey, frequency, targetDays)) {
          const status = statuses.get(dateKey);
          if (status === "DONE") streakCount += 1;
          else if (status !== "FROZEN") streakCount = 0;
          if (status) logMap.set(dateKey, { status, streakCount });
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    const startDateKey = toDateKey(startDate);
    const todayDate = fromDateKey(today);
    const todayKey = today;

    // Set timeline range: at least 16 weeks (~4 months) or up to 52 weeks (~1 year)
    const rangeStart = new Date(todayDate);
    rangeStart.setDate(rangeStart.getDate() - 364);

    // Adjust rangeStart to the preceding Sunday so columns align cleanly by week
    const dayOfWeek = rangeStart.getDay();
    rangeStart.setDate(rangeStart.getDate() - dayOfWeek);
    const rangeEnd = new Date(todayDate);
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
      const logInfo = logMap.get(dateStr);
      const isBeforeStart = dateStr < startDateKey && !logInfo;
      const isFuture = dateStr > todayKey;
      const isToday = dateStr === todayKey;

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

    return {
      weeks: weeksArr,
      monthLabels: monthLabelsArr,
    };
  }, [logs, startDate, today, frequency, targetDays]);

  const currentStreak = calculateCurrentStreak(logs, frequency, targetDays, timezone);
  const longestStreak = calculateLongestStreak(logs, frequency, targetDays);
  const completionRate = calculateLast30DayCompletionRate(logs, today);

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
