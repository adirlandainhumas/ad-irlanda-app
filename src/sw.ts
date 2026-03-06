/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// Injeta o manifesto de pré-cache gerado pelo VitePWA
precacheAndRoute(self.__WB_MANIFEST);

// ── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'AOGIM Conect';
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: data.body ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url ?? '/' },
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Clique na notificação → abre o app na URL correta ───────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url ?? '/') as string;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client)
          return (client as WindowClient).focus();
      }
      return self.clients.openWindow(self.location.origin + '/#' + url);
    })
  );
});
