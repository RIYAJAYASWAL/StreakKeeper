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
    const { timezone } = body;

    if (!timezone || typeof timezone !== "string") {
      return NextResponse.json({ message: "Invalid timezone." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { timezone },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
