const CACHE_NAME = 'neocheckx-v1.3.0';
const BASE_PATH = '/NeoCheckX'; // Caminho base do GitHub Pages

const urlsToCache = [
  `${BASE_PATH}/app/`,
  `${BASE_PATH}/app/index.html`,
  `${BASE_PATH}/app/manifest.json`,
  `${BASE_PATH}/relatorios.json`,
  
  // Corrigido para as versões exatas do index.html
  'https://unpkg.com/react@18.2.0/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js',
  
  'https://unpkg.com/@babel/standalone/babel.min.js',
  
  // Removido 'https://cdn.tailwindcss.com' para evitar erro de CORS
];

// Instalação - cacheia recursos
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando arquivos');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('Erro ao cachear:', err);
          // Não falhar se algum recurso não carregar
          return Promise.resolve();
        });
      })
  );
  self.skipWaiting();
});

// Ativação - limpa caches antigos
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - serve do cache ou busca online
self.addEventListener('fetch', event => {
  // Ignorar requisições chrome-extension e outras não HTTP(S)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            // Verificar se é uma resposta válida
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // Clonar a resposta
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                console.log('Erro ao cachear:', err);
              });
            
            return response;
          })
          .catch(err => {
            console.log('Fetch falhou, tentando cache:', err);
            return caches.match(event.request);
          });
      })
  );
});