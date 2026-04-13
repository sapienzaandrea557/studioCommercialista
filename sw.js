const CACHE_NAME = 'studio-sapienza-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/commercialista-roma.html',
  '/css/style.css',
  '/js/main.js',
  '/js/booking-availability.js',
  '/img/logo.svg',
  '/site.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
