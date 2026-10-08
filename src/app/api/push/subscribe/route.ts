import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const body = await request.json();
    const { subscription } = body;

    const endpoint = subscription?.endpoint || body?.endpoint;
    const keys = subscription?.keys || body?.keys;

    if (!endpoint || !keys) {
      return NextResponse.json(
        { error: "Invalid subscription payload. Endpoint and keys are required." },
        { status: 400 }
      );
    }

    // Upsert subscription for user
    const pushSub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        keys,
      },
      create: {
        userId,
        endpoint,
        keys,
      },
    });

    return NextResponse.json({ success: true, subscription: pushSub }, { status: 201 });
  } catch (error) {
    console.error("POST /api/push/subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to save push subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint, userId },
      });
    } else {
      await prisma.pushSubscription.deleteMany({
        where: { userId },
      });
    }

    return NextResponse.json({ success: true, message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("DELETE /api/push/subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const count = await prisma.pushSubscription.count({
      where: { userId },
    });

    return NextResponse.json({ subscribed: count > 0 });
  } catch (error) {
    console.error("GET /api/push/subscribe error:", error);
    return NextResponse.json({ subscribed: false });
  }
}
