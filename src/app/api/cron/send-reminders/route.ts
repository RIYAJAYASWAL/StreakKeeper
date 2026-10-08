import { NextResponse } from "next/server";
import webpush from "web-push";
import prisma from "@/lib/prisma";

export const revalidate = 0; // Dynamic API Route

// Setup VAPID keys for web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:support@streakkeeper.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * Helper to get user's local time (HH:MM), day of week code (MON..SUN), and date string (YYYY-MM-DD)
 */
function getLocalTimeAndDay(timezone: string = "UTC"): {
  timeStr: string;
  dayCode: string;
  todayDateStr: string;
  totalMinutes: number;
} {
  try {
    const now = new Date();

    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = timeFormatter.formatToParts(now);
    let hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    if (hour === 24) hour = 0;

    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const totalMinutes = hour * 60 + minute;

    const dayFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
    });
    const dayCode = dayFormatter.format(now).toUpperCase(); // e.g. "MON"

    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayDateStr = dateFormatter.format(now); // YYYY-MM-DD

    return { timeStr, dayCode, todayDateStr, totalMinutes };
  } catch {
    const now = new Date();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const dayCode = days[now.getUTCDay()];
    const todayDateStr = now.toISOString().split("T")[0];
    return { timeStr, dayCode, todayDateStr, totalMinutes: hour * 60 + minute };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const headerSecret = request.headers.get("x-cron-secret");
    const querySecret = searchParams.get("secret");

    const expectedSecret = process.env.CRON_SECRET || "streakkeeper_cron_secret_key_2026";

    const isAuthorized =
      (authHeader && authHeader === `Bearer ${expectedSecret}`) ||
      headerSecret === expectedSecret ||
      querySecret === expectedSecret;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized cron execution" },
        { status: 401 }
      );
    }

    // Fetch all active, enabled reminders with habit and user details
    const reminders = await prisma.reminder.findMany({
      where: {
        enabled: true,
        habit: {
          archivedAt: null,
        },
      },
      include: {
        habit: {
          include: {
            user: {
              include: {
                pushSubscriptions: true,
              },
            },
          },
        },
      },
    });

    let checkedCount = 0;
    let sentCount = 0;
    let failedCount = 0;
    const details: Array<{ reminderId: string; habitName: string; status: string }> = [];

    for (const reminder of reminders) {
      checkedCount++;
      const habit = reminder.habit;
      const user = habit.user;
      const timezone = user.timezone || "UTC";

      const { timeStr, dayCode, todayDateStr, totalMinutes } = getLocalTimeAndDay(timezone);

      // Check if reminder applies to today's day of week
      if (!reminder.daysOfWeek.includes(dayCode)) {
        continue;
      }

      // Parse reminder HH:MM into total minutes
      const [rHourStr, rMinStr] = reminder.time.split(":");
      const rHour = parseInt(rHourStr || "0", 10);
      const rMin = parseInt(rMinStr || "0", 10);
      const reminderTotalMinutes = rHour * 60 + rMin;

      // Check if reminder matches current time window (exact match or within 15 mins)
      const minuteDiff = Math.abs(totalMinutes - reminderTotalMinutes);
      const isTimeMatch = timeStr === reminder.time || minuteDiff < 15;

      if (!isTimeMatch) {
        continue;
      }

      // Check if already sent today
      if (reminder.lastSentAt) {
        const { todayDateStr: lastSentDateStr } = getLocalTimeAndDay(timezone);
        const lastSentIso = reminder.lastSentAt.toISOString().split("T")[0];
        if (lastSentIso === todayDateStr) {
          continue; // Already sent today
        }
      }

      // User must have push subscriptions
      if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
        details.push({ reminderId: reminder.id, habitName: habit.name, status: "No subscriptions" });
        continue;
      }

      // Construct notification payload
      const notificationPayload = JSON.stringify({
        title: "Habit Reminder ⏰",
        body: `Time for: ${habit.name} 🔥`,
        icon: "/icon-192.png",
        url: `/habits/${habit.id}`,
      });

      let sentToUser = false;
      const subsToDelete: string[] = [];

      for (const sub of user.pushSubscriptions) {
        try {
          const pushSubscriptionObject = {
            endpoint: sub.endpoint,
            keys: sub.keys as { p256dh: string; auth: string },
          };

          await webpush.sendNotification(pushSubscriptionObject, notificationPayload);
          sentToUser = true;
          sentCount++;
        } catch (err: any) {
          failedCount++;
          console.error(`Failed to send web push to ${sub.endpoint}:`, err);
          // If subscription expired or invalid (404/410), mark for deletion
          if (err.statusCode === 404 || err.statusCode === 410) {
            subsToDelete.push(sub.id);
          }
        }
      }

      // Clean up invalid subscriptions
      if (subsToDelete.length > 0) {
        await prisma.pushSubscription.deleteMany({
          where: { id: { in: subsToDelete } },
        });
      }

      // Update lastSentAt for the reminder if successfully dispatched
      if (sentToUser) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: { lastSentAt: new Date() },
        });

        details.push({ reminderId: reminder.id, habitName: habit.name, status: "Notification Sent" });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        checkedCount,
        sentCount,
        failedCount,
        details,
      },
    });
  } catch (error: any) {
    console.error("Cron send-reminders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process reminder cron" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
