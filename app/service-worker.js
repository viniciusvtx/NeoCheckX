// O nome do cache foi atualizado para forçar a atualização no navegador do usuário.
const CACHE_NAME = 'relatorios-v1.3.1'; 
// O nome do seu repositório no GitHub.
const REPO_NAME = '/NeoCheckX'; 

const urlsToCache = [
  // Adiciona o nome do repositório a todos os caminhos para funcionar no GitHub Pages.
  `${REPO_NAME}/app/`,
  `${REPO_NAME}/app/index.html`,
  `${REPO_NAME}/app/manifest.json`,
  `${REPO_NAME}/relatorios.json`,
  // Ícones adicionados ao cache para uma melhor experiência offline.
  `${REPO_NAME}/app/icon-192.png`,
  `${REPO_NAME}/app/icon-512.png`,
  // URLs externas não precisam de alteração.
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.js',
  'https://cdn.tailwindcss.com'
];

// Instalação - cacheia recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Ativação - limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Deleta caches antigos se o nome for diferente do atual.
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

// Fetch - serve do cache ou busca online
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Retorna do cache se existir.
        if (response) {
          return response;
        }
        
        // Busca online e atualiza o cache.
        return fetch(event.request).then(response => {
          // Só cacheia respostas válidas de URLs básicas.
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(err => {
          console.error('Fetch falhou:', err);
          // Você pode retornar uma página de fallback offline aqui, se tiver uma.
        });
      })
  );
});
