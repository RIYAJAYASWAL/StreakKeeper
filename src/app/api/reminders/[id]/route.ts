import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reminderId } = await params;
    const body = await request.json();
    const { enabled, time, daysOfWeek } = body;

    const dataToUpdate: Record<string, unknown> = {};
    if (typeof enabled === "boolean") dataToUpdate.enabled = enabled;
    if (typeof time === "string" && /^\d{2}:\d{2}$/.test(time)) dataToUpdate.time = time;
    if (Array.isArray(daysOfWeek)) dataToUpdate.daysOfWeek = daysOfWeek;

    const updated = await prisma.reminder.update({
      where: { id: reminderId },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH reminder error:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reminderId } = await params;

    await prisma.reminder.delete({
      where: { id: reminderId },
    });

    return NextResponse.json({ success: true, message: "Reminder deleted" });
  } catch (error) {
    console.error("DELETE reminder error:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
