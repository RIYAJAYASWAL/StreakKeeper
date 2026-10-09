import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import HabitDetailActions from "@/components/HabitDetailActions";
import HabitProgressRefreshListener from "@/components/HabitProgressRefreshListener";
import ReminderSettings from "@/components/ReminderSettings";
import CoachCard from "@/components/CoachCard";
import { suggestReminderTime, generateRecommendation, getBestPerformanceWindow } from "@/lib/analyticsEngine";
import {
  calculateCurrentStreak,
  calculateLast30DayCompletionRate,
  calculateLongestStreak,
  getTodayInTimezone,
} from "@/lib/streakEngine";
import { Clock } from "lucide-react";

export const revalidate = 0;

export default async function HabitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getAuthSession();
  const user = session?.user || { name: "Alex Morgan", email: "alex@streakkeeper.com", id: "demo-user-id" };
  const userId = user.id || "demo-user-id";
  const { slug } = await params;
  let timezone = "UTC";
  try {
    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    timezone = userSettings?.timezone || timezone;
  } catch {
    // Use UTC if the user's timezone cannot be loaded.
  }
  const today = getTodayInTimezone(timezone);

  const habit = await prisma.habit.findFirst({
    where: {
      userId: { in: [userId, "demo-user-id"] },
      OR: [{ slug }, { id: slug }],
      archivedAt: null,
    },
    include: {
      habitLogs: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!habit) {
    // If habit doesn't belong to current user or doesn't exist
    notFound();
  }
  if (habit.slug !== slug) redirect(`/habits/${habit.slug}`);
  const habitId = habit.id;

  const [reminders, coachSuggestion] = await Promise.all([
    prisma.reminder.findMany({
      where: { habitId },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    prisma.coachSuggestion.findUnique({
      where: { habitId },
    }).catch(() => null),
  ]);

  // Calculate stats
  const totalCompletions = habit.habitLogs.filter((l) => l.status === "DONE").length;
  const totalFreezesUsed = habit.habitLogs.filter((l) => l.status === "FROZEN").length;

  const currentStreak = calculateCurrentStreak(
    habit.habitLogs,
    habit.frequency,
    habit.targetDays,
    timezone
  );
  const longestStreak = calculateLongestStreak(
    habit.habitLogs,
    habit.frequency,
    habit.targetDays
  );
  const completionRate = calculateLast30DayCompletionRate(habit.habitLogs, today);

  const formattedLogs = habit.habitLogs.map((log) => ({
    date: new Date(log.date).toISOString().split("T")[0],
    status: log.status as "DONE" | "MISSED" | "FROZEN",
    loggedAt: log.loggedAt,
  }));

  // Personalization logic: suggest reminder time if >= 10 completed logs exist
  const suggestedTime = suggestReminderTime(habit.habitLogs);

  // Recommendation logic
  const recommendation = generateRecommendation(
    {
      ...habit,
      currentStreak,
      longestStreak,
    },
    formattedLogs,
    {
      goalType: habit.goalType,
      goalTarget: habit.goalTarget,
    }
  );

  // Performance Window Analysis
  const performanceWindow = getBestPerformanceWindow(habit.habitLogs);

  const initialReminders = reminders.map((r) => ({
    id: r.id,
    habitId: r.habitId,
    time: r.time,
    daysOfWeek: r.daysOfWeek,
    enabled: r.enabled,
    lastSentAt: r.lastSentAt ? r.lastSentAt.toISOString() : null,
  }));

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col selection:bg-violet/30 selection:text-textPrimary">
      <HabitProgressRefreshListener />
      {/* Navbar */}
      <header className="w-full border-b border-surfaceBorder/60 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-textSecondary hover:text-textPrimary transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>

          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-base font-bold text-textPrimary">
              Streak<span className="text-transparent bg-clip-text bg-ember-gradient">Keeper</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-8">
        {/* AI Coach Suggestion Card */}
        <CoachCard
          habitId={habit.id}
          initialSuggestion={coachSuggestion?.suggestionText}
        />

        {/* Highlighted Recommendation Card */}

        {recommendation && (
          <div className="p-0.5 rounded-2xl bg-gradient-to-r from-[#FF6B6B] to-[#FF9F1C] shadow-lg shadow-[#FF6B6B]/10">
            <div className="p-5 sm:p-6 rounded-[14px] bg-[#15151E] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF6B6B]/20 to-[#FF9F1C]/20 border border-[#FF6B6B]/40 flex items-center justify-center text-[#FF9F1C] shrink-0 font-bold text-lg">
                  💡
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] to-[#FF9F1C]">
                    Smart Insight
                  </div>
                  <p className="text-sm sm:text-base font-semibold text-textPrimary mt-0.5">
                    {recommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Window Insight Card */}
        {performanceWindow && performanceWindow.summary && (
          <div className="p-5 rounded-2xl bg-[#15151E] border border-[#232336] border-l-4 border-l-[#8B5CF6] flex items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6] shrink-0 font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#8B5CF6]">
                  Performance Window
                </div>
                <p className="text-sm sm:text-base font-semibold text-textPrimary mt-0.5">
                  {performanceWindow.summary}
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Habit Header Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surfaceBorder shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-textPrimary tracking-tight">
                {habit.name}
              </h1>
              <span className="px-3 py-1 rounded-full bg-background border border-surfaceBorder text-xs font-mono font-semibold text-textSecondary uppercase">
                {habit.frequency}
              </span>
            </div>

            {habit.description && (
              <p className="text-textSecondary text-sm sm:text-base max-w-2xl leading-relaxed">
                {habit.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Current Streak */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-textSecondary font-medium">Current Streak:</span>
                <div className="flex items-center gap-1 font-mono font-bold text-base text-transparent bg-clip-text bg-ember-gradient">
                  <span>🔥 {currentStreak} days</span>
                </div>
              </div>

              <span className="text-surfaceBorder">•</span>

              {/* Longest Streak */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-textSecondary font-medium">Longest Streak:</span>
                <span className="font-mono font-bold text-sm text-textPrimary">
                  {longestStreak} days
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <HabitDetailActions
            habitId={habit.id}
            habitSlug={habit.slug}
            isPublic={habit.isPublic}
            publicId={habit.publicId}
          />
        </div>

        {/* Heatmap Section */}
        <div>
          <HeatmapCalendar
            logs={formattedLogs}
            startDate={habit.createdAt}
            today={today}
            frequency={habit.frequency}
            targetDays={habit.targetDays}
            timezone={timezone}
          />
        </div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder flex items-center justify-between">
            <div>
              <p className="text-xs text-textSecondary font-medium">Total Completions</p>
              <p className="text-2xl font-extrabold text-textPrimary mt-1">{totalCompletions}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center">
              ✓
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder flex items-center justify-between">
            <div>
              <p className="text-xs text-textSecondary font-medium">Freezes Used</p>
              <p className="text-2xl font-extrabold text-frozen mt-1">{totalFreezesUsed}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-frozen/10 border border-frozen/30 text-frozen font-bold flex items-center justify-center">
              🧊
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-surfaceBorder flex items-center justify-between">
            <div>
              <p className="text-xs text-textSecondary font-medium">Completion Rate</p>
              <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-ember-gradient mt-1">
                {completionRate}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet/10 border border-violet/30 text-violet font-bold flex items-center justify-center">
              %
            </div>
          </div>
        </div>

        {/* Reminder Settings Section */}
        <ReminderSettings
          habitId={habit.id}
          initialReminders={initialReminders}
          suggestedTime={suggestedTime}
        />
      </main>
    </div>
  );
}
