importScripts("https://js.pusher.com/beams/service-worker.js");

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
