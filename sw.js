// Service Worker for Demon Sovereign's Bloodline Webtoon Portal
const CACHE_NAME = 'demon-sovereign-v33';
const STATIC_ASSETS = [
  './index.html',
  './config.js',
  './supabase-client.js',
  './manifest.json',
  './favicon.png',
  './apple-touch-icon.png',
  './images/dsb_badge.webp',
  './images/dsb_badge.png',
  './story/CHAPTER_INDEX.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some assets could not be pre-cached:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;

  // Stream panel images directly from network to avoid browser memory pressure
  if (url.includes('/panels/') || url.includes('/images/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network first for HTML and metadata, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
