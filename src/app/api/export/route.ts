import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateCurrentStreak, calculateLongestStreak } from "@/lib/streakEngine";
import { jsPDF } from "jspdf";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "demo-user-id";
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "csv").toLowerCase();

    // Fetch user info
    let user = {
      name: session.user.name || "StreakKeeper User",
      email: session.user.email || "user@example.com",
    };

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (dbUser) {
        user = { name: dbUser.name, email: dbUser.email };
      }
    } catch {
      // Graceful fallback
    }

    // Fetch user's active habits and logs
    let rawHabits: any[] = [];
    try {
      rawHabits = await prisma.habit.findMany({
        where: {
          userId: { in: [userId, "demo-user-id"] },
          archivedAt: null,
        },
        include: {
          group: true,
          habitLogs: {
            orderBy: { date: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      rawHabits = [];
    }

    const habits = rawHabits.map((habit) => {
      const formattedLogs = habit.habitLogs.map((l: any) => ({
        date: new Date(l.date).toISOString().split("T")[0],
        status: l.status,
        loggedAt: l.loggedAt,
      }));

      const currentStreak = calculateCurrentStreak(
        formattedLogs,
        habit.frequency as any,
        habit.targetDays,
        "UTC"
      );

      const longestStreak = calculateLongestStreak(
        formattedLogs,
        habit.frequency as any,
        habit.targetDays
      );

      return {
        ...habit,
        formattedLogs,
        currentStreak,
        longestStreak,
      };
    });

    // 1. JSON Export
    if (format === "json") {
      const jsonOutput = {
        user,
        exportedAt: new Date().toISOString(),
        habits: habits.map((h) => ({
          id: h.id,
          name: h.name,
          description: h.description,
          frequency: h.frequency,
          group: h.group ? { name: h.group.name, color: h.group.color } : null,
          currentStreak: h.currentStreak,
          longestStreak: h.longestStreak,
          logs: h.formattedLogs,
        })),
      };

      return new NextResponse(JSON.stringify(jsonOutput, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": 'attachment; filename="streakkeeper-progress.json"',
        },
      });
    }

    // 2. PDF Export
    if (format === "pdf") {
      const doc = new jsPDF();

      // Background Page
      doc.setFillColor(21, 21, 30);
      doc.rect(0, 0, 210, 297, "F");

      // Top Accent Header
      doc.setFillColor(255, 107, 107);
      doc.rect(0, 0, 210, 4, "F");

      // Header Text
      doc.setTextColor(244, 244, 248);
      doc.setFontSize(18);
      doc.text("StreakKeeper — Progress Summary Report", 14, 20);

      doc.setFontSize(9);
      doc.setTextColor(148, 148, 168);
      doc.text(
        `User: ${user.name} (${user.email})   |   Exported: ${new Date().toLocaleDateString()}`,
        14,
        28
      );

      // Divider Line
      doc.setDrawColor(35, 35, 54);
      doc.line(14, 33, 196, 33);

      let y = 42;

      habits.forEach((h) => {
        if (y > 250) {
          doc.addPage();
          doc.setFillColor(21, 21, 30);
          doc.rect(0, 0, 210, 297, "F");
          y = 20;
        }

        // Habit Box
        doc.setFillColor(26, 26, 38);
        doc.rect(14, y, 182, 40, "F");
        doc.setDrawColor(35, 35, 54);
        doc.rect(14, y, 182, 40, "S");

        // Group Accent
        const accentColor = h.group?.color || "#8B5CF6";
        const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(accentColor);
        if (hexMatch) {
          const r = parseInt(hexMatch[1], 16);
          const g = parseInt(hexMatch[2], 16);
          const b = parseInt(hexMatch[3], 16);
          doc.setFillColor(r, g, b);
          doc.rect(14, y, 3, 40, "F");
        }

        // Habit Details
        doc.setFontSize(12);
        doc.setTextColor(244, 244, 248);
        doc.text(h.name, 22, y + 11);

        doc.setFontSize(9);
        doc.setTextColor(148, 148, 168);
        doc.text(
          `Current Streak: ${h.currentStreak} days   |   Longest Streak: ${h.longestStreak} days   |   Frequency: ${h.frequency}`,
          22,
          y + 19
        );

        // Heatmap Label
        doc.text("30-Day Heatmap Visual:", 22, y + 28);

        // Render 30-day simplified heatmap boxes
        const last30Days: string[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          last30Days.push(d.toISOString().split("T")[0]);
        }

        const logMap = new Map<string, string>();
        h.formattedLogs.forEach((l: any) => logMap.set(l.date, l.status));

        let boxX = 72;
        const boxY = y + 24;
        const boxSize = 3.2;
        const gap = 0.8;

        last30Days.forEach((dateStr) => {
          const st = logMap.get(dateStr);
          if (st === "DONE") {
            doc.setFillColor(255, 107, 107); // Coral
          } else if (st === "FROZEN") {
            doc.setFillColor(94, 234, 212); // Frozen Cyan
          } else {
            doc.setFillColor(45, 45, 65); // Muted dark box
          }
          doc.rect(boxX, boxY, boxSize, boxSize, "F");
          boxX += boxSize + gap;
        });

        y += 46;
      });

      const pdfArrayBuffer = doc.output("arraybuffer");
      return new NextResponse(pdfArrayBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="streakkeeper-progress-report.pdf"',
        },
      });
    }

    // 3. CSV Export (Default)
    const csvRows: string[] = ["Habit Name,Date,Status,Streak At Date"];

    habits.forEach((habit) => {
      let streakAtDate = 0;
      habit.formattedLogs.forEach((log: any) => {
        if (log.status === "DONE" || log.status === "FROZEN") {
          streakAtDate++;
        } else {
          streakAtDate = 0;
        }

        const safeName = `"${habit.name.replace(/"/g, '""')}"`;
        csvRows.push(`${safeName},${log.date},${log.status},${streakAtDate}`);
      });
    });

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="streakkeeper-progress.csv"',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export progress data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
