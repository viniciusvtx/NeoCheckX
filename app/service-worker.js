const CACHE_NAME = 'neocheckx-v1.5.0'; // Updated version
const urlsToCache = [
  '/NeoCheckX/app/',
  '/NeoCheckX/app/index.html',
  '/NeoCheckX/app/manifest.json',
  '/NeoCheckX/relatorios.json',
  '/NeoCheckX/favicon.ico',
  'https://unpkg.com/react@18.2.0/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        const cachePromises = urlsToCache.map(urlToCache => {
            return cache.add(new Request(urlToCache, {cache: 'reload'})).catch(err => {
                console.warn(`Falha ao cachear ${urlToCache}:`, err);
            });
        });
        return Promise.all(cachePromises);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName.startsWith('neocheckx-') && cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Network First for critical config file
  if (requestUrl.pathname.endsWith('/relatorios.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    // Cache First for app shell and libraries
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});

