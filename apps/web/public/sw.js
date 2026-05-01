const CACHE_NAME = 'kambafeira-v1'
const ROTAS_ESTATICAS = ['/', '/login', '/offline.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ROTAS_ESTATICAS).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  // Não cachear chamadas à API
  if (url.pathname.startsWith('/api') || url.hostname.includes('railway') || url.hostname.includes('cloudinary')) return

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copia = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia))
        return res
      })
      .catch(() => caches.match(event.request).then((cached) => cached ?? caches.match('/offline.html')))
  )
})
