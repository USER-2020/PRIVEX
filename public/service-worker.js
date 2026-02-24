importScripts("https://js.pusher.com/beams/service-worker.js");

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (error) {
    payload = { title: "Notificacion", body: event.data.text() };
  }

  if (!payload || payload.webpush !== true) return;

  const title = payload.title || "Notificacion";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    data: {
      ...(payload.data || {}),
      url: payload.url || payload.data?.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

const CACHE_NAME = "privexx-pwa-v1";
const CORE_ASSETS = ["/", "/manifest.json", "/pwa.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isStatic =
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font";

  if (isSameOrigin && isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  // TEMP DEBUG: verify payload structure in SW console.
  console.log("SW notification data:", event.notification?.data);
  const target =
    event.notification?.data?.url ||
    event.notification?.data?.data?.url ||
    "/";
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          if ("focus" in client) {
            client.focus();
            if (client.url !== target && "navigate" in client) {
              return client.navigate(target);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(target);
        }
      })
  );
});
