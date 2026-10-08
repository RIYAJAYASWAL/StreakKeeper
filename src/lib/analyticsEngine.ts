/**
 * Analytics Engine Utility Module
 * 
 * Pure, testable business logic for computing habit analytics, completion rates,
 * weekly trends, streak stability, and consistency scores.
 */

import {
  calculateCurrentStreak,
  calculateLongestStreak,
  shouldExpectLogOnDate,
  Frequency,
  LogStatus,
} from "./streakEngine";
import { detectRelapsePatterns, RelapsePattern } from "./relapseDetector";
export type { RelapsePattern };

export interface LogItem {
  date: Date | string;
  status: LogStatus;
  loggedAt?: Date | string;
}

export interface HabitDataForAnalytics {
  id: string;
  name: string;
  frequency: Frequency;
  targetDays?: string[];
  createdAt: Date | string;
  habitLogs: LogItem[];
  timezone?: string;
}

export interface WeeklyTrendPoint {
  weekLabel: string;
  startDateStr: string;
  endDateStr: string;
  completionRate: number; // 0 - 100 %
  completedCount: number;
  expectedCount: number;
}

export interface HabitAnalyticsResult {
  habitId: string;
  habitName: string;
  frequency: Frequency;
  totalExpectedDays: number;
  totalCompletedDays: number; // DONE
  totalFrozenDays: number; // FROZEN
  totalMissedDays: number; // MISSED
  completionRate: number; // 0 - 100 percentage
  currentStreak: number;
  longestStreak: number;
  streakStability: number; // 0 - 100 score
  consistencyScore: number; // 0 - 100 score
  weeklyTrend: WeeklyTrendPoint[];
  relapsePatterns: RelapsePattern[];
}

export interface AggregateAnalyticsResult {
  totalHabits: number;
  overallCompletionRate: number; // 0 - 100
  overallConsistencyScore: number; // 0 - 100
  totalCurrentStreaks: number;
  maxCurrentStreak: number;
  maxLongestStreak: number;
  overallWeeklyTrend: WeeklyTrendPoint[];
}

/**
 * Utility to convert Date or string to YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(d: Date | string): string {
  if (typeof d === "string") {
    return d.split("T")[0];
  }
  return d.toISOString().split("T")[0];
}

/**
 * Calculates weekly trend data for a 4-week window ending on refDate.
 */
