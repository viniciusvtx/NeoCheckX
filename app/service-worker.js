// O nome do cache foi atualizado para forçar a atualização no navegador do usuário.
const CACHE_NAME = 'neocheckx-v1.4.1'; 
const REPO_NAME = '/NeoCheckX'; 

const urlsToCache = [
  `${REPO_NAME}/app/`,
  `${REPO_NAME}/app/index.html`,
  `${REPO_NAME}/app/manifest.json`,
  // O relatorios.json agora será tratado com uma estratégia diferente no evento 'fetch'
  `${REPO_NAME}/app/icon-192.png`,
  `${REPO_NAME}/app/icon-512.png`,
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
        console.log('Cache aberto e recursos sendo adicionados.');
        // Adiciona relatorios.json ao cache inicial como fallback
        cache.add(`${REPO_NAME}/relatorios.json`);
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Estratégia "Network Falling Back to Cache" para o relatorios.json
  // Tenta buscar na rede primeiro para obter a versão mais recente.
  // Se falhar (offline), usa a versão que está no cache.
  if (request.url.includes('relatorios.json')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Se a busca na rede for bem-sucedida, atualiza o cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match(request)) // Se falhar, pega do cache
    );
    return;
  }

  // Estratégia "Cache First" para todos os outros recursos estáticos
  event.respondWith(
    caches.match(request)
      .then(response => {
        return response || fetch(request).then(fetchResponse => {
          // Cacheia novas requisições bem-sucedidas
          if (request.method === 'GET' && fetchResponse.status === 200) {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
               cache.put(request, responseToCache);
            });
          }
          return fetchResponse;
        });
      })
  );
});

