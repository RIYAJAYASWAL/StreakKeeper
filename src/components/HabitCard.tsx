"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface HabitCardProps {
  id?: string;
  habitId?: string;
  name: string;
  description?: string | null;
  currentStreak: number;
  todayStatus: "DONE" | "MISSED" | "FROZEN" | "PENDING" | null;
  freezesAvailable: number;
  frequency?: string;
}

export default function HabitCard({
  id,
  habitId,
  name,
  description,
  currentStreak,
  todayStatus,
  freezesAvailable,
  frequency = "DAILY",
}: HabitCardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetId = habitId || id || "";

  // Check if streak is a milestone (7, 30, 100 days)
  const isMilestone = [7, 30, 100].includes(currentStreak);

  const handleCardClick = (e: React.MouseEvent) => {
    // Avoid triggering card navigation when interactive buttons/links inside are clicked
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) {
      return;
    }
    if (targetId) {
      router.push(`/habits/${targetId}`);
    }
  };

  const handleMarkDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!targetId) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/habits/${targetId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          status: "DONE",
        }),
      });
      router.refresh();
    } catch {
      // Graceful fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreeze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!targetId) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/habits/${targetId}/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      router.refresh();
    } catch {
      // Graceful fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-xl bg-surface border border-surfaceBorder hover:border-[#383852] transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer select-none shadow-sm hover:shadow-md"
    >
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-textPrimary text-base group-hover:text-white transition-colors line-clamp-1">
            {name}
          </h3>

          {/* Flame Icon & Streak Counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background border border-surfaceBorder shrink-0">
            <div
              className={`relative flex items-center justify-center ${
                isMilestone ? "animate-pulse shadow-[0_0_10px_#FF6B6B] rounded-full" : ""
              }`}
            >
              <svg
                className="w-4 h-4 text-emberMid"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12.001 2c-3.5 4.5-2.5 7.5-1 9.5-3-1-4-3.5-4-3.5-2.5 3.5-1 7.5 1 9.5 2 2 5.5 2.5 8 0 3-3 2.5-8.5-4-15.5zm.5 16.5c-1.5.5-3 0-3.5-1-.5-1 0-2.5 1-3.5 1 1.5 2.5 2 3.5 2.5.5 1 .5 1.5-1 2z" />
              </svg>
            </div>
            <span className="font-mono font-bold text-xs text-transparent bg-clip-text bg-ember-gradient">
              {currentStreak}
            </span>
          </div>
        </div>

        {/* Freezes Remaining Badge (Violet) */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-violet/10 border border-violet/30 text-violet text-xs font-medium">
            <span>❄️</span>
            <span>{freezesAvailable} freeze{freezesAvailable !== 1 ? "s" : ""} remaining</span>
          </span>
        </div>
      </div>

      {/* Bottom Action / Status Area */}
      <div className="pt-3 border-t border-surfaceBorder/60">
        {/* PENDING State: Mark Done Button */}
        {todayStatus === "PENDING" && (
          <button
            onClick={handleMarkDone}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-ember-gradient text-background font-bold text-sm shadow-md shadow-[#FF6B6B]/20 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              <span>Mark Done</span>
            )}
          </button>
        )}

        {/* DONE State: Coral Badge with Dark Text */}
        {todayStatus === "DONE" && (
          <div className="w-full py-2 px-3 rounded-lg bg-emberStart text-background text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>Completed today</span>
          </div>
        )}

        {/* MISSED State: Muted Plum-Gray with "Use a freeze?" link */}
        {todayStatus === "MISSED" && (
          <div className="w-full py-2 px-3 rounded-lg bg-muted/30 border border-muted/50 text-textSecondary text-xs flex items-center justify-between">
            <span className="font-medium text-textSecondary">Missed today</span>
            {freezesAvailable > 0 && (
              <button
                onClick={handleFreeze}
                disabled={isSubmitting}
                className="text-xs font-semibold text-violet hover:underline transition-colors"
              >
                Use a freeze?
              </button>
            )}
          </div>
        )}

        {/* FROZEN State: Icy Cyan Badge */}
        {todayStatus === "FROZEN" && (
          <div className="w-full py-2 px-3 rounded-lg bg-frozen/10 border border-frozen/30 text-frozen text-xs font-semibold flex items-center justify-center gap-1.5">
            <span>Streak frozen ❄️</span>
          </div>
        )}
      </div>
    </div>
  );
}
