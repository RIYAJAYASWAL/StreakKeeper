import { NextResponse } from "next/server";
import webpush from "web-push";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (typeof body.endpoint !== "string" || !body.endpoint) {
      return NextResponse.json({ error: "A subscription endpoint is required." }, { status: 400 });
    }

    const userId = session.user.id || "demo-user-id";
    const subscription = await prisma.pushSubscription.findFirst({
      where: { endpoint: body.endpoint, userId },
    });
    if (!subscription) {
      return NextResponse.json({ error: "Saved push subscription was not found." }, { status: 404 });
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("POST /api/push/test: VAPID keys are not configured");
      return NextResponse.json({ error: "Web Push is not configured on the server." }, { status: 503 });
    }

    webpush.setVapidDetails(
      "mailto:support@streakkeeper.app",
      vapidPublicKey,
      vapidPrivateKey
    );
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys as { p256dh: string; auth: string },
      },
      JSON.stringify({
        title: "StreakKeeper Test Notification",
        body: "Web push notifications are working.",
        icon: "/icons/icon-192.png",
        url: "/dashboard",
      })
    );

    console.log("POST /api/push/test: notification sent");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/push/test error:", error);
    return NextResponse.json({ error: "Failed to send test notification." }, { status: 500 });
  }
}
