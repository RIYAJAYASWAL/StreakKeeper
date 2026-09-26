import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import HabitCard from "@/components/HabitCard";

export const revalidate = 0; // Dynamic server component

export default async function DashboardPage() {
  const session = await getAuthSession();
  const user = session?.user || { name: "Alex Morgan", email: "alex@streakkeeper.com", id: "demo-user-id" };
  const userId = user.id || "demo-user-id";

  // Calculate today's date start (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let habits: Array<{
    id: string;
    name: string;
    description: string | null;
    frequency: string;
    freezesAvailable: number;
    currentStreak: number;
    todayStatus: "DONE" | "MISSED" | "FROZEN" | null;
  }> = [];

  try {
    const rawHabits = await prisma.habit.findMany({
      where: {
        userId: { in: [userId, "demo-user-id"] },
        archivedAt: null,
      },
      include: {
        habitLogs: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    habits = rawHabits.map((habit) => {
      // Find log for today
      const todayLog = habit.habitLogs.find((log) => {
        const logDate = new Date(log.date);
        return logDate.toISOString().split("T")[0] === today.toISOString().split("T")[0];
      });

      // Calculate current streak from consecutive DONE logs
      let currentStreak = 0;
      for (const log of habit.habitLogs) {
        if (log.status === "DONE" || log.status === "FROZEN") {
          currentStreak += 1;
        } else {
          break;
        }
      }

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        frequency: habit.frequency,
        freezesAvailable: habit.freezesAvailable,
        currentStreak,
        todayStatus: (todayLog?.status as "DONE" | "MISSED" | "FROZEN") || null,
      };
    });
  } catch {
    // If DB fails or fallback mode, provide clean empty state or mock data
    habits = [];
  }

  // Calculate summary stats
  const totalActiveHabits = habits.length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);
  const totalFreezesRemaining = habits.reduce((sum, h) => sum + h.freezesAvailable, 0);

  return (
    <div className="min-h-screen bg-background text-textPrimary selection:bg-violet/30 selection:text-textPrimary flex flex-col">
      {/* Navbar */}
      <header className="w-full border-b border-surfaceBorder/60 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-ember-gradient p-0.5 shadow-md shadow-[#FF6B6B]/20">
              <div className="w-full h-full bg-surface rounded-[6px] flex items-center justify-center">
                <svg className="w-4 h-4 text-emberMid" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.001 2c-3.5 4.5-2.5 7.5-1 9.5-3-1-4-3.5-4-3.5-2.5 3.5-1 7.5 1 9.5 2 2 5.5 2.5 8 0 3-3 2.5-8.5-4-15.5zm.5 16.5c-1.5.5-3 0-3.5-1-.5-1 0-2.5 1-3.5 1 1.5 2.5 2 3.5 2.5.5 1 .5 1.5-1 2z" />
                </svg>
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight text-textPrimary">
              Streak<span className="text-transparent bg-clip-text bg-ember-gradient">Keeper</span>
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-textSecondary text-xs hidden sm:inline-block">
              Logged in as <strong className="text-textPrimary font-medium">{user.name || user.email}</strong>
            </span>
            <Link
              href="/api/auth/signout"
              className="text-xs text-textSecondary hover:text-violet transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-textPrimary">
              Your Habits
            </h1>
            <p className="text-sm text-textSecondary mt-1">
              Track your daily progress and keep your streaks glowing.
            </p>
          </div>

          <Link
            href="/habits/new"
            className="px-5 py-2.5 rounded-xl bg-ember-gradient text-background font-bold text-sm shadow-md shadow-[#FF6B6B]/20 hover:shadow-lg hover:shadow-[#FF6B6B]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>New Habit</span>
          </Link>
        </div>

        {/* Empty State vs Habit Grid */}
        {habits.length === 0 ? (
          <div className="my-12 py-16 px-6 rounded-2xl bg-surface border border-surfaceBorder text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-xl">
            {/* Violet Icon/Illustration */}
            <div className="w-16 h-16 rounded-2xl bg-violet/10 border border-violet/20 flex items-center justify-center text-violet mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 3.974 3.974 0 00-1.07-1.002A3.75 3.75 0 0012 18z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-textPrimary mb-2">No habits yet</h3>
            <p className="text-textSecondary text-sm max-w-sm mb-6 leading-relaxed">
              Start your first streak! Set up a habit and build consistency with forgiving streak freezes.
            </p>

            <Link
              href="/habits/new"
              className="px-6 py-3 rounded-xl bg-ember-gradient text-background font-bold text-sm shadow-md shadow-[#FF6B6B]/20 hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>New Habit</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                id={habit.id}
                habitId={habit.id}
                name={habit.name}
                description={habit.description}
                currentStreak={habit.currentStreak}
                todayStatus={habit.todayStatus}
                freezesAvailable={habit.freezesAvailable}
                frequency={habit.frequency}
              />
            ))}
          </div>
        )}

        {/* Summary Stats Bar */}
        <div className="mt-8 pt-8 border-t border-surfaceBorder/60">
          <h2 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-4">
            Streak Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stat 1 */}
            <div className="p-4 rounded-xl bg-surface border border-surfaceBorder flex items-center justify-between">
              <div>
                <p className="text-xs text-textSecondary font-medium">Active Habits</p>
                <p className="text-2xl font-extrabold text-textPrimary mt-1">{totalActiveHabits}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-background border border-surfaceBorder flex items-center justify-center text-textPrimary text-sm font-bold">
                📋
              </div>
            </div>

            {/* Stat 2 */}
            <div className="p-4 rounded-xl bg-surface border border-surfaceBorder flex items-center justify-between">
              <div>
                <p className="text-xs text-textSecondary font-medium">Longest Current Streak</p>
                <p className="text-2xl font-extrabold text-textPrimary mt-1">{longestStreak} <span className="text-xs font-normal text-textSecondary">days</span></p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-background border border-surfaceBorder flex items-center justify-center text-emberMid text-sm font-bold">
                🔥
              </div>
            </div>

            {/* Stat 3 */}
            <div className="p-4 rounded-xl bg-surface border border-surfaceBorder flex items-center justify-between">
              <div>
                <p className="text-xs text-textSecondary font-medium">Total Freezes Remaining</p>
                <p className="text-2xl font-extrabold text-textPrimary mt-1">{totalFreezesRemaining}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-background border border-surfaceBorder flex items-center justify-center text-frozen text-sm font-bold">
                🧊
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
