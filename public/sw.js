const CACHE_NAME = "streakkeeper-cache-v1";

const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// 1. Install Event: Pre-cache core shell & assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Stale-While-Revalidate / Network-First with Cache Fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignore non-GET requests and API calls for caching (let API calls go to network or queue)
  if (request.method !== "GET" || request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // Try network first
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // Fallback to cache if offline
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Fallback to cached dashboard if navigating
        if (request.mode === "navigate") {
          return cache.match("/dashboard");
        }
        throw error;
      }
    })
  );
});

// 4. Web Push Notification Handlers
self.addEventListener("push", function (event) {
  if (event.data) {
    let payload = {};
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: "StreakKeeper Reminder", body: event.data.text() };
    }

    const title = payload.title || "StreakKeeper Reminder";
    const options = {
      body: payload.body || "Time to check off your habit! 🔥",
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-192.png",
      data: {
        url: payload.url || "/dashboard",
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
