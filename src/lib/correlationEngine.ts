export interface NumericLog {
  date: Date | string;
  value: number | null | undefined;
}

export interface AlignedPoint {
  date: string;
  x: number;
  y: number;
}

export interface CorrelationResult {
  r: number | null;
  n: number;
  points: AlignedPoint[];
  reason?: "Not enough data yet";
}

export interface BucketAverage {
  bucket: "under6" | "6to8" | "over8";
  label: string;
  averageStudyHours: number | null;
  n: number;
}

function dateKey(date: Date | string): string {
  return typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

function numericValues(logs: NumericLog[]): Map<string, number> {
  const values = new Map<string, number>();
  for (const log of logs) {
    if (typeof log.value === "number" && Number.isFinite(log.value)) {
      values.set(dateKey(log.date), log.value);
    }
  }
  return values;
}

export function alignSeries(
  logsA: NumericLog[],
  logsB: NumericLog[],
  lagDays = 0
): AlignedPoint[] {
  const valuesB = numericValues(logsB);
  const points: AlignedPoint[] = [];

  for (const log of logsA) {
    if (typeof log.value !== "number" || !Number.isFinite(log.value)) continue;
    const date = dateKey(log.date);
    const y = valuesB.get(shiftDate(date, lagDays));
    if (y !== undefined) points.push({ date, x: log.value, y });
  }

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export function pearson(xs: number[], ys: number[]): number | null {
  if (
    xs.length !== ys.length ||
    xs.length < 2 ||
    xs.some((value) => !Number.isFinite(value)) ||
    ys.some((value) => !Number.isFinite(value))
  ) {
    return null;
  }
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    covariance += dx * dy;
    varianceX += dx ** 2;
    varianceY += dy ** 2;
  }

  if (varianceX === 0 || varianceY === 0) return null;
  return covariance / Math.sqrt(varianceX * varianceY);
}

export function computeCorrelation(
  logsA: NumericLog[],
  logsB: NumericLog[],
  lagDays = 0
): CorrelationResult {
  // Correlation is not causation, and small samples are unreliable.
  const points = alignSeries(logsA, logsB, lagDays);
  const n = points.length;
  if (n < 14) return { r: null, n, points, reason: "Not enough data yet" };
  return {
    r: pearson(
      points.map((point) => point.x),
      points.map((point) => point.y)
    ),
    n,
    points,
  };
}

export function compareBuckets(
  sleepLogs: NumericLog[],
  studyLogs: NumericLog[]
): BucketAverage[] {
  const studyByDate = numericValues(studyLogs);
  const bucketValues: Record<BucketAverage["bucket"], number[]> = {
    under6: [],
    "6to8": [],
    over8: [],
  };

  for (const log of sleepLogs) {
    if (typeof log.value !== "number" || !Number.isFinite(log.value)) continue;
    const studyHours = studyByDate.get(dateKey(log.date));
    if (studyHours === undefined) continue;

    if (log.value < 6) bucketValues.under6.push(studyHours);
    else if (log.value <= 8) bucketValues["6to8"].push(studyHours);
    else bucketValues.over8.push(studyHours);
  }

  const buckets: Array<Pick<BucketAverage, "bucket" | "label">> = [
    { bucket: "under6", label: "Under 6h sleep" },
    { bucket: "6to8", label: "6–8h sleep" },
    { bucket: "over8", label: "Over 8h sleep" },
  ];

  return buckets.map(({ bucket, label }) => {
    const values = bucketValues[bucket];
    return {
      bucket,
      label,
      n: values.length,
      averageStudyHours:
        values.length >= 3
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : null,
    };
  });
}

export function describeCorrelation(
  result: CorrelationResult,
  buckets: BucketAverage[]
): string {
  if (result.n < 14 || result.reason === "Not enough data yet") {
    return "Not enough data yet to compare sleep and study; small samples can be unreliable.";
  }
  if (result.r === null || Math.abs(result.r) < 0.2) {
    return "There is no clear relationship; sleep and study hours do not show a consistent tendency to coincide in this sample.";
  }

  const lowSleep = buckets.find((bucket) => bucket.bucket === "under6");
  const highSleep = buckets.find((bucket) => bucket.bucket === "over8");
  if (
    lowSleep?.averageStudyHours !== null &&
    lowSleep?.averageStudyHours !== undefined &&
    highSleep?.averageStudyHours !== null &&
    highSleep?.averageStudyHours !== undefined
  ) {
    const difference =
      highSleep.averageStudyHours - lowSleep.averageStudyHours;
    if (Math.abs(difference) >= 0.1) {
      const comparison = difference > 0 ? "more" : "less";
      return `Over 8 hours of sleep tends to coincide with about ${Math.abs(difference).toFixed(1)} ${comparison} study hours than under 6 hours of sleep, on average.`;
    }
  }

  const direction = result.r > 0 ? "higher" : "lower";
  return `Higher sleep hours tend to coincide with ${direction} study hours across ${result.n} shared days.`;
}
