/**
 * StreakEngine Utility Module
 * 
 * Pure business logic for habit streak calculations, timezone resolution,
 * and custom schedule gap handling in StreakKeeper.
 */

export type LogStatus = "DONE" | "MISSED" | "FROZEN";
export type Frequency = "DAILY" | "WEEKLY" | "CUSTOM";

export interface HabitLog {
  date: Date | string;
  status: LogStatus;
}

const DAY_MAP: Record<number, string> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

/**
 * Returns today's date formatted as a 'YYYY-MM-DD' string in the specified IANA timezone.
 * Uses Intl.DateTimeFormat to avoid server-local timezone discrepancies.
 * 
 * @param timezone IANA timezone string (e.g. "America/New_York", "UTC", "Asia/Kolkata")
 * @returns YYYY-MM-DD string representation of today in the given timezone
 */
export function getTodayInTimezone(timezone: string = "UTC"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Determines whether a habit is expected to be logged on a specific date string.
 * 
 * Edge Case: For CUSTOM frequencies, non-target days return false and should be skipped
 * during streak gap checks.
 * 
 * @param dateStr Date formatted as YYYY-MM-DD
 * @param frequency Habit frequency ("DAILY", "WEEKLY", "CUSTOM")
 * @param targetDays Array of day identifiers (e.g., ["MON", "WED", "FRI"])
 */
export function shouldExpectLogOnDate(
  dateStr: string,
  frequency: Frequency,
  targetDays: string[] = []
): boolean {
  if (frequency === "DAILY" || frequency === "WEEKLY") {
    return true;
  }

  // Parse YYYY-MM-DD safely in UTC to get correct day of week index
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return false;
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const dayCode = DAY_MAP[date.getUTCDay()];

  return targetDays.includes(dayCode);
}

/**
 * Calculates the current active streak count for a habit.
 * 
 * Key Behavior Rules & Edge Cases:
 * 1. Timezone Boundaries: Today is calculated according to the user's IANA timezone.
 * 2. Unlogged Today: If today is expected but not logged yet, streak calculation starts
 *    from yesterday so an unexpired today doesn't prematurely reset the streak count.
 * 3. Freeze Preservation: A FROZEN day preserves the streak (prevents gap/reset) but
 *    does not increment the counter (+0 to streak count).
 * 4. Custom Days Skipping: For CUSTOM schedules, non-target days are skipped and do not
 *    break the streak run.
 * 
 * @param logs Array of HabitLog records
 * @param frequency Habit frequency ("DAILY", "WEEKLY", "CUSTOM")
 * @param targetDays Array of target day codes for CUSTOM frequency
 * @param timezone User's IANA timezone
 * @returns Current active streak number
 */
export function calculateCurrentStreak(
  logs: HabitLog[],
  frequency: Frequency = "DAILY",
  targetDays: string[] = [],
  timezone: string = "UTC"
): number {
  if (!logs || logs.length === 0) return 0;

  // Build date -> status map
  const logMap = new Map<string, LogStatus>();
  logs.forEach((log) => {
    const dStr = typeof log.date === "string" 
      ? log.date.split("T")[0] 
      : log.date.toISOString().split("T")[0];
    logMap.set(dStr, log.status);
  });

  const todayStr = getTodayInTimezone(timezone);
  let currDate = new Date(todayStr + "T00:00:00Z");

  let streak = 0;
  let isFirstDay = true;

  // Scan backward day by day
  for (let i = 0; i < 365; i++) {
    const dateStr = currDate.toISOString().split("T")[0];
    const isExpected = shouldExpectLogOnDate(dateStr, frequency, targetDays);

    if (isExpected) {
      const status = logMap.get(dateStr);

      if (isFirstDay && dateStr === todayStr && !status) {
        // If today is not logged yet, skip to yesterday without breaking streak
        isFirstDay = false;
        currDate.setUTCDate(currDate.getUTCDate() - 1);
        continue;
      }

      isFirstDay = false;

      if (status === "DONE") {
        streak += 1;
      } else if (status === "FROZEN") {
        // FROZEN: Streak preserved (gap avoided), count not incremented
      } else {
        // MISSED or unlogged past expected day -> streak ends
        break;
      }
    }

    currDate.setUTCDate(currDate.getUTCDate() - 1);
  }

  return streak;
}

/**
 * Calculates the longest streak run across a habit's entire log history.
 * 
 * @param logs Array of HabitLog records
 * @param frequency Habit frequency ("DAILY", "WEEKLY", "CUSTOM")
 * @param targetDays Target days for custom schedules
 * @returns Longest consecutive streak achieved
 */
export function calculateLongestStreak(
  logs: HabitLog[],
  frequency: Frequency = "DAILY",
  targetDays: string[] = []
): number {
  if (!logs || logs.length === 0) return 0;

  // Map logs by YYYY-MM-DD
  const logMap = new Map<string, LogStatus>();
  let minDateStr = "9999-99-99";
  let maxDateStr = "0000-00-00";

  logs.forEach((log) => {
    const dStr = typeof log.date === "string"
      ? log.date.split("T")[0]
      : log.date.toISOString().split("T")[0];
    logMap.set(dStr, log.status);

    if (dStr < minDateStr) minDateStr = dStr;
    if (dStr > maxDateStr) maxDateStr = dStr;
  });

  if (minDateStr === "9999-99-99") return 0;

  const start = new Date(minDateStr + "T00:00:00Z");
  const end = new Date(maxDateStr + "T00:00:00Z");

  let maxStreak = 0;
  let currentRun = 0;

  const curr = new Date(start);

  while (curr <= end) {
    const dateStr = curr.toISOString().split("T")[0];
    const isExpected = shouldExpectLogOnDate(dateStr, frequency, targetDays);

    if (isExpected) {
      const status = logMap.get(dateStr);

      if (status === "DONE") {
        currentRun += 1;
        if (currentRun > maxStreak) {
          maxStreak = currentRun;
        }
      } else if (status === "FROZEN") {
        // Streak preserved, count not incremented
      } else {
        currentRun = 0;
      }
    }

    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return maxStreak;
}

export function calculateLast30DayCompletionRate(
  logs: HabitLog[],
  today: string
): number {
  const logMap = new Map<string, LogStatus>();
  logs.forEach((log) => {
    const dateKey = typeof log.date === "string"
      ? log.date.split("T")[0]
      : log.date.toISOString().split("T")[0];
    logMap.set(dateKey, log.status);
  });

  const end = new Date(`${today}T00:00:00.000Z`);
  let completedDays = 0;
  for (let offset = 0; offset < 30; offset += 1) {
    const date = new Date(end);
    date.setUTCDate(date.getUTCDate() - offset);
    const status = logMap.get(date.toISOString().split("T")[0]);
    if (status === "DONE" || status === "FROZEN") completedDays += 1;
  }

  return Math.round((completedDays / 30) * 100);
}
