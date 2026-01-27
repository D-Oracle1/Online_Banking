// Service Worker for Push Notifications and PWA
const CACHE_NAME = 'sterlingbank-v4';
const STATIC_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => clients.claim())
  );
});

// Handle push notification - Enhanced for mobile
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, icon, badge, data: payload } = data;

    const options = {
      body: body || 'You have a new notification',
      icon: icon || '/icon-192.png',
      badge: badge || '/icon-96.png',
      tag: payload?.tag || 'notification',
      data: payload || {},
      requireInteraction: false,
      vibrate: [200, 100, 200],
      // Mobile-specific enhancements
      silent: false,
      renotify: true,
      timestamp: Date.now(),
      // Actions for mobile notification
      actions: payload?.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Notification', options)
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
});

// Handle notification click - Enhanced for mobile
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/';
  const targetUrl = new URL(url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Try to find an existing window with the target URL
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }

      // If there's any window open, navigate it to the target URL
      if (clientList.length > 0 && 'navigate' in clientList[0]) {
        return clientList[0].focus().then(() => clientList[0].navigate(targetUrl));
      }

      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification action clicks (for mobile action buttons)
self.addEventListener('notificationclick', (event) => {
  if (event.action) {
    console.log('[Service Worker] Notification action clicked:', event.action);
    // Handle specific actions here if needed
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed', event.notification.tag);
});

// Cache strategy: Skip HTML pages, cache static assets only
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests entirely - let browser handle them
  if (request.method !== 'GET') {
    return;
  }

  // Parse URL safely
  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    // Invalid URL, let browser handle it
    return;
  }

  // FIRST: Skip chrome-extension, chrome, moz-extension, and other non-http(s) protocols
  // Don't call event.respondWith - just return to let browser handle natively
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // SECOND: Skip ALL external resources - let browser fetch them directly
  // This avoids CSP issues with fonts, cloudinary, firebase, etc.
  if (url.hostname !== self.location.hostname) {
    // Don't intercept - let the browser handle external requests natively
    return;
  }

  // Skip HTML navigation requests - let them go directly to network
  // This prevents serving stale HTML and fixes mobile loading issues
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    return; // Let browser handle navigation
  }

  // API calls - network first, then cache (same-origin only)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          }).catch(() => {
            // Silently fail if caching fails
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets only (images, fonts, CSS, JS) - cache first (same-origin only)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200) {
          return response;
        }

        // Only cache same-origin responses (basic type)
        if (response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          }).catch(() => {
            // Silently fail if caching fails
          });
        }

        return response;
      }).catch(() => {
        // Return cached version if fetch fails
        return caches.match(request);
      });
    })
  );
});
