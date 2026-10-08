import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/groups/[id]
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
    const { id: groupId } = await params;

    const group = await prisma.habitGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.userId !== userId && group.userId !== "demo-user-id") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, color } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ error: "Group name cannot be empty." }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (color !== undefined) {
      if (typeof color !== "string" || !color.trim()) {
        return NextResponse.json({ error: "Color cannot be empty." }, { status: 400 });
      }
      updateData.color = color.trim();
    }

    const updated = await prisma.habitGroup.update({
      where: { id: groupId },
      data: updateData,
    });

    return NextResponse.json({ group: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update group";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/groups/[id]
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
    const { id: groupId } = await params;

    const group = await prisma.habitGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.userId !== userId && group.userId !== "demo-user-id") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.habitGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete group";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
