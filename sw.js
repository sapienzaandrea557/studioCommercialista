const CACHE_NAME = 'studio-sapienza-v1.1';
const ASSETS = [
  '/',
  '/index.html',
  '/commercialista-roma.html',
  '/css/style.css',
  '/js/main.js',
  '/js/booking-availability.js',
  '/img/logo.svg',
  '/site.webmanifest',
  '/crm/style.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
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
  // Ignora le richieste a Firestore e API esterne per evitare conflitti con il cache-first
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('google-analytics.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
