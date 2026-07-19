const CACHE_NAME = 'skillhub-v2';
const ASSETS = [
  '/V2/index.html',
  '/V2/css/variables.css',
  '/V2/css/reset.css',
  '/V2/css/components.css',
  '/V2/css/utilities.css',
  '/V2/css/layout.css',
  '/V2/css/pages.css',
  '/V2/js/utils.js',
  '/V2/js/i18n.js',
  '/V2/js/supabase.js',
  '/V2/js/auth.js',
  '/V2/js/ui.js',
  '/V2/js/nav.js',
  '/V2/js/pages.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; }).map(function(key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        if (response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      });
    }).catch(function() {
      return caches.match('/V2/index.html');
    })
  );
});
