"use client";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputBuffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(outputBuffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputBuffer;
}

export async function ensurePushSubscription(): Promise<PushSubscription> {
  console.log("[push-subscribe] Starting subscription flow");

  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    throw new Error("Web Push Notifications are not supported in this browser.");
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
  if (!vapidKey) {
    throw new Error("NEXT_PUBLIC_VAPID_KEY is not configured.");
  }

  console.log("[push-subscribe] Requesting notification permission");
  const permission = await Notification.requestPermission();
  console.log("[push-subscribe] Notification permission:", permission);
  if (permission !== "granted") {
    throw new Error("Notification permission was denied.");
  }

  console.log("[push-subscribe] Registering /sw.js");
  const registration = await navigator.serviceWorker.register("/sw.js");

  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    console.log("[push-subscribe] Reusing existing browser subscription");
  } else {
    console.log("[push-subscribe] Creating browser subscription");
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(vapidKey),
    });
  }

  console.log("[push-subscribe] Saving subscription to the server");
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription }),
  });
  const result = await response.json();
  if (!response.ok) {
    console.error("[push-subscribe] Server rejected subscription:", result);
    throw new Error(result.error || "Failed to save push subscription on server.");
  }

  console.log("[push-subscribe] Subscription saved successfully");
  return subscription;
}
