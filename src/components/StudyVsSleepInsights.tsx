"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import {
  alignSeries,
  BucketAverage,
  compareBuckets,
  computeCorrelation,
  describeCorrelation,
  NumericLog,
} from "@/lib/correlationEngine";

export interface NumericHabitData {
  id: string;
  name: string;
  unit: string;
  logs: NumericLog[];
}

export default function StudyVsSleepInsights({
  habits,
}: {
  habits: NumericHabitData[];
}) {
  const defaultSleep = habits.find((habit) => /sleep/i.test(habit.name));
  const defaultStudy = habits.find(
    (habit) => /study/i.test(habit.name) && habit.id !== defaultSleep?.id
  );
  const [sleepId, setSleepId] = useState(
    defaultSleep?.id ?? habits[0]?.id ?? ""
  );
  const [studyId, setStudyId] = useState(
    defaultStudy?.id ?? habits.find((habit) => habit.id !== sleepId)?.id ?? ""
  );
  const sleepHabit = habits.find((habit) => habit.id === sleepId);
  const studyHabit = habits.find((habit) => habit.id === studyId);

  const points = useMemo(
    () =>
      sleepHabit && studyHabit
        ? alignSeries(sleepHabit.logs, studyHabit.logs)
        : [],
    [sleepHabit, studyHabit]
  );
  const correlation = useMemo(
    () =>
      sleepHabit && studyHabit
        ? computeCorrelation(sleepHabit.logs, studyHabit.logs)
        : { r: null, n: 0, points: [], reason: "Not enough data yet" as const },
    [sleepHabit, studyHabit]
  );
  const buckets = useMemo(
    () =>
      sleepHabit && studyHabit
        ? compareBuckets(sleepHabit.logs, studyHabit.logs)
        : [],
    [sleepHabit, studyHabit]
  );

  const trendSegment = useMemo(() => {
    if (correlation.r === null || points.length < 2) return undefined;
    const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const varianceX = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
    if (varianceX === 0) return undefined;
    const slope =
      points.reduce(
        (sum, point) => sum + (point.x - meanX) * (point.y - meanY),
        0
      ) / varianceX;
    const intercept = meanY - slope * meanX;
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    return [
      { x: minX, y: intercept + slope * minX },
      { x: maxX, y: intercept + slope * maxX },
    ] as const;
  }, [correlation.r, points]);

  const updateSleep = (id: string) => {
    setSleepId(id);
    if (id === studyId) {
      setStudyId(habits.find((habit) => habit.id !== id)?.id ?? "");
    }
  };

  const updateStudy = (id: string) => {
    setStudyId(id);
    if (id === sleepId) {
      setSleepId(habits.find((habit) => habit.id !== id)?.id ?? "");
    }
  };

  const renderBucketTooltip = ({
    active,
    payload,
  }: TooltipContentProps) => {
    if (!active || !payload?.length) return null;
    const bucket = payload[0].payload as BucketAverage;
    return (
      <div className="rounded-xl border border-[#232336] bg-[#15151E] p-3 text-xs shadow-xl">
        <p className="font-bold text-[#F4F4F8]">{bucket.label}</p>
        <p className="mt-1 text-[#9494A8]">
          {bucket.averageStudyHours === null
            ? "Need at least 3 shared days"
            : `Average study: ${bucket.averageStudyHours.toFixed(1)}h (${bucket.n} days)`}
        </p>
      </div>
    );
  };

  return (
    <section className="mt-12 rounded-2xl border border-[#232336] bg-[#15151E] p-6 shadow-lg">
      <div className="mb-5">
        <h2 className="text-xl font-bold tracking-tight text-[#F4F4F8]">
          Study vs Sleep
        </h2>
        <p className="mt-1 text-xs text-[#9494A8]">
          Sleep is logged on the date you wake up, and compared with study logged that same day.
          Correlation is not causation; small samples are unreliable.
        </p>
      </div>

      {habits.length < 2 ? (
        <p className="text-sm text-[#9494A8]">
          Create two numeric habits, such as Sleep (hours) and Study (hours), to explore this insight.
        </p>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-[#9494A8]">
              Sleep habit
              <select
                value={sleepId}
                onChange={(event) => updateSleep(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#232336] bg-[#0A0A0F] px-3 py-2.5 text-sm text-[#F4F4F8] focus:border-[#8B5CF6] focus:outline-none"
              >
                {habits.map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name} ({habit.unit})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#9494A8]">
              Study habit
              <select
                value={studyId}
                onChange={(event) => updateStudy(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#232336] bg-[#0A0A0F] px-3 py-2.5 text-sm text-[#F4F4F8] focus:border-[#8B5CF6] focus:outline-none"
              >
                {habits.map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name} ({habit.unit})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {sleepHabit && studyHabit && sleepHabit.id !== studyHabit.id && (
            <>
              {correlation.n < 14 ? (
                <div className="rounded-xl border border-[#232336] bg-[#0A0A0F]/60 p-5 text-center">
                  <p className="text-sm font-semibold text-[#F4F4F8]">
                    Log sleep and study for 14 days to unlock this insight
                  </p>
                  <p className="mt-2 font-mono text-sm text-[#9494A8]">
                    {Math.min(correlation.n, 14)}/14 overlapping days
                  </p>
                  <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-[#232336]">
                    <div
                      className="h-full rounded-full bg-[#8B5CF6]"
                      style={{ width: `${Math.min(100, (correlation.n / 14) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 12, right: 20, bottom: 25, left: 10 }}>
                        <CartesianGrid stroke="#232336" strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          dataKey="x"
                          name="Sleep"
                          unit="h"
                          stroke="#9494A8"
                          tick={{ fill: "#9494A8", fontSize: 11 }}
                          axisLine={{ stroke: "#383852" }}
                          tickLine={false}
                          label={{
                            value: "Sleep (hours)",
                            position: "insideBottom",
                            offset: -15,
                            fill: "#9494A8",
                            fontSize: 11,
                          }}
                        />
                        <YAxis
                          type="number"
                          dataKey="y"
                          name="Study"
                          unit="h"
                          stroke="#9494A8"
                          tick={{ fill: "#9494A8", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          label={{
                            value: "Study (hours)",
                            angle: -90,
                            position: "insideLeft",
                            fill: "#9494A8",
                            fontSize: 11,
                          }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          contentStyle={{
                            backgroundColor: "#15151E",
                            border: "1px solid #232336",
                            borderRadius: 12,
                            color: "#F4F4F8",
                          }}
                          formatter={(value, name) => [
                            `${value}h`,
                            name === "Sleep" ? "Sleep" : "Study",
                          ]}
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.date ?? ""
                          }
                        />
                        {trendSegment && (
                          <ReferenceLine
                            segment={trendSegment}
                            stroke="#8B5CF6"
                            strokeWidth={2}
                          />
                        )}
                        <Scatter data={correlation.points} fill="#FF6B6B" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="mt-4 text-sm text-[#F4F4F8]">
                    {describeCorrelation(correlation, buckets)}
                  </p>
                  <p className="mt-1 text-xs text-[#9494A8]">
                    Based on {correlation.n} days
                    {correlation.r !== null ? ` · r = ${correlation.r.toFixed(2)}` : ""}
                  </p>

                  <div className="mt-6 border-t border-[#232336] pt-5">
                    <h3 className="mb-3 text-sm font-semibold text-[#F4F4F8]">
                      Average study by sleep duration
                    </h3>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 8, left: -18 }}>
                          <defs>
                            <linearGradient id="sleepStudyBars" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#FF6B6B" />
                              <stop offset="100%" stopColor="#FFD23F" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#232336" strokeDasharray="3 3" vertical={false} />
                          <XAxis
                            dataKey="label"
                            stroke="#9494A8"
                            tick={{ fill: "#9494A8", fontSize: 10 }}
                            axisLine={{ stroke: "#383852" }}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#9494A8"
                            tick={{ fill: "#9494A8", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            unit="h"
                          />
                          <Tooltip content={renderBucketTooltip} />
                          <Bar
                            dataKey="averageStudyHours"
                            fill="url(#sleepStudyBars)"
                            radius={[5, 5, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
