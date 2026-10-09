import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateCurrentStreak, calculateLongestStreak, getTodayInTimezone } from "@/lib/streakEngine";
import { randomBytes } from "crypto";

// GET /api/habits/[id-or-slug]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const { id: habitIdOrSlug } = await params;

    const habit = await prisma.habit.findFirst({
      where: {
        userId: { in: [userId, "demo-user-id"] },
        OR: [{ id: habitIdOrSlug }, { slug: habitIdOrSlug }],
      },
      include: {
        group: true,
        habitLogs: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    // Ownership check
    // Fetch user timezone for current streak calculation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const timezone = user?.timezone || "UTC";

    const formattedLogs = habit.habitLogs.map((l) => ({
      date: l.date,
      status: l.status as "DONE" | "MISSED" | "FROZEN",
    }));

    const currentStreak = calculateCurrentStreak(
      formattedLogs,
      habit.frequency as "DAILY" | "WEEKLY" | "CUSTOM",
      habit.targetDays,
      timezone
    );

    const longestStreak = calculateLongestStreak(
      formattedLogs,
      habit.frequency as "DAILY" | "WEEKLY" | "CUSTOM",
      habit.targetDays
    );

    return NextResponse.json({
      habit: {
        ...habit,
        currentStreak,
        longestStreak,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/habits/[id-or-slug]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const { id: habitIdOrSlug } = await params;

    const habit = await prisma.habit.findFirst({
      where: {
        userId: { in: [userId, "demo-user-id"] },
        OR: [{ id: habitIdOrSlug }, { slug: habitIdOrSlug }],
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    // Ownership check
    const body = await request.json().catch(() => ({}));
    const { name, description, unit, isNumeric, frequency, targetDays, isPublic, archivedAt, goalType, goalTarget, groupId } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Habit name cannot be empty." }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (isNumeric !== undefined && typeof isNumeric !== "boolean") {
      return NextResponse.json({ error: "isNumeric must be a boolean." }, { status: 400 });
    }
    if (unit !== undefined && unit !== null && typeof unit !== "string") {
      return NextResponse.json({ error: "Unit must be text." }, { status: 400 });
    }
    const numericHabit =
      typeof isNumeric === "boolean" ? isNumeric : habit.isNumeric;
    if (numericHabit && unit !== undefined && (typeof unit !== "string" || !unit.trim())) {
      return NextResponse.json({ error: "A unit is required for numeric habits." }, { status: 400 });
    }
    if (isNumeric !== undefined) {
      updateData.isNumeric = numericHabit;
      if (!numericHabit) updateData.unit = null;
    }
    if (unit !== undefined) {
      updateData.unit =
        numericHabit && typeof unit === "string" && unit.trim()
          ? unit.trim()
          : numericHabit
            ? habit.unit
            : null;
    } else if (numericHabit && !habit.isNumeric) {
      return NextResponse.json({ error: "A unit is required for numeric habits." }, { status: 400 });
    }

    if (frequency !== undefined) {
      updateData.frequency = frequency;
    }

    if (targetDays !== undefined) {
      if (frequency === "CUSTOM" && (!Array.isArray(targetDays) || targetDays.length === 0)) {
        return NextResponse.json(
          { error: "At least one target day must be selected for custom frequency." },
          { status: 400 }
        );
      }
      updateData.targetDays = Array.isArray(targetDays) ? targetDays : [];
    }

    if (isPublic !== undefined) {
      updateData.isPublic = Boolean(isPublic);
      if (isPublic && !habit.publicId) {
        updateData.publicId = randomBytes(8).toString("hex");
      }
    }

    if (archivedAt !== undefined) {
      updateData.archivedAt = archivedAt ? new Date(archivedAt) : null;
    }

    if (goalType !== undefined) {
      updateData.goalType = goalType;
    }

    if (goalTarget !== undefined) {
      updateData.goalTarget = goalTarget !== null && goalTarget !== "" ? Number(goalTarget) : null;
    }

    if (groupId !== undefined) {
      updateData.groupId = groupId || null;
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: habit.id },
      data: updateData,
    });

    return NextResponse.json({ habit: updatedHabit });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/habits/[id-or-slug]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const { id: habitIdOrSlug } = await params;

    const habit = await prisma.habit.findFirst({
      where: {
        userId: { in: [userId, "demo-user-id"] },
        OR: [{ id: habitIdOrSlug }, { slug: habitIdOrSlug }],
      },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    // Ownership check
    // Delete habit (cascades logs via Prisma schema onDelete: Cascade)
    await prisma.habit.delete({
      where: { id: habit.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}