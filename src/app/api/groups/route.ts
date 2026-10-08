import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/groups
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";

    const groups = await prisma.habitGroup.findMany({
      where: {
        userId: { in: [userId, "demo-user-id"] },
      },
      include: {
        _count: {
          select: { habits: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ groups }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch groups";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/groups
export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const body = await request.json().catch(() => ({}));
    const { name, color } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required." },
        { status: 400 }
      );
    }

    const groupColor = color && typeof color === "string" ? color.trim() : "#FF6B6B";

    // Ensure user exists
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

    const group = await prisma.habitGroup.create({
      data: {
        userId,
        name: name.trim(),
        color: groupColor,
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create group";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
