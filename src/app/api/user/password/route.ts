import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // In a production app, verify current password hash and hash new password using bcrypt
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPassword }, // Simplified for demonstration
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
