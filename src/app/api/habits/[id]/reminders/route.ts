import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;

    const reminders = await prisma.reminder.findMany({
      where: { habitId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("GET reminders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: habitId } = await params;
    const body = await request.json();
    const { time, daysOfWeek, enabled } = body;

    if (!time || typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: "Invalid time format. Expected 'HH:MM' 24hr format." },
        { status: 400 }
      );
    }

    if (!Array.isArray(daysOfWeek)) {
      return NextResponse.json(
        { error: "daysOfWeek must be an array of day codes." },
        { status: 400 }
      );
    }

    const reminder = await prisma.reminder.create({
      data: {
        habitId,
        time,
        daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
        enabled: enabled ?? true,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("POST reminder error:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
