/**
 * Relapse Detector Utility Module
 * 
 * Pure business logic for detecting recurring relapse and streak breakage patterns 
 * across habit log history. Completely decoupled from React and database layers.
 */

export type LogStatus = "DONE" | "MISSED" | "FROZEN";

export interface HabitLog {
  date: Date | string;
  status: LogStatus;
}

export type PatternType = "day_of_week" | "streak_length";
export type ConfidenceLevel = "low" | "medium" | "high";

export interface RelapsePattern {
  type: PatternType;
  description: string;
  confidence: ConfidenceLevel;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_PLURALS = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

/**
 * Calculates statistical confidence based on sample size and pattern frequency.
 * 
 * NOTE ON CONFIDENCE SCALING:
 * Confidence must scale with sample size to prevent premature conclusions.
 * - 'low': Sample size under 14 total logged days OR under 3 pattern occurrences.
 * - 'medium': Sample size between 14-29 total logged days OR 3-4 pattern occurrences.
 * - 'high': Sample size 30+ total logged days AND at least 5 pattern occurrences.
 */
function calculateConfidence(
  totalLogsCount: number,
  patternOccurrences: number
): ConfidenceLevel {
  if (totalLogsCount < 14 || patternOccurrences < 3) {
    return "low";
  }
  if (totalLogsCount < 30 || patternOccurrences < 5) {
    return "medium";
  }
  return "high";
}

/**
 * Parses any valid Date object or date string into a UTC Date object
 */
function parseUTCDate(d: Date | string): Date {
  if (d instanceof Date) return d;
  const str = typeof d === "string" ? d.split("T")[0] : String(d);
  const parts = str.split("-").map(Number);
  if (parts.length === 3) {
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }
  return new Date(d);
}

/**
 * Scans habit logs to identify statistically notable relapse patterns.
 * 
 * @param logs Array of habit log records
 * @returns Array of detected RelapsePattern objects
 */
export function detectRelapsePatterns(logs: HabitLog[]): RelapsePattern[] {
  if (!logs || logs.length === 0) return [];

  // Sort logs chronologically
  const sortedLogs = [...logs].sort((a, b) => {
    return parseUTCDate(a.date).getTime() - parseUTCDate(b.date).getTime();
  });

  const totalLogsCount = sortedLogs.length;
  const missedLogs = sortedLogs.filter((l) => l.status === "MISSED");
  const totalMissedCount = missedLogs.length;

  if (totalMissedCount === 0) {
    return [];
  }

  const patterns: RelapsePattern[] = [];

  // ==========================================
  // 1. DAY-OF-WEEK PATTERN ANALYSIS
  // ==========================================
  const dayTotalCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayMissCounts = [0, 0, 0, 0, 0, 0, 0];

  sortedLogs.forEach((log) => {
    const dayOfWeek = parseUTCDate(log.date).getUTCDay();
    dayTotalCounts[dayOfWeek]++;
    if (log.status === "MISSED") {
      dayMissCounts[dayOfWeek]++;
    }
  });

  const overallMissRate = totalMissedCount / totalLogsCount;

  // Check Weekend Clustering (Saturdays & Sundays)
  const weekendMisses = dayMissCounts[0] + dayMissCounts[6];
  const weekendTotals = dayTotalCounts[0] + dayTotalCounts[6];
  const weekendMissRate = weekendTotals > 0 ? weekendMisses / weekendTotals : 0;

  let weekendPatternDetected = false;
  if (
    weekendMisses >= 2 &&
    (weekendMisses / totalMissedCount >= 0.45 || weekendMissRate >= 1.5 * overallMissRate)
  ) {
    weekendPatternDetected = true;
    patterns.push({
      type: "day_of_week",
      description: "Missed days cluster around weekends (Saturdays & Sundays)",
      confidence: calculateConfidence(totalLogsCount, weekendMisses),
    });
  }

  // Check Specific Day-of-Week Outliers (1.5x average threshold)
  let maxMissDayIndex = -1;
  let maxMissRateRatio = 0;

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    // Skip Saturday (6) and Sunday (0) if weekend pattern already captured it
    if (weekendPatternDetected && (dayIdx === 0 || dayIdx === 6)) {
      continue;
    }

    const totalOnDay = dayTotalCounts[dayIdx];
    const missedOnDay = dayMissCounts[dayIdx];

    if (totalOnDay > 0 && missedOnDay >= 2) {
      const dayMissRate = missedOnDay / totalOnDay;
      const ratio = dayMissRate / Math.max(overallMissRate, 0.01);

      if (ratio >= 1.5 && ratio > maxMissRateRatio) {
        maxMissRateRatio = ratio;
        maxMissDayIndex = dayIdx;
      }
    }
  }

  if (maxMissDayIndex !== -1) {
    const dayNamePlural = DAY_PLURALS[maxMissDayIndex];
    const missCount = dayMissCounts[maxMissDayIndex];
    patterns.push({
      type: "day_of_week",
      description: `Misses most often on ${dayNamePlural}`,
      confidence: calculateConfidence(totalLogsCount, missCount),
    });
  }

  // ==========================================
  // 2. STREAK LENGTH AT TIME OF MISS ANALYSIS
  // ==========================================
  const streakBreaks: number[] = [];
  let currentStreakRun = 0;

  sortedLogs.forEach((log) => {
    if (log.status === "DONE" || log.status === "FROZEN") {
      currentStreakRun += 1;
    } else if (log.status === "MISSED") {
      streakBreaks.push(currentStreakRun);
      currentStreakRun = 0;
    }
  });

  if (streakBreaks.length > 0) {
    // Bucket streak breaks into ranges
    const rangeBuckets = [
      { label: "early in streaks (days 1-3)", min: 0, max: 3, count: 0 },
      { label: "after day 4-6", min: 4, max: 6, count: 0 },
      { label: "after day 7-9", min: 7, max: 9, count: 0 },
      { label: "after day 10-14", min: 10, max: 14, count: 0 },
      { label: "after 2+ weeks (day 15+)", min: 15, max: 9999, count: 0 },
    ];

    streakBreaks.forEach((streakLength) => {
      for (const bucket of rangeBuckets) {
        if (streakLength >= bucket.min && streakLength <= bucket.max) {
          bucket.count++;
          break;
        }
      }
    });

    // Find the most frequent streak break range
    let topBucket = rangeBuckets[0];
    for (const bucket of rangeBuckets) {
      if (bucket.count > topBucket.count) {
        topBucket = bucket;
      }
    }

    if (topBucket.count >= 2 && topBucket.count / streakBreaks.length >= 0.35) {
      const desc = topBucket.min === 0
        ? "Frequently relapses early in streaks (days 1-3)"
        : `Tends to break streaks ${topBucket.label}`;

      patterns.push({
        type: "streak_length",
        description: desc,
        confidence: calculateConfidence(totalLogsCount, topBucket.count),
      });
    }
  }

  return patterns;
}
