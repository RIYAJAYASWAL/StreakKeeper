"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HabitProgressRefreshListener() {
  const router = useRouter();

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "streakkeeper_habit_progress_updated") {
        router.refresh();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [router]);

  return null;
}