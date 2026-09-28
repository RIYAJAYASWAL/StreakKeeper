import Link from "next/link";
import prisma from "@/lib/prisma";
import HeatmapCalendar from "@/components/HeatmapCalendar";

export const revalidate = 60; // Cache public streaks for 60 seconds

export default async function PublicHabitPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  let habit = null;

  try {
    habit = await prisma.habit.findUnique({
      where: {
        publicId: publicId,
      },
      include: {
        habitLogs: {
          orderBy: { date: "desc" },
        },
      },
    });
  } catch {
    // Graceful fallback
  }

  // If not found, not public, or archived
  if (!habit || !habit.isPublic || habit.archivedAt) {
    return (
      <div className="min-h-screen bg-background text-textPrimary flex flex-col justify-center items-center px-4 selection:bg-violet/30 selection:text-textPrimary">
        <div className="max-w-md w-full p-8 rounded-2xl bg-surface border border-surfaceBorder text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-emberStart/10 border border-emberStart/30 flex items-center justify-center text-emberStart mx-auto font-bold text-xl">
            🔒
          </div>
          <h1 className="text-xl font-bold text-textPrimary">Private or Unavailable Streak</h1>
          <p className="text-sm text-textSecondary leading-relaxed">
            This streak is private or doesn't exist. The owner may have turned off public sharing.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet hover:bg-violet/90 text-white font-semibold text-sm transition-all shadow-md shadow-violet/20"
            >
              Go to StreakKeeper
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  for (const log of habit.habitLogs) {
    if (log.status === "DONE" || log.status === "FROZEN") {
      currentStreak += 1;
    } else {
      break;
    }
  }

  const logsChronological = [...habit.habitLogs].reverse();
  for (const log of logsChronological) {
    if (log.status === "DONE" || log.status === "FROZEN") {
      tempStreak += 1;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  const formattedLogs = habit.habitLogs.map((log) => ({
    date: new Date(log.date).toISOString().split("T")[0],
    status: log.status as "DONE" | "MISSED" | "FROZEN",
  }));

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col justify-between selection:bg-violet/30 selection:text-textPrimary">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-[#FF6B6B]/10 via-[#FF9F1C]/5 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Header Logo */}
      <header className="relative z-10 w-full border-b border-surfaceBorder/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-ember-gradient p-0.5 shadow-md shadow-[#FF6B6B]/20">
              <div className="w-full h-full bg-surface rounded-[6px] flex items-center justify-center">
                <svg className="w-4 h-4 text-emberMid" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.001 2c-3.5 4.5-2.5 7.5-1 9.5-3-1-4-3.5-4-3.5-2.5 3.5-1 7.5 1 9.5 2 2 5.5 2.5 8 0 3-3 2.5-8.5-4-15.5zm.5 16.5c-1.5.5-3 0-3.5-1-.5-1 0-2.5 1-3.5 1 1.5 2.5 2 3.5 2.5.5 1 .5 1.5-1 2z" />
                </svg>
              </div>
            </div>
            <span className="text-base font-bold tracking-tight text-textPrimary">
              Streak<span className="text-transparent bg-clip-text bg-ember-gradient">Keeper</span>
            </span>
          </Link>

          <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-surface border border-surfaceBorder text-textSecondary">
            Public Streak Badge
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1 w-full space-y-8">
        {/* Main Share Card */}
        <div className="p-6 sm:p-10 rounded-2xl bg-surface border border-surfaceBorder shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-ember-gradient" />

          {/* Habit Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-background border border-surfaceBorder text-textSecondary uppercase">
                  {habit.frequency}
                </span>
                <span className="text-xs text-textSecondary">• Shared Habit Streak</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-textPrimary tracking-tight">
                {habit.name}
              </h1>
              {habit.description && (
                <p className="text-sm text-textSecondary mt-2 leading-relaxed max-w-xl">
                  {habit.description}
                </p>
              )}
            </div>

            {/* Prominent Flame & Streak Counter */}
            <div className="p-4 rounded-2xl bg-background border border-surfaceBorder flex items-center gap-3 shadow-lg shrink-0">
              <div className="w-12 h-12 rounded-xl bg-ember-gradient p-0.5 shadow-md shadow-[#FF6B6B]/20">
                <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
                  <svg className="w-6 h-6 text-emberStart animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.001 2c-3.5 4.5-2.5 7.5-1 9.5-3-1-4-3.5-4-3.5-2.5 3.5-1 7.5 1 9.5 2 2 5.5 2.5 8 0 3-3 2.5-8.5-4-15.5zm.5 16.5c-1.5.5-3 0-3.5-1-.5-1 0-2.5 1-3.5 1 1.5 2.5 2 3.5 2.5.5 1 .5 1.5-1 2z" />
                  </svg>
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-wider text-textSecondary font-semibold">
                  Current Streak
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-transparent bg-clip-text bg-ember-gradient">
                  {currentStreak} Days
                </div>
              </div>
            </div>
          </div>

          {/* Streak Overview Badges */}
          <div className="flex items-center gap-6 pt-2 border-t border-surfaceBorder/60">
            <div>
              <span className="text-xs text-textSecondary font-medium">Longest Streak: </span>
              <span className="text-sm font-bold text-textPrimary font-mono">{longestStreak} days</span>
            </div>
            <span className="text-surfaceBorder">•</span>
            <div>
              <span className="text-xs text-textSecondary font-medium">Tracking Status: </span>
              <span className="text-sm font-bold text-frozen">Active 🔥</span>
            </div>
          </div>

          {/* Reused Heatmap Calendar */}
          <div className="pt-4">
            <HeatmapCalendar logs={formattedLogs} startDate={habit.createdAt} />
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="relative z-10 border-t border-surfaceBorder/60 py-8 bg-background/90 text-center">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-textSecondary">
            Building habits that forgive bad days?
          </p>
          <Link
            href="/signup"
            className="px-6 py-2.5 rounded-xl bg-violet hover:bg-violet/90 text-white font-bold text-sm shadow-md shadow-violet/20 hover:scale-105 transition-all"
          >
            Track your own habits — Try StreakKeeper
          </Link>
        </div>
      </footer>
    </div>
  );
}
