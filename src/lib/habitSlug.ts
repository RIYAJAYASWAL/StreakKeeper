import prisma from "@/lib/prisma";

export function slugifyHabitName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "habit";
}

export async function createUniqueHabitSlug(
  userId: string,
  name: string
): Promise<string> {
  const baseSlug = slugifyHabitName(name);
  const existing = await prisma.habit.findMany({
    where: { userId, slug: { startsWith: baseSlug } },
    select: { slug: true },
  });
  const slugs = new Set(existing.map((habit) => habit.slug));
  if (!slugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (slugs.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}
