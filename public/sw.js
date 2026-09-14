// Bump a versão sempre que a estratégia de cache ou o shell forem alterados;
// caches antigos são apagados no evento activate e ficam elegíveis para GC.
const CACHE_NAME = 'pratinho-pronto-shell-v38'
const APP_SHELL = ['/', '/manifest.webmanifest', '/favicon.svg']

self.addEventListener('install', (event) => {
  // cache.addAll é atômico: se algum recurso falhar, a instalação inteira falha
  // e o SW permanece em "waiting". Usamos add individual para instalar mesmo
  // que um dos assets do shell esteja indisponível na origem.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        APP_SHELL.map((asset) =>
          cache.add(asset).catch(() => undefined),
        ),
      ),
    ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

// Permite que uma futura tela de "nova versão disponível" force o SW a assumir
// o controle imediatamente sem precisar fechar todas as abas do PWA.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // Network-first para navegação: garante que a próxima abertura do app
    // sempre baixe o HTML mais novo quando houver rede. Se a rede falhar,
    // recorremos ao shell em cache para manter o app utilizável offline.
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/')),
      ),
    )
    return
  }

  if (['font', 'image', 'script', 'style'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached

        return fetch(request).then((response) => {
          // Só cacheia respostas próprias e completas. Respostas opacas/erros
          // ficam de fora para não fixar HTML de erro como se fosse asset.
          if (response.ok && response.type === 'basic') {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
      }),
    )
  }
})
