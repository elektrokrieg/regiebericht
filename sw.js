// Service Worker – Elektro Krieg Regiebericht
// Версия кэша – увеличивайте при обновлении файлов
const CACHE_NAME = 'regiebericht-v4';

const ASSETS = [
  'https://elektrokrieg.github.io/regiebericht/',
  'https://elektrokrieg.github.io/regiebericht/index.html',
  'https://elektrokrieg.github.io/regiebericht/manifest.json',
  'https://elektrokrieg.github.io/regiebericht/icon-192.png',
  'https://elektrokrieg.github.io/regiebericht/icon-512.png',
  'https://elektrokrieg.github.io/regiebericht/apple-touch-icon.png',
  // External libraries – cached on first load
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(e => console.warn('Cache miss:', url, e)))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Skip waiting when requested by client (auto-update)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: cache-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('https://elektrokrieg.github.io/regiebericht/index.html');
        }
      });
    })
  );
});
