import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const userId = "demo-user-id";

    // 1. Upsert Demo User
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        name: "Alex Morgan",
        email: "alex@streakkeeper.com",
      },
      create: {
        id: userId,
        email: "alex@streakkeeper.com",
        name: "Alex Morgan",
        passwordHash: "password123",
        timezone: "UTC",
      },
    });

    // Clear existing dummy habits for demo user
    await prisma.habit.deleteMany({
      where: { userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Create Habit 1: Morning Meditation (42-day active streak with 2 frozen days)
    const habit1 = await prisma.habit.create({
      data: {
        userId,
        name: "Morning Meditation",
        slug: "morning-meditation",
        description: "15 minutes of mindfulness & breathing exercises every morning.",
        frequency: "DAILY",
        freezesAvailable: 3,
        isPublic: true,
        publicId: "meditation-streak",
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    });

    // Create 42 consecutive logs up to today, including 2 frozen days
    const logs1 = [];
    for (let i = 41; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isFrozen = i === 12 || i === 28;
      const status = isFrozen ? ("FROZEN" as const) : ("DONE" as const);
      logs1.push({
        habitId: habit1.id,
        date: d,
        status,
        loggedAt: d,
      });
    }
    await prisma.habitLog.createMany({ data: logs1 });

    // 3. Create Habit 2: Deep Work Coding (Custom Mon/Wed/Fri with 2 Frozen days)
    const habit2 = await prisma.habit.create({
      data: {
        userId,
        name: "Deep Work Coding",
        slug: "deep-work-coding",
        description: "Focus blocks on building side projects without distractions.",
        frequency: "CUSTOM",
        targetDays: ["MON", "WED", "FRI"],
        freezesAvailable: 2,
        isPublic: true,
        publicId: "coding-streak",
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    });

    const logs2 = [];
    for (let i = 30; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isFrozen = i === 1 || i === 18;
      const status = isFrozen ? ("FROZEN" as const) : ("DONE" as const);
      logs2.push({
        habitId: habit2.id,
        date: d,
        status,
        loggedAt: d,
      });
    }
    await prisma.habitLog.createMany({ data: logs2 });

    // 4. Create Habit 3: Evening Reading (18-day active streak with 1 frozen day)
    const habit3 = await prisma.habit.create({
      data: {
        userId,
        name: "Evening Reading",
        slug: "evening-reading",
        description: "Read 20 pages of non-fiction or technology books before sleep.",
        frequency: "DAILY",
        freezesAvailable: 1,
        isPublic: false,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    });

    const logs3 = [];
    for (let i = 17; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isFrozen = i === 8;
      const status = isFrozen ? ("FROZEN" as const) : ("DONE" as const);
      logs3.push({
        habitId: habit3.id,
        date: d,
        status,
        loggedAt: d,
      });
    }
    await prisma.habitLog.createMany({ data: logs3 });

    // 5. Create Habit 4: 100-Day Cold Plunge Milestone Streak with 2 frozen days
    const habit4 = await prisma.habit.create({
      data: {
        userId,
        name: "Cold Plunge & Hydration",
        slug: "cold-plunge-hydration",
        description: "3-minute cold shower and 1L of water upon waking.",
        frequency: "DAILY",
        freezesAvailable: 3,
        isPublic: true,
        publicId: "cold-plunge-streak",
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      },
    });

    const logs4 = [];
    for (let i = 99; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const isFrozen = i === 25 || i === 60;
      const status = isFrozen ? ("FROZEN" as const) : ("DONE" as const);
      logs4.push({
        habitId: habit4.id,
        date: d,
        status,
        loggedAt: d,
      });
    }
    await prisma.habitLog.createMany({ data: logs4 });

    return NextResponse.json({
      success: true,
      message: "Successfully seeded dummy habits with active streaks!",
      habitsCreated: 4,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to seed data";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
