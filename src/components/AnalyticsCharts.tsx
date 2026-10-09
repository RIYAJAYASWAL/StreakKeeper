"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  HabitAnalyticsResult,
  AggregateAnalyticsResult,
  WeeklyTrendPoint,
} from "@/lib/analyticsEngine";
import RelapseInsights from "@/components/RelapseInsights";
import Link from "next/link";

/**
 * Custom Recharts Tooltip styled for Dark-First Ember Theme
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#15151E] border border-[#232336] p-3 rounded-xl shadow-2xl text-xs backdrop-blur-md">
        <p className="font-bold text-[#F4F4F8] mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FFD23F]" />
          <span className="text-[#9494A8]">Completion Rate:</span>
          <span className="font-extrabold text-[#F4F4F8]">{payload[0].value}%</span>
        </div>
        {data.expectedCount !== undefined && (
          <p className="text-[#9494A8] mt-1 pt-1 border-t border-[#232336]">
            Completed <strong className="text-[#F4F4F8]">{data.completedCount}</strong> of{" "}
            <strong className="text-[#F4F4F8]">{data.expectedCount}</strong> expected days
          </p>
        )}
      </div>
    );
  }
  return null;
};

/**
 * Recharts Bar Chart component with Ember Gradient fill
 */
export function WeeklyBarChart({
  data,
  height = 180,
  showYAxis = true,
}: {
  data: WeeklyTrendPoint[];
  height?: number;
  showYAxis?: boolean;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        style={{ height }}
        className="w-full bg-[#15151E]/50 rounded-xl border border-[#232336] animate-pulse flex items-center justify-center text-xs text-[#9494A8]"
      >
        Loading chart...
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: showYAxis ? -20 : -35, bottom: 0 }}>
          <defs>
            <linearGradient id="emberBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B6B" stopOpacity={1} />
              <stop offset="50%" stopColor="#FF9F1C" stopOpacity={1} />
              <stop offset="100%" stopColor="#FFD23F" stopOpacity={0.85} />
            </linearGradient>
            <linearGradient id="emberBarGradientHover" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF8585" stopOpacity={1} />
              <stop offset="50%" stopColor="#FFB347" stopOpacity={1} />
              <stop offset="100%" stopColor="#FFE066" stopOpacity={1} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="weekLabel"
            stroke="#9494A8"
            tick={{ fill: "#9494A8", fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: "#232336" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#9494A8"
            tick={{ fill: "#9494A8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            ticks={[0, 50, 100]}
            unit="%"
            hide={!showYAxis}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255, 255, 255, 0.03)" }} />
          <Bar
            dataKey="completionRate"
            fill="url(#emberBarGradient)"
            radius={[6, 6, 2, 2]}
            maxBarSize={44}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                className="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Top Overall Analytics Summary component
 */
export function OverallAnalyticsSummary({
  aggregate,
}: {
  aggregate: AggregateAnalyticsResult;
}) {
  return (
    <div className="space-y-6 mb-12">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Aggregate Completion Rate */}
        <div className="p-5 rounded-2xl bg-[#15151E] border border-[#232336] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#383852] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9494A8] uppercase tracking-wider">
              Overall Completion
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 flex items-center justify-center text-[#FF6B6B]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#F4F4F8] tracking-tight">
                {aggregate.overallCompletionRate}%
              </span>
              <span className="text-xs text-[#9494A8]">of expected days</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[#0A0A0F] border border-[#232336] mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF6B6B] via-[#FF9F1C] to-[#FFD23F] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, aggregate.overallCompletionRate))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Consistency Score */}
        <div className="p-5 rounded-2xl bg-[#15151E] border border-[#232336] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#383852] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9494A8] uppercase tracking-wider">
              Consistency Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] via-[#FF9F1C] to-[#FFD23F] tracking-tight">
                {aggregate.overallConsistencyScore}
              </span>
              <span className="text-xs text-[#9494A8]">/ 100 score</span>
            </div>

            <p className="text-xs text-[#9494A8] mt-2">
              {aggregate.overallConsistencyScore >= 80
                ? "🔥 Outstanding consistency!"
                : aggregate.overallConsistencyScore >= 50
                ? "⚡ Solid momentum building"
                : "🌱 Keep showing up daily"}
            </p>
          </div>
        </div>

        {/* Card 3: Active Streaks */}
        <div className="p-5 rounded-2xl bg-[#15151E] border border-[#232336] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#383852] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9494A8] uppercase tracking-wider">
              Current Streaks
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FF9F1C]/10 border border-[#FF9F1C]/20 flex items-center justify-center text-[#FF9F1C]">
              🔥
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#F4F4F8] tracking-tight">
                {aggregate.totalCurrentStreaks}
              </span>
              <span className="text-xs text-[#9494A8]">total active days</span>
            </div>

            <p className="text-xs text-[#9494A8] mt-2">
              Max single streak: <strong className="text-[#FF9F1C]">{aggregate.maxCurrentStreak} days</strong>
            </p>
          </div>
        </div>

        {/* Card 4: Longest Streak Milestone */}
        <div className="p-5 rounded-2xl bg-[#15151E] border border-[#232336] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-[#383852] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#9494A8] uppercase tracking-wider">
              Longest Record
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#5EEAD4]/10 border border-[#5EEAD4]/20 flex items-center justify-center text-[#5EEAD4]">
              🏆
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#F4F4F8] tracking-tight">
                {aggregate.maxLongestStreak}
              </span>
              <span className="text-xs text-[#9494A8]">days peak streak</span>
            </div>

            <p className="text-xs text-[#9494A8] mt-2">
              Across <strong className="text-[#F4F4F8]">{aggregate.totalHabits}</strong> active habit{aggregate.totalHabits !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Aggregate 4-Week Trend Chart Panel */}
      <div className="p-6 rounded-2xl bg-[#15151E] border border-[#232336] shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#F4F4F8] flex items-center gap-2">
              <span>Weekly Completion Trend</span>
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#8B5CF6]">
                Aggregate
              </span>
            </h2>
            <p className="text-xs text-[#9494A8] mt-1">
              Combined percentage of expected habits completed over the last 4 weeks.
            </p>
          </div>

          {/* Quick legend */}
          <div className="flex items-center gap-3 text-xs text-[#9494A8]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-r from-[#FF6B6B] via-[#FF9F1C] to-[#FFD23F]" />
              <span>Completion Rate</span>
            </div>
          </div>
        </div>

        <WeeklyBarChart data={aggregate.overallWeeklyTrend} height={200} showYAxis={true} />
      </div>
    </div>
  );
}

/**
 * Habit Analytics Card for per-habit breakdown
 */
export function HabitAnalyticsCard({
  analytics,
}: {
  analytics: HabitAnalyticsResult;
}) {
  return (
    <div className="p-6 rounded-2xl bg-[#15151E] border border-[#232336] hover:border-[#383852] transition-all duration-200 flex flex-col justify-between shadow-sm">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <Link
              href={`/habits/${analytics.habitSlug || analytics.habitId}`}
              className="font-bold text-[#F4F4F8] text-lg hover:text-[#FF9F1C] transition-colors line-clamp-1"
            >
              {analytics.habitName}
            </Link>

            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-md bg-[#0A0A0F] border border-[#232336] text-[#9494A8] text-xs font-mono font-medium">
                {analytics.frequency}
              </span>
              <span className="text-xs text-[#9494A8]">
                {analytics.totalExpectedDays} expected days
              </span>
            </div>
          </div>

          {/* Consistency Score Badge */}
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#0A0A0F] border border-[#232336]">
              <span className="text-xs text-[#9494A8] font-medium">Score</span>
              <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#FFD23F]">
                {analytics.consistencyScore}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-4">
          {/* Completion Rate */}
          <div className="p-3 rounded-xl bg-[#0A0A0F]/60 border border-[#232336]">
            <span className="text-[11px] font-medium text-[#9494A8] uppercase tracking-wider block mb-1">
              Completion Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-[#F4F4F8]">
                {analytics.completionRate}%
              </span>
            </div>
            {/* mini progress bar */}
            <div className="w-full h-1.5 rounded-full bg-[#15151E] border border-[#232336] mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FFD23F] rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, analytics.completionRate))}%` }}
              />
            </div>
          </div>

          {/* Streak Comparison */}
          <div className="p-3 rounded-xl bg-[#0A0A0F]/60 border border-[#232336]">
            <span className="text-[11px] font-medium text-[#9494A8] uppercase tracking-wider block mb-1">
              Current / Longest
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-[#FF9F1C] flex items-center gap-1">
                🔥 {analytics.currentStreak}
              </span>
              <span className="text-xs text-[#9494A8]">
                / <strong className="text-[#F4F4F8]">{analytics.longestStreak}</strong> days
              </span>
            </div>
            <div className="text-[10px] text-[#9494A8] mt-2">
              Stability: {analytics.streakStability}%
            </div>
          </div>
        </div>
      </div>

      {/* Mini Bar Chart for 4-Week Trend */}
      <div className="pt-4 border-t border-[#232336]/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#9494A8]">4-Week Completion Trend</span>
          <span className="text-[11px] text-[#9494A8]">
            This week: <strong className="text-[#F4F4F8]">{analytics.weeklyTrend[3]?.completionRate || 0}%</strong>
          </span>
        </div>
        <WeeklyBarChart data={analytics.weeklyTrend} height={110} showYAxis={false} />
      </div>

      {/* Relapse Insights if detected */}
      {analytics.relapsePatterns && analytics.relapsePatterns.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#232336]/60">
          <RelapseInsights patterns={analytics.relapsePatterns} title="Detected Relapse Patterns" />
        </div>
      )}
    </div>
  );
}
