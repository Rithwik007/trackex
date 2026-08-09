const CACHE_NAME = 'trackex-shell-v2';

self.addEventListener('install', () => {
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Purge ALL old caches (including v1 that caused blank screens)
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;

  // Skip non-GET and API requests
  if (request.method !== 'GET' || request.url.includes('/api/')) return;

  // Navigation requests (HTML pages): NETWORK-FIRST
  // Always fetch fresh index.html so new Vite hashed bundles resolve correctly.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (JS/CSS/images): STALE-WHILE-REVALIDATE
  // Serve from cache instantly, but update cache in background for next load.
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    )
  );
});
