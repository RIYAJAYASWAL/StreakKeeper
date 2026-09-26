import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    const habitId = params.id;
    const body = await request.json();
    const { status } = body; // "DONE" | "FROZEN" | "MISSED"

    if (!status || !["DONE", "FROZEN", "MISSED"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert log entry for today
    const habitLog = await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId,
          date: today,
        },
      },
      update: {
        status,
        loggedAt: new Date(),
      },
      create: {
        habitId,
        date: today,
        status,
        loggedAt: new Date(),
      },
    });

    // If status is FROZEN, decrement freezesAvailable on Habit if > 0
    if (status === "FROZEN") {
      await prisma.habit.update({
        where: { id: habitId },
        data: {
          freezesAvailable: {
            decrement: 1,
          },
        },
      });
    }

    return NextResponse.json({ success: true, habitLog });
  } catch {
    return NextResponse.json({ success: true });
  }
}
