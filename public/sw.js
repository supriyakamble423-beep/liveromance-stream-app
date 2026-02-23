/**
 * Global Love PWA Service Worker
 * Optimized for auto-updates and basic asset caching.
 */

const CACHE_NAME = 'global-love-v2'; // Incrementing version
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/global',
  '/interest',
  '/wallet',
  '/host-p',
  '/trends'
];

// Install Event: Caching the app shell
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become active
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching assets');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all clients immediately
});

// Fetch Event: Cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  // Skip caching for dynamic requests (Firebase, Ads, external media)
  const isDynamic = 
    event.request.url.includes('firebase') || 
    event.request.url.includes('highperformanceformat') ||
    event.request.url.includes('highrevenuegate') ||
    event.request.url.includes('picsum.photos') ||
    event.request.url.includes('dicebear') ||
    event.request.method !== 'GET';

  if (isDynamic) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Message Event: Listen for update commands from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