export function calculateWeeklyTrend(
  logs: LogItem[],
  frequency: Frequency,
  targetDays: string[] = [],
  refDate: Date = new Date()
): WeeklyTrendPoint[] {
  const logMap = new Map<string, LogStatus>();
  logs.forEach((log) => {
    logMap.set(formatDateToYYYYMMDD(log.date), log.status);
  });

  const weeks: WeeklyTrendPoint[] = [];
  const weekLabels = ["4 wks ago", "3 wks ago", "2 wks ago", "This week"];

  // Normalize refDate to UTC midnight
  const refMidnight = new Date(
    Date.UTC(refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate())
  );

  for (let w = 3; w >= 0; w--) {
    const endDaysAgo = w * 7;
    const startDaysAgo = endDaysAgo + 6;

    const startDate = new Date(refMidnight);
    startDate.setUTCDate(startDate.getUTCDate() - startDaysAgo);

    const endDate = new Date(refMidnight);
    endDate.setUTCDate(endDate.getUTCDate() - endDaysAgo);

    let expectedCount = 0;
    let completedCount = 0;

    const curr = new Date(startDate);
    while (curr <= endDate) {
      const dateStr = curr.toISOString().split("T")[0];
      const isExpected = shouldExpectLogOnDate(dateStr, frequency, targetDays);

      if (isExpected) {
        expectedCount++;
        const status = logMap.get(dateStr);
        if (status === "DONE" || status === "FROZEN") {
          completedCount++;
        }
      }

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    const completionRate =
      expectedCount > 0 ? Math.round((completedCount / expectedCount) * 100) : 0;

    weeks.push({
      weekLabel: weekLabels[3 - w],
      startDateStr: startDate.toISOString().split("T")[0],
      endDateStr: endDate.toISOString().split("T")[0],
      completionRate,
      completedCount,
      expectedCount,
    });
  }

  return weeks;
}

/**
 * Calculates analytics for an individual habit.
 */
export function calculateHabitAnalytics(
  habit: HabitDataForAnalytics,
  refDate: Date = new Date()
): HabitAnalyticsResult {
  const logs = habit.habitLogs || [];
  const targetDays = habit.targetDays || [];
  const timezone = habit.timezone || "UTC";

  // Compute current & longest streak
  const currentStreak = calculateCurrentStreak(logs, habit.frequency, targetDays, timezone);
  const longestStreak = calculateLongestStreak(logs, habit.frequency, targetDays);

  // Map logs by YYYY-MM-DD
  const logMap = new Map<string, LogStatus>();
  logs.forEach((log) => {
    logMap.set(formatDateToYYYYMMDD(log.date), log.status);
  });

  // Calculate overall expected days and counts
  const createdDateStr = formatDateToYYYYMMDD(habit.createdAt);
  const refDateStr = formatDateToYYYYMMDD(refDate);

  // Ensure start date is at least 30 days prior if created date is very recent,
  // or start from createdAt date.
  const habitStart = new Date(createdDateStr + "T00:00:00Z");
  const refMidnight = new Date(refDateStr + "T00:00:00Z");

  // Determine calculation start date
  let curr = new Date(habitStart);
  if (isNaN(curr.getTime()) || curr > refMidnight) {
    curr = new Date(refMidnight);
    curr.setUTCDate(curr.getUTCDate() - 30);
  }

  let totalExpectedDays = 0;
  let totalCompletedDays = 0;
  let totalFrozenDays = 0;
  let totalMissedDays = 0;

  while (curr <= refMidnight) {
    const dateStr = curr.toISOString().split("T")[0];
    const isExpected = shouldExpectLogOnDate(dateStr, habit.frequency, targetDays);

    if (isExpected) {
      totalExpectedDays++;
      const status = logMap.get(dateStr);
      if (status === "DONE") {
        totalCompletedDays++;
      } else if (status === "FROZEN") {
        totalFrozenDays++;
      } else if (status === "MISSED") {
        totalMissedDays++;
      }
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  const effectiveCompleted = totalCompletedDays + totalFrozenDays;
  const completionRate =
    totalExpectedDays > 0 ? Math.round((effectiveCompleted / totalExpectedDays) * 100) : 0;

  // Streak Stability: ratio of current streak to longest streak
  const streakStability =
    longestStreak > 0 ? Math.min(100, Math.round((currentStreak / longestStreak) * 100)) : 0;

  // Consistency Score (0 - 100): 60% completion rate + 40% streak stability
  const consistencyScore =
    totalExpectedDays > 0
      ? Math.min(100, Math.max(0, Math.round(completionRate * 0.6 + streakStability * 0.4)))
      : 0;

  // Weekly Trend (4 weeks)
  const weeklyTrend = calculateWeeklyTrend(logs, habit.frequency, targetDays, refDate);

  // Relapse Pattern Analysis
  const relapsePatterns = detectRelapsePatterns(logs);

  return {
    habitId: habit.id,
    habitName: habit.name,
    frequency: habit.frequency,
    totalExpectedDays,
    totalCompletedDays,
    totalFrozenDays,
    totalMissedDays,
    completionRate,
    currentStreak,
    longestStreak,
    streakStability,
    consistencyScore,
    weeklyTrend,
    relapsePatterns,
  };
}

/**
 * Calculates aggregate analytics across all user habits.
 */
export function calculateAggregateAnalytics(
  habitsAnalytics: HabitAnalyticsResult[]
): AggregateAnalyticsResult {
  if (!habitsAnalytics || habitsAnalytics.length === 0) {
    const emptyWeekly = ["4 wks ago", "3 wks ago", "2 wks ago", "This week"].map((label) => ({
      weekLabel: label,
      startDateStr: "",
      endDateStr: "",
      completionRate: 0,
      completedCount: 0,
      expectedCount: 0,
    }));

    return {
      totalHabits: 0,
      overallCompletionRate: 0,
      overallConsistencyScore: 0,
      totalCurrentStreaks: 0,
      maxCurrentStreak: 0,
      maxLongestStreak: 0,
      overallWeeklyTrend: emptyWeekly,
    };
  }

  const totalHabits = habitsAnalytics.length;
  let sumExpectedDays = 0;
  let sumCompletedDays = 0;
  let sumConsistencyScore = 0;
  let totalCurrentStreaks = 0;
  let maxCurrentStreak = 0;
  let maxLongestStreak = 0;

  // Aggregate weekly trend slots
  const weeklyTotals = [0, 1, 2, 3].map(() => ({
    completed: 0,
    expected: 0,
  }));

  habitsAnalytics.forEach((h) => {
    sumExpectedDays += h.totalExpectedDays;
    sumCompletedDays += h.totalCompletedDays + h.totalFrozenDays;
    sumConsistencyScore += h.consistencyScore;
    totalCurrentStreaks += h.currentStreak;

    if (h.currentStreak > maxCurrentStreak) maxCurrentStreak = h.currentStreak;
    if (h.longestStreak > maxLongestStreak) maxLongestStreak = h.longestStreak;

    h.weeklyTrend.forEach((wt, idx) => {
      if (weeklyTotals[idx]) {
        weeklyTotals[idx].completed += wt.completedCount;
        weeklyTotals[idx].expected += wt.expectedCount;
      }
    });
  });

  const overallCompletionRate =
    sumExpectedDays > 0 ? Math.round((sumCompletedDays / sumExpectedDays) * 100) : 0;

  const overallConsistencyScore = Math.round(sumConsistencyScore / totalHabits);

  const weekLabels = ["4 wks ago", "3 wks ago", "2 wks ago", "This week"];
  const overallWeeklyTrend: WeeklyTrendPoint[] = weeklyTotals.map((wt, idx) => {
    const rate = wt.expected > 0 ? Math.round((wt.completed / wt.expected) * 100) : 0;
    return {
      weekLabel: weekLabels[idx],
      startDateStr: habitsAnalytics[0]?.weeklyTrend[idx]?.startDateStr || "",
      endDateStr: habitsAnalytics[0]?.weeklyTrend[idx]?.endDateStr || "",
      completionRate: rate,
      completedCount: wt.completed,
      expectedCount: wt.expected,
    };
  });

  return {
    totalHabits,
    overallCompletionRate,
    overallConsistencyScore,
    totalCurrentStreaks,
    maxCurrentStreak,
    maxLongestStreak,
    overallWeeklyTrend,
  };
}

/**
 * Personalization Logic: Suggests a reminder time based on past DONE log timestamps.
 * 
 * Looks at loggedAt timestamps of a habit's past DONE entries and returns the median
 * check-off time in "HH:MM" 24hr format. Returns null if fewer than 10 completed logs exist.
 */
export function suggestReminderTime(
  logs: Array<{ date: Date | string; status: LogStatus; loggedAt?: Date | string }>
): string | null {
  if (!logs || logs.length === 0) return null;

  const doneLogs = logs.filter((log) => log.status === "DONE" && log.loggedAt);

  if (doneLogs.length < 10) {
    return null;
  }

  const timesInMinutes: number[] = [];

  doneLogs.forEach((log) => {
    const d = new Date(log.loggedAt!);
    if (!isNaN(d.getTime())) {
      const minutes = d.getUTCHours() * 60 + d.getUTCMinutes();
      timesInMinutes.push(minutes);
    }
  });

  if (timesInMinutes.length < 10) {
    return null;
  }

  timesInMinutes.sort((a, b) => a - b);

  const len = timesInMinutes.length;
  const medianMinutes =
    len % 2 === 1
      ? timesInMinutes[Math.floor(len / 2)]
      : Math.round((timesInMinutes[len / 2 - 1] + timesInMinutes[len / 2]) / 2);

  const hours = Math.floor(medianMinutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (medianMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${mins}`;
}

export type GoalType = "NONE" | "BUILD_STREAK" | "HIT_TARGET_RATE";

export interface HabitGoalInfo {
  goalType?: GoalType | string | null;
  goalTarget?: number | null;
}

/**
 * Generates personalized recommendation based on user habit goals and logged data.
 */
export function generateRecommendation(
  habit: any,
  logs: Array<{ date: Date | string; status: string; loggedAt?: Date | string }>,
  goal?: HabitGoalInfo | null
): string {
  const goalType = goal?.goalType || habit?.goalType || "NONE";
  const goalTarget = goal?.goalTarget ?? habit?.goalTarget ?? null;

  if (!logs || logs.length === 0 || goalType === "NONE") {
    return "Keep logging to unlock insights";
  }

  // BUILD_STREAK Goal Type
  if (goalType === "BUILD_STREAK") {
    const formattedLogs = logs.map((l) => ({
      ...l,
      status: l.status as LogStatus,
    }));

    const currentStreak = habit?.currentStreak ?? calculateCurrentStreak(formattedLogs, habit?.frequency || "DAILY", habit?.targetDays || []);
    const longestStreak = habit?.longestStreak ?? calculateLongestStreak(formattedLogs, habit?.frequency || "DAILY", habit?.targetDays || []);
    
    // Target is either user-defined goalTarget or historical longestStreak
    const targetStreak = (goalTarget && goalTarget > 0) ? goalTarget : longestStreak;

    if (targetStreak <= 0) {
      return "Keep logging to unlock insights";
    }

    const diff = targetStreak - currentStreak;

    if (diff > 0) {
      if (!goalTarget || goalTarget === longestStreak) {
        return `You're ${diff} day${diff === 1 ? "" : "s"} from beating your record of ${longestStreak}`;
      } else {
        return `You're ${diff} day${diff === 1 ? "" : "s"} from reaching your goal of ${targetStreak}`;
      }
    } else if (currentStreak >= targetStreak && currentStreak > 0) {
      return `Outstanding! You've reached your target streak of ${targetStreak} days with a current streak of ${currentStreak} days!`;
    }

    return "Keep logging to unlock insights";
  }

  // HIT_TARGET_RATE Goal Type
  if (goalType === "HIT_TARGET_RATE") {
    const targetRate = goalTarget ?? 80;
    
    const doneCount = logs.filter((l) => l.status === "DONE" || l.status === "FROZEN").length;
    const totalLogs = logs.length;
    
    if (totalLogs === 0) {
      return "Keep logging to unlock insights";
    }

    const currentRate = Math.round((doneCount / totalLogs) * 100);

    if (currentRate < targetRate) {
      // Analyze weekend vs weekday completion
      let weekendDone = 0;
      let weekendTotal = 0;
      let weekdayDone = 0;
      let weekdayTotal = 0;

      logs.forEach((log) => {
        const d = new Date(log.date);
        const dayOfWeek = d.getUTCDay(); // 0 is Sun, 6 is Sat
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (isWeekend) {
          weekendTotal++;
          if (log.status === "DONE" || log.status === "FROZEN") weekendDone++;
        } else {
          weekdayTotal++;
          if (log.status === "DONE" || log.status === "FROZEN") weekdayDone++;
        }
      });

      const weekendRate = weekendTotal > 0 ? (weekendDone / weekendTotal) * 100 : 100;
      const weekdayRate = weekdayTotal > 0 ? (weekdayDone / weekdayTotal) * 100 : 100;

      if (weekendTotal > 0 && weekendRate < weekdayRate) {
        return "Your completion rate drops on weekends — try a lighter weekend version of this habit";
      }

      return `Your current completion rate is ${currentRate}%, below your target of ${targetRate}%. Focus on consistency to bridge the gap.`;
    } else {
      return `Great job! Your completion rate of ${currentRate}% meets your target of ${targetRate}%.`;
    }
  }

  return "Keep logging to unlock insights";
}

export interface PerformanceWindowResult {
  bestDay: string | null;
  bestTimeRange: string | null;
  summary: string;
}

/**
 * Analyzes habit logs to determine the best day of week and time range window for habit execution.
 * Requires a sample size of at least 14 logged days before returning a confident answer.
 */
export function getBestPerformanceWindow(
  logs: Array<{ date: Date | string; status: string; loggedAt?: Date | string }>
): PerformanceWindowResult {
  if (!logs || logs.length < 14) {
    return {
      bestDay: null,
      bestTimeRange: null,
      summary: "Not enough data yet",
    };
  }

  const doneLogs = logs.filter(
    (l) => (l.status === "DONE" || l.status === "FROZEN") && (l.loggedAt || l.date)
  );

  if (doneLogs.length < 5) {
    return {
      bestDay: null,
      bestTimeRange: null,
      summary: "Not enough data yet",
    };
  }

  const dayNames = [
    "Sundays",
    "Mondays",
    "Tuesdays",
    "Wednesdays",
    "Thursdays",
    "Fridays",
    "Saturdays",
  ];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  const windowCounts = {
    "the morning": 0,
    "the afternoon": 0,
    "the evening": 0,
    "the night": 0,
  };

  doneLogs.forEach((log) => {
    const timestamp = log.loggedAt || log.date;
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      const dayIdx = d.getUTCDay();
      dayCounts[dayIdx]++;

      const hour = d.getHours();
      if (hour >= 5 && hour < 12) {
        windowCounts["the morning"]++;
      } else if (hour >= 12 && hour < 17) {
        windowCounts["the afternoon"]++;
      } else if (hour >= 17 && hour < 22) {
        windowCounts["the evening"]++;
      } else {
        windowCounts["the night"]++;
      }
    }
  });

  let maxDayIdx = 0;
  let maxDayCount = -1;
  dayCounts.forEach((count, idx) => {
    if (count > maxDayCount) {
      maxDayCount = count;
      maxDayIdx = idx;
    }
  });
  const bestDay = dayNames[maxDayIdx];

  let bestWindow = "the evening";
  let maxWindowCount = -1;
  (Object.keys(windowCounts) as Array<keyof typeof windowCounts>).forEach((winKey) => {
    if (windowCounts[winKey] > maxWindowCount) {
      maxWindowCount = windowCounts[winKey];
      bestWindow = winKey;
    }
  });

  const summary = `You're most consistent on ${bestDay}, usually checking in during ${bestWindow}`;

  return {
    bestDay,
    bestTimeRange: bestWindow,
    summary,
  };
}



