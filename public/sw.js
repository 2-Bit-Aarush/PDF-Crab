const CACHE_NAME = 'pdf-crab-static-v1';

// Static resources to cache on install
const STATIC_ASSETS = [
  '/',
  '/login',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/logo.svg',
  '/Banner.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Define patterns that MUST NOT be cached
  const isApi = url.pathname.startsWith('/api/');
  const isAuth = url.pathname.startsWith('/auth/') || url.pathname.includes('/auth/callback') || url.pathname.includes('/auth/signout');
  const isSupabase = url.host.includes('supabase.co');
  const isNextData = url.pathname.includes('/_next/data/');
  const isNonGet = request.method !== 'GET';

  // Do NOT cache dynamic API requests, authentication, Supabase backend traffic, or non-GET requests
  if (isApi || isAuth || isSupabase || isNextData || isNonGet) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return a raw JSON error when offline for API routes
        if (isApi) {
          return new Response(JSON.stringify({ error: 'Offline. Please check your internet connection.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        // Let the fetch trigger default offline browser action
        return Promise.reject('Offline');
      })
    );
    return;
  }

  // Cache-first strategy for static assets (Next.js chunks, fonts, public images, icons)
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.otf') ||
    url.pathname.endsWith('.webmanifest');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-first strategy for page routes (app shell pages like dashboard, settings)
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Cache the updated page response
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fall back to cache if offline
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Default fallback page if offline
          return caches.match('/login') || caches.match('/');
        });
      })
  );
});
