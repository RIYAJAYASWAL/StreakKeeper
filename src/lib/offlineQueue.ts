/**
 * Offline Queue Module for StreakKeeper
 * 
 * Manages an in-localStorage queue for habit check-offs recorded while offline (navigator.onLine === false).
 * Automatically replays queued check-offs against POST /api/habits/[id]/logs when network connection is restored.
 */

export interface QueuedCheckoff {
  id: string;
  habitId: string;
  date: string;
  timestamp: number;
}

const STORAGE_KEY = "streakkeeper_offline_queue";
const PROGRESS_UPDATED_KEY = "streakkeeper_habit_progress_updated";

export function notifyHabitProgressChanged(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_UPDATED_KEY, String(Date.now()));
  } catch {
    // Ignore unavailable local storage
  }
}

/**
 * Retrieve current queued offline check-offs from localStorage
 */
export function getOfflineQueue(): QueuedCheckoff[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add a habit check-off to the offline queue
 */
export function enqueueOfflineCheckoff(habitId: string, date?: string): QueuedCheckoff[] {
  if (typeof window === "undefined") return [];
  const queue = getOfflineQueue();
  const dateStr = date || new Date().toISOString().split("T")[0];

  // Prevent duplicate entries for same habit & date
  const exists = queue.some((item) => item.habitId === habitId && item.date === dateStr);
  if (!exists) {
    const newItem: QueuedCheckoff = {
      id: `${habitId}_${dateStr}_${Date.now()}`,
      habitId,
      date: dateStr,
      timestamp: Date.now(),
    };
    queue.push(newItem);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error("Failed to save to offline queue", e);
    }
  }
  return queue;
}

/**
 * Clear the offline queue
 */
export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Replay queued check-offs against the server POST /api/habits/[id]/logs API
 */
export async function syncOfflineQueue(): Promise<{ syncedCount: number; errors: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { syncedCount: 0, errors: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, errors: 0 };
  }

  let syncedCount = 0;
  let errors = 0;
  const remainingQueue: QueuedCheckoff[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(`/api/habits/${item.habitId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: item.date,
          status: "DONE",
        }),
      });

      if (res.ok) {
        syncedCount++;
      } else {
        remainingQueue.push(item);
        errors++;
      }
    } catch {
      remainingQueue.push(item);
      errors++;
    }
  }

  if (syncedCount > 0) notifyHabitProgressChanged();

  try {
    if (remainingQueue.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}

  return { syncedCount, errors };
}

/**
 * Initializes automatic sync on window 'online' event
 */
export function initOfflineSyncListener(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    syncOfflineQueue();
  };

  window.addEventListener("online", handleOnline);

  // If already online and queue has items, attempt sync
  if (navigator.onLine) {
    syncOfflineQueue();
  }

  return () => {
    window.removeEventListener("online", handleOnline);
  };
}
