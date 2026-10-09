import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = "demo-user-id";

  console.log("🌱 Seeding StreakKeeper dummy data...");

  // 1. Create Demo User
  await prisma.user.upsert({
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

  // Clear existing habits for clean seed
  await prisma.habit.deleteMany({ where: { userId } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 2. Habit 1: Morning Meditation (42-day active streak)
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

  const logs1 = [];
  for (let i = 41; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    logs1.push({
      habitId: habit1.id,
      date: d,
      status: "DONE" as const,
      loggedAt: d,
    });
  }
  await prisma.habitLog.createMany({ data: logs1 });

  // 3. Habit 2: Deep Work Coding (Custom Mon/Wed/Fri with 1 Frozen day)
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
    const isYesterday = i === 1;
    const status = isYesterday ? "FROZEN" : "DONE";
    logs2.push({
      habitId: habit2.id,
      date: d,
      status: status as "DONE" | "FROZEN",
      loggedAt: d,
    });
  }
  await prisma.habitLog.createMany({ data: logs2 });

  // 4. Habit 3: Evening Reading (18-day active streak)
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
    logs3.push({
      habitId: habit3.id,
      date: d,
      status: "DONE" as const,
      loggedAt: d,
    });
  }
  await prisma.habitLog.createMany({ data: logs3 });

  // 5. Habit 4: 100-Day Milestone Streak
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
    logs4.push({
      habitId: habit4.id,
      date: d,
      status: "DONE" as const,
      loggedAt: d,
    });
  }
  await prisma.habitLog.createMany({ data: logs4 });

  console.log("✅ Seed completed successfully! 4 habits with streaks created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
