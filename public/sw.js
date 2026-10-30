// Shows FCM pushes and keeps the home-screen badge. Caches nothing, on
// purpose: a cached page is a stale page, and MasmasIT needs the network anyway.
//
// No Firebase SDK here: FCM delivers through the standard Push API, and the
// page hands this registration to getToken(), so a plain `push` listener sees
// every message.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Payload: FCM wraps our data message as { data: PushData, from, fcmMessageId }.
// PushData is defined in server/push/fcmService.ts.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const data = payload.data || payload.notification || {};
  const message = {
    title: data.title || 'MasmasIT',
    body: data.body || '',
    link: data.link || '/app/dashboard',
  };
  const shown = self.registration.showNotification(message.title, {
    body: message.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag,
    vibrate: [200, 100, 200],
    data: { url: message.link },
  });
  // The open app plays the chime and shows a toast; a worker has no Audio API.
  const tell = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((windows) => {
      for (const w of windows) w.postMessage({ type: 'push-received', ...message });
      return undefined;
    })
    .catch(() => {});
  event.waitUntil(Promise.all([shown, setBadge(Number(data.badge)), tell]));
});

function setBadge(count) {
  if (!Number.isFinite(count) || !('setAppBadge' in self.navigator)) {
    return Promise.resolve();
  }
  const set = count > 0 ? self.navigator.setAppBadge(count) : self.navigator.clearAppBadge();
  return set.catch(() => {});
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window' });
      for (const client of windows) {
        try {
          await client.focus();
          await client.navigate(url);
          return;
        } catch {
          // Not ours to steer; open a fresh window instead.
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
