import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  calculateHabitAnalytics,
  calculateAggregateAnalytics,
  HabitDataForAnalytics,
  HabitAnalyticsResult,
} from "@/lib/analyticsEngine";
import {
  OverallAnalyticsSummary,
  HabitAnalyticsCard,
} from "@/components/AnalyticsCharts";
import HabitProgressRefreshListener from "@/components/HabitProgressRefreshListener";
import Link from "next/link";
import { Frequency, getTodayInTimezone, LogStatus } from "@/lib/streakEngine";

export const revalidate = 0; // Dynamic server component

export default async function AnalyticsPage() {
  const session = await getAuthSession();
  const user = session?.user || {
    name: "Alex Morgan",
    email: "alex@streakkeeper.com",
    id: "demo-user-id",
    timezone: "UTC",
  };
  const userId = user.id || "demo-user-id";
  let timezone = (user as { timezone?: string }).timezone || "UTC";
  try {
    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    timezone = userSettings?.timezone || timezone;
  } catch {
    // Keep the session timezone or UTC fallback
  }

  let habitsAnalytics: HabitAnalyticsResult[] = [];
  let aggregateAnalytics = calculateAggregateAnalytics([]);

  try {
    const rawHabits = await prisma.habit.findMany({
      where: {
        userId: { in: [userId, "demo-user-id"] },
        archivedAt: null,
      },
      include: {
        habitLogs: {
          orderBy: { date: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedHabits: HabitDataForAnalytics[] = rawHabits.map((h) => ({
      id: h.id,
      name: h.name,
      frequency: h.frequency as Frequency,
      targetDays: h.targetDays || [],
      createdAt: h.createdAt,
      timezone,
      habitLogs: h.habitLogs.map((log) => ({
        date: log.date,
        status: log.status as LogStatus,
      })),
    }));

    const today = new Date(`${getTodayInTimezone(timezone)}T00:00:00.000Z`);
    habitsAnalytics = formattedHabits.map((h) => calculateHabitAnalytics(h, today));
    aggregateAnalytics = calculateAggregateAnalytics(habitsAnalytics);
  } catch (error) {
    console.error("Failed to fetch analytics from Prisma:", error);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F4F4F8] selection:bg-[#8B5CF6]/30 selection:text-[#F4F4F8] flex flex-col font-sans">
      <HabitProgressRefreshListener />
      {/* Navigation Header */}
      <header className="w-full border-b border-[#232336]/80 bg-[#0A0A0F]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF6B6B] via-[#FF9F1C] to-[#FFD23F] p-0.5 shadow-md shadow-[#FF6B6B]/20">
                <div className="w-full h-full bg-[#15151E] rounded-[6px] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#FF9F1C]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.001 2c-3.5 4.5-2.5 7.5-1 9.5-3-1-4-3.5-4-3.5-2.5 3.5-1 7.5 1 9.5 2 2 5.5 2.5 8 0 3-3 2.5-8.5-4-15.5zm.5 16.5c-1.5.5-3 0-3.5-1-.5-1 0-2.5 1-3.5 1 1.5 2.5 2 3.5 2.5.5 1 .5 1.5-1 2z" />
                  </svg>
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight text-[#F4F4F8]">
                Streak<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B6B] via-[#FF9F1C] to-[#FFD23F]">Keeper</span>
              </span>
            </Link>

            {/* Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-[#9494A8] hover:text-[#F4F4F8] hover:bg-[#15151E] transition-all"
              >
                Dashboard
              </Link>
              <Link
                href="/analytics"
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-[#F4F4F8] bg-[#15151E] border border-[#232336] shadow-sm transition-all"
              >
                Analytics
              </Link>
              <Link
                href="/settings"
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-[#9494A8] hover:text-[#F4F4F8] hover:bg-[#15151E] transition-all"
              >
                Settings
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#9494A8] text-xs hidden sm:inline-block">
              Logged in as <strong className="text-[#F4F4F8] font-medium">{user.name || user.email}</strong>
            </span>
            <Link
              href="/api/auth/signout"
              className="text-xs text-[#9494A8] hover:text-[#8B5CF6] transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F4F8] flex items-center gap-3">
              <span>Analytics & Insights</span>
              <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-full bg-[#FF9F1C]/10 border border-[#FF9F1C]/30 text-[#FF9F1C]">
                4-Week View
              </span>
            </h1>
            <p className="text-sm text-[#9494A8] mt-1">
              Track consistency scores, completion rates, and streak stability over time.
            </p>
          </div>

          <Link
            href="/habits/new"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B6B] via-[#FF9F1C] to-[#FFD23F] text-[#0A0A0F] font-bold text-sm shadow-md shadow-[#FF6B6B]/20 hover:shadow-lg hover:shadow-[#FF6B6B]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Habit</span>
          </Link>
        </div>

        {habitsAnalytics.length === 0 ? (
          /* Empty State */
          <div className="my-12 py-16 px-6 rounded-2xl bg-[#15151E] border border-[#232336] text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center text-[#8B5CF6] mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#F4F4F8] mb-2">No analytics available yet</h3>
            <p className="text-[#9494A8] text-sm max-w-sm mb-6 leading-relaxed">
              Create habits and log your daily activity to unlock completion rates, consistency scores, and weekly trend bar charts.
            </p>
            <Link
              href="/habits/new"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B6B] via-[#FF9F1C] to-[#FFD23F] text-[#0A0A0F] font-bold text-sm shadow-md shadow-[#FF6B6B]/20 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Create First Habit</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Top Summary Row (Overall Stats Across All Habits) */}
            <OverallAnalyticsSummary aggregate={aggregateAnalytics} />

            {/* Per-Habit Breakdown Section Below */}
            <div className="mt-12 pt-8 border-t border-[#232336]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#F4F4F8]">
                    Per-Habit Performance Breakdown
                  </h2>
                  <p className="text-xs text-[#9494A8] mt-1">
                    Individual completion rates, streak stability, consistency scores, and mini 4-week bar charts.
                  </p>
                </div>
                <span className="text-xs text-[#9494A8] font-mono">
                  {habitsAnalytics.length} Habit{habitsAnalytics.length !== 1 ? "s" : ""} Total
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {habitsAnalytics.map((habitAnalytics) => (
                  <HabitAnalyticsCard key={habitAnalytics.habitId} analytics={habitAnalytics} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
