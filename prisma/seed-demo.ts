// DEMO DATA ONLY: fake sleep/study logs for showing the correlation feature.
// Place at prisma/seed-demo.ts, then run:
//   npx tsx prisma/seed-demo.ts you@example.com
// Adjust field names below if your schema differs (e.g. isNumeric, unit, value).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// [date, sleepHours, studyHours] — sleep is logged on the date you woke up
const DATA: [string, number, number][] = [
  ["2026-09-09", 6.5, 2.5],
  ["2026-09-10", 6.5, 2.0],
  ["2026-09-11", 6.0, 2.0],
  ["2026-09-12", 8.0, 3.5],
  ["2026-09-13", 8.0, 3.5],
  ["2026-09-14", 7.0, 3.0],
  ["2026-09-15", 5.0, 2.0],
  ["2026-09-16", 7.5, 3.5],
  ["2026-09-17", 5.0, 0.5],
  ["2026-09-18", 6.0, 2.0],
  ["2026-09-19", 7.0, 2.5],
  ["2026-09-20", 7.5, 2.5],
  ["2026-09-21", 7.0, 3.0],
  ["2026-09-22", 6.0, 3.5],
  ["2026-09-23", 7.5, 4.0],
  ["2026-09-24", 6.0, 1.5],
  ["2026-09-25", 6.5, 2.5],
  ["2026-09-26", 7.5, 3.0],
  ["2026-09-27", 6.5, 1.5],
  ["2026-09-28", 6.0, 3.0],
  ["2026-09-29", 6.0, 2.5],
  ["2026-09-30", 7.5, 2.0],
  ["2026-10-01", 7.0, 3.5],
  ["2026-10-02", 4.5, 1.0],
  ["2026-10-03", 6.5, 2.0],
  ["2026-10-04", 7.5, 3.0],
  ["2026-10-05", 5.0, 2.0],
  ["2026-10-06", 7.5, 3.5],
  ["2026-10-07", 8.5, 3.5],
  ["2026-10-08", 7.0, 1.5],
];

async function getOrCreateHabit(userId: string, name: string) {
  const existing = await prisma.habit.findFirst({ where: { userId, name } });
  if (existing) return existing;
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "habit";
  const existingSlugs = new Set(
    (await prisma.habit.findMany({ where: { userId }, select: { slug: true } }))
      .map((habit) => habit.slug)
  );
  let slug = baseSlug;
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return prisma.habit.create({
    data: {
      userId,
      name,
      slug,
      frequency: "DAILY",
      isNumeric: true,
      unit: "hours",
    },
  });
}

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: npx tsx prisma/seed-demo.ts <user-email>");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user found with email ${email}`);

  const sleep = await getOrCreateHabit(user.id, "Sleep");
  const study = await getOrCreateHabit(user.id, "Study");

  for (const [date, sleepH, studyH] of DATA) {
    const day = new Date(`${date}T00:00:00.000Z`);
    for (const [habit, value] of [
      [sleep, sleepH],
      [study, studyH],
    ] as const) {
      await prisma.habitLog.upsert({
        where: { habitId_date: { habitId: habit.id, date: day } },
        update: { value, status: "DONE" },
        create: { habitId: habit.id, date: day, status: "DONE", value },
      });
    }
  }

  console.log(`Seeded ${DATA.length} days of Sleep + Study data for ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());