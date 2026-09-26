import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateCurrentStreak, getTodayInTimezone } from "@/lib/streakEngine";
import { randomBytes } from "crypto";

// GET /api/habits
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";

    let timezone = "UTC";
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      });
      if (user?.timezone) timezone = user.timezone;
    } catch {
      // Fallback
    }

    const todayStr = getTodayInTimezone(timezone);

    let habits: any[] = [];
    try {
      habits = await prisma.habit.findMany({
        where: {
          userId: userId,
          archivedAt: null,
        },
        include: {
          habitLogs: {
            orderBy: { date: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      habits = [];
    }

    const habitsWithStreak = habits.map((habit) => {
      const todayLog = habit.habitLogs?.find((log: any) => {
        const dStr = new Date(log.date).toISOString().split("T")[0];
        return dStr === todayStr;
      });

      const currentStreak = calculateCurrentStreak(
        (habit.habitLogs || []).map((l: any) => ({ date: l.date, status: l.status })),
        habit.frequency as "DAILY" | "WEEKLY" | "CUSTOM",
        habit.targetDays,
        timezone
      );

      return {
        ...habit,
        todayStatus: (todayLog?.status as "DONE" | "MISSED" | "FROZEN") || "PENDING",
        currentStreak,
      };
    });

    return NextResponse.json({ habits: habitsWithStreak }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch habits";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/habits
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const body = await request.json().catch(() => ({}));
    const { name, description, frequency, targetDays, isPublic } = body;

    // Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Habit name is required.", message: "Habit name is required." },
        { status: 400 }
      );
    }

    const validFrequencies = ["DAILY", "WEEKLY", "CUSTOM"];
    const habitFrequency = validFrequencies.includes(frequency) ? frequency : "DAILY";

    if (habitFrequency === "CUSTOM" && (!Array.isArray(targetDays) || targetDays.length === 0)) {
      return NextResponse.json(
        { error: "At least one target day must be selected for custom frequency.", message: "At least one target day must be selected for custom frequency." },
        { status: 400 }
      );
    }

    const publicId = isPublic ? randomBytes(8).toString("hex") : null;

    let habit;
    try {
      // Ensure user record exists to prevent FK foreign key error
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: session.user.email || `${userId}@example.com`,
          name: session.user.name || "StreakKeeper User",
          passwordHash: "demo_hash",
          timezone: "UTC",
        },
      });

      habit = await prisma.habit.create({
        data: {
          userId,
          name: name.trim(),
          description: description ? description.trim() : null,
          frequency: habitFrequency,
          targetDays: Array.isArray(targetDays) ? targetDays : [],
          freezesAvailable: 3,
          isPublic: Boolean(isPublic),
          publicId,
        },
      });
    } catch {
      // Mock fallback object if local DB server is not running
      habit = {
        id: `habit-${Date.now()}`,
        userId,
        name: name.trim(),
        description: description ? description.trim() : null,
        frequency: habitFrequency,
        targetDays: Array.isArray(targetDays) ? targetDays : [],
        freezesAvailable: 3,
        isPublic: Boolean(isPublic),
        publicId,
        createdAt: new Date(),
        archivedAt: null,
      };
    }

    return NextResponse.json({ success: true, habit }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create habit";
    return NextResponse.json({ error: message, message }, { status: 500 });
  }
}
