import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getTodayInTimezone } from "@/lib/streakEngine";

// GET /api/habits/[id]/logs
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const habitId = params.id;

    // Verify habit ownership
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { userId: true },
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

    const logs = await prisma.habitLog.findMany({
      where: { habitId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ logs }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/habits/[id]/logs
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const habitId = params.id;

    // Verify habit ownership
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { id: true, userId: true },
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

    // Get user timezone
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    const timezone = user?.timezone || "UTC";
    const todayStr = getTodayInTimezone(timezone);
    const todayDate = new Date(todayStr + "T00:00:00Z");

    // Upsert log entry on (habitId, date) constraint to prevent duplicates
    const log = await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId,
          date: todayDate,
        },
      },
      update: {
        status: "DONE",
        loggedAt: new Date(),
      },
      create: {
        habitId,
        date: todayDate,
        status: "DONE",
        loggedAt: new Date(),
      },
    });

    return NextResponse.json({ log }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
