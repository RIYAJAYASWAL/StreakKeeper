"use client";

import { useState, useEffect } from "react";
import { initOfflineSyncListener, getOfflineQueue } from "@/lib/offlineQueue";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    setQueuedCount(getOfflineQueue().length);

    const handleOnline = () => {
      setIsOnline(true);
      setQueuedCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setQueuedCount(getOfflineQueue().length);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initialize offline sync listener for queue replaying
    const cleanupSync = initOfflineSyncListener();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      cleanupSync();
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="w-full bg-[#3F3F52] text-[#F4F4F8] py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all z-50 border-b border-[#52526E]"
    >
      <WifiOff className="w-4 h-4 text-[#FF9F1C] shrink-0" />
      <span>
        You're offline — changes will sync when reconnected
        {queuedCount > 0 ? ` (${queuedCount} check-off${queuedCount > 1 ? "s" : ""} queued)` : ""}
      </span>
    </div>
  );
}
