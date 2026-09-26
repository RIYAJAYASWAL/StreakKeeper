import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getTodayInTimezone } from "@/lib/streakEngine";

// POST /api/habits/[id]/freeze
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const { id: habitId } = await params;

    // Verify habit ownership and freezes available
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { id: true, userId: true, freezesAvailable: true },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    if (habit.userId !== userId && habit.userId !== "demo-user-id") {
      return NextResponse.json(
        { error: "Forbidden: You do not own this habit." },
        { status: 403 }
      );
    }

    // Check freeze availability
    if (habit.freezesAvailable <= 0) {
      return NextResponse.json(
        { error: "No streak freezes available for this habit." },
        { status: 400 }
      );
    }

    // Get user timezone
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    const timezone = user?.timezone || "UTC";
    const todayStr = getTodayInTimezone(timezone);
    const todayDate = new Date(todayStr + "T00:00:00Z");

    // Check existing log entry for today
    const existingLog = await prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: todayDate,
        },
      },
    });

    if (existingLog && existingLog.status === "DONE") {
      return NextResponse.json(
        { error: "Cannot freeze a day that is already completed." },
        { status: 400 }
      );
    }

    // Execute atomic Prisma transaction
    const [updatedLog, updatedHabit] = await prisma.$transaction([
      prisma.habitLog.upsert({
        where: {
          habitId_date: {
            habitId,
            date: todayDate,
          },
        },
        update: {
          status: "FROZEN",
          loggedAt: new Date(),
        },
        create: {
          habitId,
          date: todayDate,
          status: "FROZEN",
          loggedAt: new Date(),
        },
      }),
      prisma.habit.update({
        where: { id: habitId },
        data: {
          freezesAvailable: {
            decrement: 1,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      habitLog: updatedLog,
      freezesAvailable: updatedHabit.freezesAvailable,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}