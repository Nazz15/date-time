// service-worker.js — TimezoneBudy PWA
// Strategy: cache-first for static assets (CSS/JS/icons), network-first for
// HTML pages (so live clocks/weather/content stay fresh), with an offline fallback.

const CACHE_VERSION = 'v1';
const STATIC_CACHE = 'tzbuddy-static-' + CACHE_VERSION;
const PAGES_CACHE = 'tzbuddy-pages-' + CACHE_VERSION;

// Core assets to pre-cache on install — shared across every page
const PRECACHE_URLS = [
  '/',
  '/converter.html',
  '/sunmoon.html',
  '/weather.html',
  '/tools.html',
  '/about.html',
  '/contact.html',
  '/privacy-policy.html',
  '/terms.html',
  '/main.css',
  '/location.css',
  '/footer.css',
  '/util.js',
  '/clock.js',
  '/locations-menu.js',
  '/locations-data.json',
  '/cities.js',
  '/manifest.json',
  '/offline.html'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      return cache.addAll(PRECACHE_URLS).catch(function (err) {
        console.warn('Some assets failed to precache:', err);
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          return key !== STATIC_CACHE && key !== PAGES_CACHE;
        }).map(function (key) {
          return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  const isStaticAsset = /\.(css|js|json|png|jpg|svg|woff2?)$/.test(url.pathname);
  const isHTMLPage = event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');

  if (isStaticAsset) {
    // Cache-first: fast repeat loads, these rarely change
    event.respondWith(
      caches.match(event.request).then(function (cached) {
        if (cached) return cached;
        return fetch(event.request).then(function (response) {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(function (cache) { cache.put(event.request, clone); });
          }
          return response;
        });
      })
    );
    return;
  }

  if (isHTMLPage) {
    // Network-first: pages should stay fresh (live clocks, content updates),
    // fall back to cache, then to offline page if nothing is available
    event.respondWith(
      fetch(event.request).then(function (response) {
        if (response.ok) {
          const clone = response.clone();
          caches.open(PAGES_CACHE).then(function (cache) { cache.put(event.request, clone); });
        }
        return response;
      }).catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match('/offline.html');
        });
      })
    );
  }
});
