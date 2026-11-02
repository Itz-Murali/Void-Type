const VERSION = 'voidtype-v4'
const SHELL = `${VERSION}-shell`
const RUNTIME = `${VERSION}-runtime`
const PRECACHE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE).catch(() => undefined)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.pathname === '/sw.js') return
  if (req.destination === 'audio' || req.destination === 'video' || req.headers.has('range')) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(SHELL).then((c) => c.put('/', copy)); return res })
        .catch(() => caches.match('/'))
    )
    return
  }

  const cacheable = url.origin === self.location.origin || /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com|catbox\.moe)$/.test(url.hostname)
  if (!cacheable) return
  event.respondWith(
    caches.open(RUNTIME).then(async (cache) => {
      const hit = await cache.match(req)
      const net = fetch(req)
        .then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res })
        .catch(() => hit)
      return hit || net
    })
  )
})
