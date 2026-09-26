import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTodayInTimezone, shouldExpectLogOnDate } from "@/lib/streakEngine";

export const revalidate = 0; // Dynamic API Route

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const headerSecret = request.headers.get("x-cron-secret");
    const querySecret = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET || "default_cron_secret_key";

    const isAuthorized =
      (authHeader && authHeader === `Bearer ${expectedSecret}`) ||
      headerSecret === expectedSecret ||
      querySecret === expectedSecret;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized cron execution" },
        { status: 401 }
      );
    }

    // Fetch all active (non-archived) habits with user timezone
    const activeHabits = await prisma.habit.findMany({
      where: {
        archivedAt: null,
      },
      include: {
        user: {
          select: {
            timezone: true,
          },
        },
      },
    });

    let processedCount = 0;
    let missedLogsCreated = 0;
    const errors: Array<{ habitId: string; error: string }> = [];

    // Process each habit resiliently
    for (const habit of activeHabits) {
      try {
        processedCount += 1;
        const timezone = habit.user?.timezone || "UTC";

        // Calculate yesterday's date in user's timezone
        const todayStr = getTodayInTimezone(timezone);
        const todayDate = new Date(todayStr + "T00:00:00Z");
        todayDate.setUTCDate(todayDate.getUTCDate() - 1);

        const yesterdayStr = todayDate.toISOString().split("T")[0];
        const yesterdayDate = new Date(yesterdayStr + "T00:00:00Z");

        // Check if yesterday was an expected tracking day
        const isExpected = shouldExpectLogOnDate(
          yesterdayStr,
          habit.frequency as "DAILY" | "WEEKLY" | "CUSTOM",
          habit.targetDays
        );

        if (isExpected) {
          // Check if log already exists for yesterday
          const existingLog = await prisma.habitLog.findUnique({
            where: {
              habitId_date: {
                habitId: habit.id,
                date: yesterdayDate,
              },
            },
          });

          if (!existingLog) {
            // Create MISSED log entry for yesterday
            await prisma.habitLog.create({
              data: {
                habitId: habit.id,
                date: yesterdayDate,
                status: "MISSED",
                loggedAt: new Date(),
              },
            });
            missedLogsCreated += 1;
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        errors.push({ habitId: habit.id, error: errMsg });
      }
    }

    console.log(
      `[CRON DAILY-CHECK] Processed ${processedCount} habits. Created ${missedLogsCreated} MISSED logs. Errors: ${errors.length}`
    );

    return NextResponse.json(
      {
        success: true,
        summary: {
          processedCount,
          missedLogsCreated,
          errorCount: errors.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Internal Cron Failure";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
