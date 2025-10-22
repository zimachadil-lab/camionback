// Service Worker for CamionBack PWA
// Handles push notifications and offline capabilities
// Version: 2.5 - Disabled API caching completely to prevent stale data

const VERSION = '2.5';
const CACHE_NAME = `camionback-v${VERSION}`;
const STATIC_CACHE = `camionback-static-v${VERSION}`;
const DYNAMIC_CACHE = `camionback-dynamic-v${VERSION}`;

console.log(`[Service Worker] Version ${VERSION} loaded`);

// Core files to cache immediately
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install event - cache core resources
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing version ${VERSION}...`);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Skipping waiting to activate immediately');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Activating version ${VERSION}...`);
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Taking control of all clients');
      return self.clients.claim();
    }).then(() => {
      // Notify clients that a new version is active
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: VERSION
          });
        });
      });
    })
  );
});

// Fetch event - cache-first strategy with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // CRITICAL: Only cache GET requests (POST, PATCH, PUT, DELETE cannot be cached)
  // This prevents "Request method 'PATCH' is unsupported" errors
  if (request.method !== 'GET') {
    console.log(`[Service Worker] Skipping cache for ${request.method} request:`, request.url);
    return; // Let the browser handle non-GET requests normally
  }

  // Handle navigation requests (page loads/refreshes) - serve cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If online, cache the response and return it
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If offline, serve the cached root for SPA to boot
          return caches.match('/').then((cachedResponse) => {
            return cachedResponse || new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html'
              })
            });
          });
        })
    );
    return;
  }

  // API requests - BYPASS service worker completely (network only)
  // Do NOT cache API requests to avoid stale data issues
  if (request.url.includes('/api/')) {
    console.log('[Service Worker] Bypassing cache for API request:', request.url);
    return; // Let the browser handle it directly without service worker interference
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network and cache it
        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Determine which cache to use
          const cacheToUse = request.url.includes('/assets/') || 
                             request.url.includes('.js') || 
                             request.url.includes('.css') || 
                             request.url.includes('.woff') ||
                             request.url.includes('.png') ||
                             request.url.includes('.jpg')
            ? STATIC_CACHE
            : DYNAMIC_CACHE;

          caches.open(cacheToUse).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Network failed, check cache one more time
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  // Use absolute URLs for icons (required for push notifications)
  const baseUrl = self.location.origin;
  
  let notificationData = {
    title: 'CamionBack',
    body: 'Vous avez une nouvelle notification',
    icon: `${baseUrl}/apple-touch-icon.png`,
    badge: `${baseUrl}/icons/notification-badge.png`,
    url: '/'
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = JSON.parse(event.data.text());
      
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        url: data.url || notificationData.url
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    data: { url: notificationData.url },
    requireInteraction: false,
    tag: 'camionback-notification',
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  const showNotificationPromise = self.registration.showNotification(notificationData.title, options)
    .catch((error) => {
      console.error('[Service Worker] Error displaying notification:', error);
      return Promise.reject(error);
    });

  event.waitUntil(showNotificationPromise);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the URL associated with the notification
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync event (for future use)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Placeholder for syncing messages when back online
  console.log('[Service Worker] Syncing messages...');
}
