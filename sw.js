// Service Worker para TasaReal PWA
const CACHE_NAME = 'tasareal-v1.0.0';
const STATIC_CACHE = 'tasareal-static-v1.0.0';
const DYNAMIC_CACHE = 'tasareal-dynamic-v1.0.0';

// Recursos a cachear inicialmente
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/calculator.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Recursos externos que pueden cambiar (no cachear agresivamente)
const DYNAMIC_ASSETS = [
  '/articulo-tea-vs-tna.html'
];

// Instalar el Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
  self.skipWaiting();
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estrategia Cache First para recursos estáticos
  if (STATIC_ASSETS.includes(request.url) || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((response) => {
              // Cachear la respuesta si es exitosa
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            });
        })
        .catch(() => {
          // Fallback para recursos críticos
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
        })
    );
  }
  // Estrategia Network First para contenido dinámico
  else if (DYNAMIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  }
  // Estrategia Stale While Revalidate para otros recursos
  else {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        })
    );
  }
});

// Manejar mensajes desde el cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Limpiar cache cuando llegue a un límite
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanOldCaches();
  }
});

function cleanOldCaches() {
  const maxCacheSize = 50; // Máximo 50 items por cache

  caches.open(DYNAMIC_CACHE)
    .then((cache) => {
      return cache.keys()
        .then((keys) => {
          if (keys.length > maxCacheSize) {
            // Eliminar entradas antiguas (LRU simple)
            const keysToDelete = keys.slice(0, keys.length - maxCacheSize);
            return Promise.all(
              keysToDelete.map((key) => cache.delete(key))
            );
          }
        });
    });
}
