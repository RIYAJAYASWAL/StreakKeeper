import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateCurrentStreak, calculateLongestStreak } from "@/lib/streakEngine";
import { calculateHabitAnalytics, getBestPerformanceWindow } from "@/lib/analyticsEngine";
import { detectRelapsePatterns } from "@/lib/relapseDetector";
import {
  compareBuckets,
  computeCorrelation,
  describeCorrelation,
} from "@/lib/correlationEngine";

const SYSTEM_PROMPT = `You are a habit coach. You will be given real statistics about a user's habit. Give exactly one short, specific suggestion (2-3 sentences max) that directly references the numbers provided. Do not give generic advice that could apply to anyone. If the data shows no clear pattern, say so honestly instead of inventing one. If sleep-study correlation information is provided, you may reference it, but describe only a tendency to coincide and never imply causation. Say so honestly if the relationship is weak or the sample is small.`;

async function getUserId() {
  const session = await getAuthSession();
  if (session?.user) return session.user.id || "demo-user-id";
  return process.env.NODE_ENV === "production" ? null : "demo-user-id";
}

function generateFallbackSuggestion(data: any): string {
  const { habitName, currentStreak, longestStreak, completionRate, bestDay, bestTimeRange, totalLogs, correlationInsight } = data;
  const withCorrelation = (suggestion: string) =>
    correlationInsight ? `${suggestion} ${correlationInsight}` : suggestion;

  if (!totalLogs || totalLogs < 5) {
    return withCorrelation(`You've logged ${totalLogs || 0} check-ins for ${habitName}. Keep checking in regularly to unlock data-driven coaching insights.`);
  }

  if (bestDay && bestTimeRange) {
    return withCorrelation(`For ${habitName}, your data shows you're most consistent on ${bestDay} during ${bestTimeRange} with a ${completionRate} completion rate. Leverage this momentum to push your current ${currentStreak}-day streak closer to your record of ${longestStreak} days.`);
  }

  return withCorrelation(`Your current streak for ${habitName} is ${currentStreak} day${currentStreak === 1 ? "" : "s"} against a record of ${longestStreak} days with a ${completionRate} overall completion rate. Maintaining a consistent daily check-in time will help build higher consistency.`);
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { habitId, refresh } = body;

    if (!habitId) {
      return NextResponse.json({ error: "habitId is required" }, { status: 400 });
    }

    // 1. Fetch the habit and verify ownership before reading its suggestion cache.
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        habitLogs: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    if (habit.userId !== userId && habit.userId !== "demo-user-id") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Check cache in database (if refresh is false)
    if (!refresh) {
      try {
        const existingSuggestion = await prisma.coachSuggestion.findUnique({
          where: { habitId },
        });

        if (existingSuggestion) {
          const ageInMs = Date.now() - new Date(existingSuggestion.generatedAt).getTime();
          const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

          if (ageInMs < TWENTY_FOUR_HOURS) {
            return NextResponse.json({
              suggestion: existingSuggestion.suggestionText,
              cached: true,
              generatedAt: existingSuggestion.generatedAt,
            });
          }
        }
      } catch {
        // Cache read failed, proceed to generate
      }
    }

    // 3. Compute structured summary statistics
    const logs = habit.habitLogs.map((l) => ({
      date: l.date,
      status: l.status,
      loggedAt: l.loggedAt,
    }));

    const currentStreak = calculateCurrentStreak(logs as any, habit.frequency as any, habit.targetDays);
    const longestStreak = calculateLongestStreak(logs as any, habit.frequency as any, habit.targetDays);

    let completionRate = 0;
    try {
      const analytics = calculateHabitAnalytics({
        id: habit.id,
        name: habit.name,
        frequency: habit.frequency as any,
        targetDays: habit.targetDays,
        createdAt: habit.createdAt,
        habitLogs: logs as any,
      });
      completionRate = analytics.completionRate;
    } catch {
      const doneCount = logs.filter((l) => l.status === "DONE" || l.status === "FROZEN").length;
      completionRate = logs.length > 0 ? Math.round((doneCount / logs.length) * 100) : 0;
    }

    const relapsePatterns = detectRelapsePatterns(logs as any);
    const performanceWindow = getBestPerformanceWindow(logs as any);

    const numericHabits = await prisma.habit.findMany({
      where: {
        userId: habit.userId,
        archivedAt: null,
        isNumeric: true,
        unit: { equals: "hours", mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        unit: true,
        habitLogs: {
          where: { value: { not: null } },
          select: { date: true, value: true },
        },
      },
    });

    const sleepHabit = numericHabits.find((item) => /sleep/i.test(item.name));
    const studyHabit = numericHabits.find((item) => /study/i.test(item.name));
    const sleepStudyCorrelation =
      sleepHabit && studyHabit
        ? (() => {
            const sleepLogs = sleepHabit.habitLogs.map((log) => ({
              date: log.date,
              value: log.value,
            }));
            const studyLogs = studyHabit.habitLogs.map((log) => ({
              date: log.date,
              value: log.value,
            }));
            const correlation = computeCorrelation(sleepLogs, studyLogs);
            const bucketAverages = compareBuckets(sleepLogs, studyLogs);
            return {
              r: correlation.r,
              n: correlation.n,
              bucketAverages,
              description: describeCorrelation(correlation, bucketAverages),
            };
          })()
        : null;

    const structuredSummary = {
      habitName: habit.name,
      frequency: habit.frequency,
      currentStreak,
      longestStreak,
      completionRate: `${completionRate}%`,
      totalLogs: logs.length,
      bestDay: performanceWindow.bestDay,
      bestTimeRange: performanceWindow.bestTimeRange,
      relapsePatterns: relapsePatterns.map((p) => ({ description: p.description, type: p.type })),
      sleepStudyCorrelation,
      correlationInsight: sleepStudyCorrelation?.description || null,
      goalType: habit.goalType,
      goalTarget: habit.goalTarget,
    };

    let suggestionText = "";
    let providerError: string | null = null;

    // 4. Call Gemini when configured; retain the local suggestion as a fallback.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      providerError = "GEMINI_API_KEY is not configured.";
      console.error(`Habit coach fallback: ${providerError}`);
    } else {
      const models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];
      for (const model of models) {
        try {
          const aiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [
                      {
                        text: `${SYSTEM_PROMPT}\n\nHere are the habit statistics:\n${JSON.stringify(structuredSummary, null, 2)}`,
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const rawText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText && rawText.trim().length > 0) {
              suggestionText = rawText.trim();
              providerError = null;
              break;
            }
            providerError = `${model} returned an empty response.`;
          } else {
            const errorData = await aiResponse.json().catch(() => null);
            const providerMessage = errorData?.error?.message;
            providerError = `${model} returned ${aiResponse.status}${providerMessage ? `: ${String(providerMessage).replaceAll(apiKey, "[redacted]").slice(0, 240)}` : "."}`;
          }
        } catch (error) {
          providerError = error instanceof Error ? error.message : `${model} request failed.`;
          providerError = providerError.replaceAll(apiKey, "[redacted]").slice(0, 240);
        }

        console.error(`Habit coach fallback: ${providerError}`);
      }
    }

    if (!suggestionText) {
      suggestionText = generateFallbackSuggestion(structuredSummary);
    }

    // 5. Store suggestion in cache
    let savedAt = new Date();
    try {
      const saved = await prisma.coachSuggestion.upsert({
        where: { habitId },
        update: {
          suggestionText,
          generatedAt: new Date(),
        },
        create: {
          habitId,
          suggestionText,
          generatedAt: new Date(),
        },
      });
      savedAt = saved.generatedAt;
    } catch {
      // Cache save fallback
    }

    return NextResponse.json({
      suggestion: suggestionText,
      cached: false,
      generatedAt: savedAt,
      providerError,
    });
  } catch (err: any) {
    console.error("POST /api/coach error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate coach suggestion" },
      { status: 500 }
    );
  }
}
