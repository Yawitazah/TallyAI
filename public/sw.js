// Tally AI service worker — minimum required for PWA install + light offline shell
const CACHE_NAME = 'tally-shell-v13';
const SHELL = [
  '/',
  '/login.html',
  '/css/styles.css?v=13',
  '/js/app.js?v=13',
  '/js/db.js?v=13',
  '/js/pages.js?v=13',
  '/js/charts.js?v=13',
  '/js/utils.js?v=13',
  '/js/voice.js?v=13',
  '/js/seed-data.js?v=13',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(SHELL).catch(() => null))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never cache /api/* — always go to network so data stays fresh.
  if (url.pathname.startsWith('/api/')) return;

  // For navigation (HTML pages): network-first with shell fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match('/login.html').then(r => r || caches.match('/'))
      )
    );
    return;
  }

  // Static assets: cache-first, fall back to network and cache the response
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
