"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { enqueueOfflineCheckoff } from "@/lib/offlineQueue";

export interface HabitCardProps {
  id?: string;
  habitId?: string;
  name: string;
  description?: string | null;
  currentStreak: number;
  todayStatus: "DONE" | "MISSED" | "FROZEN" | "PENDING" | null;
  freezesAvailable: number;
  frequency?: string;
  groupColor?: string | null;
  groupName?: string | null;
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
  groupColor,
  groupName,
}: HabitCardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"DONE" | "MISSED" | "FROZEN" | "PENDING" | null>(todayStatus);
  const [streak, setStreak] = useState<number>(currentStreak);

  const rawId = habitId || id || "";
  const targetId = rawId.includes("/") ? rawId.split("/").filter(Boolean).pop() || "" : rawId;


  useEffect(() => {
    setStatus(todayStatus);
    setStreak(currentStreak);
  }, [todayStatus, currentStreak]);

  // Check if streak is a milestone (7, 30, 100 days)
  const isMilestone = [7, 30, 100].includes(streak);

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
    if (!targetId || isSubmitting) return;

    setIsSubmitting(true);
    const prevStatus = status;
    const prevStreak = streak;

    // Optimistic UI update: status -> DONE, streak -> streak + 1
    setStatus("DONE");
    setStreak((prev) => prev + 1);

    // If browser is currently offline, queue check-off in localStorage
    if (typeof window !== "undefined" && !navigator.onLine) {
      enqueueOfflineCheckoff(targetId);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/habits/${targetId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          status: "DONE",
        }),
      });

      if (!res.ok) {
        setStatus(prevStatus);
        setStreak(prevStreak);
      } else {
        router.refresh();
      }
    } catch {
      // Fallback to offline queue if network request failed due to disconnection
      if (typeof window !== "undefined" && !navigator.onLine) {
        enqueueOfflineCheckoff(targetId);
      } else {
        setStatus(prevStatus);
        setStreak(prevStreak);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleUndoDone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!targetId || isSubmitting) return;

    setIsSubmitting(true);
    const prevStatus = status;
    const prevStreak = streak;

    // Optimistic UI update: status -> null, streak -> streak - 1
    setStatus(null);
    setStreak((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/habits/${targetId}/logs`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setStatus(prevStatus);
        setStreak(prevStreak);
      } else {
        router.refresh();
      }
    } catch {
      setStatus(prevStatus);
      setStreak(prevStreak);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreeze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!targetId || isSubmitting) return;
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
      className="group relative rounded-xl bg-surface border border-surfaceBorder hover:border-[#383852] transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer select-none shadow-sm hover:shadow-md overflow-hidden"
      style={groupColor ? { borderLeft: `4px solid ${groupColor}` } : undefined}
    >
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {groupColor && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: groupColor }}
                title={groupName || undefined}
              />
            )}
            <h3 className="font-semibold text-textPrimary text-base group-hover:text-white transition-colors line-clamp-1">
              {name}
            </h3>
          </div>

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
              {streak}
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
        {/* DONE State: Coral Button with Checkmark (Clickable to Undo) */}
        {status === "DONE" && (
          <button
            type="button"
            onClick={handleUndoDone}
            disabled={isSubmitting}
            title="Click to undo completion"
            className="w-full py-2 px-3 rounded-lg bg-emberStart text-background text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>{isSubmitting ? "Updating..." : "Completed today"}</span>
          </button>
        )}

        {/* MISSED State: Muted Plum-Gray with "Use a freeze?" link */}
        {status === "MISSED" && (
          <div className="w-full py-2 px-3 rounded-lg bg-muted/30 border border-muted/50 text-textSecondary text-xs flex items-center justify-between">
            <span className="font-medium text-textSecondary">Missed today</span>
            {freezesAvailable > 0 && (
              <button
                type="button"
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
        {status === "FROZEN" && (
          <div className="w-full py-2 px-3 rounded-lg bg-frozen/10 border border-frozen/30 text-frozen text-xs font-semibold flex items-center justify-center gap-1.5">
            <span>Streak frozen ❄️</span>
          </div>
        )}

        {/* UNCOMPLETED State (null or PENDING): Mark as complete button */}
        {(!status || status === "PENDING") && (
          <button
            type="button"
            onClick={handleMarkDone}
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded-lg bg-surface border border-surfaceBorder hover:border-violet/60 hover:bg-violet/10 text-textPrimary text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 text-textSecondary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>{isSubmitting ? "Saving..." : "Mark as complete"}</span>
          </button>
        )}
      </div>
    </div>

  );
}
