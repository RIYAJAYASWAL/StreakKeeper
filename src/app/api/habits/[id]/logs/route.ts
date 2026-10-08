import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getTodayInTimezone } from "@/lib/streakEngine";

async function getUserId() {
  const session = await getAuthSession();
  if (session?.user) return session.user.id || "demo-user-id";
  return process.env.NODE_ENV === "production" ? null : "demo-user-id";
}

// GET /api/habits/[id]/logs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: habitId } = await params;

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: habitId } = await params;

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

// DELETE /api/habits/[id]/logs
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: habitId } = await params;

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

    await prisma.habitLog.deleteMany({
      where: {
        habitId,
        date: todayDate,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}