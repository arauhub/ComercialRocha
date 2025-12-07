// Service Worker Corrigido - Comercial Rocha
// Versão corrigida que resolve o erro de chrome-extension

const CACHE_NAME = 'comercial-rocha-cache-v8';

const urlsToCache = [
  './index.html'
  // Outros assets locais podem ser adicionados aqui
  // Ex: '/icons/icon-192.png', '/manifest.json'
];

/**
 * Evento 'install': É acionado quando o Service Worker é instalado.
 */
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Ativa imediatamente após instalar
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto. Adicionando o App Shell ao cache.');
        return cache.addAll(urlsToCache);
      })
  );
});

/**
 * Evento 'activate': Limpa caches antigos que não são mais necessários.
 */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Excluindo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Assume controle imediatamente após ativar
});

/**
 * Evento 'fetch': Intercepta solicitações de rede e implementa cache.
 * CORRIGIDO: Agora filtra adequadamente URLs não suportadas.
 */
self.addEventListener('fetch', (event) => {
  // Ignora solicitações que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  // CORREÇÃO: Ignora URLs que não são HTTP/HTTPS (como chrome-extension://)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se a resposta for encontrada no cache, retorna ela
        if (response) {
          return response;
        }

        // Se não, busca a solicitação na rede
        return fetch(event.request).then(
          (networkResponse) => {
            // Verifica se a resposta da rede é válida
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona a resposta para o cache
            const responseToCache = networkResponse.clone();

            // CORREÇÃO: Cache implementado corretamente
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          }
        );
      })
  );
});