import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import HabitDetailActions from "@/components/HabitDetailActions";

export const revalidate = 0;

export default async function HabitDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAuthSession();
  const user = session?.user || { name: "Alex Morgan", email: "alex@streakkeeper.com", id: "demo-user-id" };
  const userId = user.id || "demo-user-id";
  const habitId = params.id;

  let habit = null;

  try {
    habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: { in: [userId, "demo-user-id"] },
        archivedAt: null,
      },
      include: {
        habitLogs: {
          orderBy: { date: "desc" },
        },
      },
    });
  } catch {
    // Fallback if DB disconnected
  }

  if (!habit) {
    // If habit doesn't belong to current user or doesn't exist
    notFound();
  }

  // Calculate stats
  const totalCompletions = habit.habitLogs.filter((l) => l.status === "DONE").length;
  const totalFreezesUsed = habit.habitLogs.filter((l) => l.status === "FROZEN").length;

  // Calculate current and longest streaks with date continuity checks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Current streak (from most recent logs)
  let prevDate: Date | null = null;
  for (const log of habit.habitLogs) {
    if (log.status !== "DONE" && log.status !== "FROZEN") {
      break;
    }
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);

    if (prevDate !== null) {
      const diffDays = Math.round((prevDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays !== 1) {
        break;
      }
    }
    currentStreak += 1;
    prevDate = logDate;
  }

  // Longest streak across all logs
  const logsChronological = [...habit.habitLogs].reverse();
  let lastDate: Date | null = null;
  for (const log of logsChronological) {
    if (log.status === "DONE" || log.status === "FROZEN") {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);

      if (lastDate !== null) {
        const diffDays = Math.round((logDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak += 1;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      lastDate = logDate;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
      lastDate = null;
    }
  }

  // Completion rate calculation
  const createdDate = new Date(habit.createdAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - createdDate.getTime());
  const totalTrackedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const completionRate = Math.min(100, Math.round((totalCompletions / totalTrackedDays) * 100));

  const formattedLogs = habit.habitLogs.map((log) => ({
    date: new Date(log.date).toISOString().split("T")[0],
    status: log.status as "DONE" | "MISSED" | "FROZEN",
  }));

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col selection:bg-violet/30 selection:text-textPrimary">
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
            isPublic={habit.isPublic}
            publicId={habit.publicId}
          />
        </div>

        {/* Heatmap Section */}
        <div>
          <HeatmapCalendar logs={formattedLogs} startDate={habit.createdAt} />
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
      </main>
    </div>
  );
}

