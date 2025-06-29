// Define o nome e a versão do cache.
const CACHE_NAME = 'comercial-rocha-cache-v1';

// Lista de arquivos essenciais para o funcionamento do aplicativo offline (o "App Shell").
const urlsToCache = [
  './index.html'
  // Outros assets locais como ícones ou manifest.json podem ser adicionados aqui.
  // Ex: '/icons/icon-192.png', '/manifest.json'
];

/**
 * Evento 'install': É acionado quando o Service Worker é instalado.
 * Ele abre o cache e armazena os arquivos do App Shell para uso offline.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto. Adicionando o App Shell ao cache.');
        return cache.addAll(urlsToCache);
      })
  );
});

/**
 * Evento 'activate': É acionado após a instalação e é o momento ideal para
 * limpar caches antigos que não são mais necessários.
 */
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]; // Lista de caches a serem mantidos.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Se o nome do cache não estiver na whitelist, ele é excluído.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Excluindo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * Evento 'fetch': Intercepta todas as solicitações de rede da página.
 * Ele verifica se a solicitação já está no cache. Se estiver, retorna a resposta do cache.
 * Se não, ele busca na rede, clona a resposta, armazena no cache para uso futuro e retorna a resposta da rede.
 */
self.addEventListener('fetch', (event) => {
  // Ignora solicitações que não são do tipo GET.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se a resposta for encontrada no cache, retorna ela.
        if (response) {
          return response;
        }

        // Se não, busca a solicitação na rede.
        return fetch(event.request).then(
          (networkResponse) => {
            // Verifica se a resposta da rede é válida.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona a resposta. Uma resposta é um stream e só pode ser consumida uma vez.
            // Precisamos cloná-la para que uma cópia vá para o navegador e outra para o cache.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});