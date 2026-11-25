// Service worker SI STIR HEBAT: hanya menyimpan cangkang aplikasi (index.html dan
// aset build ber-hash) agar halaman tetap terbuka saat koneksi sekolah putus.
// Tidak pernah menyimpan respons Supabase atau data pribadi lain.
const SHELL_CACHE = 'si-stir-shell-v1'
const ASSET_CACHE = 'si-stir-assets-v1'
const MAX_ASSETS = 150

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.add(new Request('/index.html', { cache: 'reload' }))).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('si-stir-') && ![SHELL_CACHE, ASSET_CACHE].includes(key)).map(key => caches.delete(key))))
    .then(() => self.clients.claim()))
})

async function trimAssets() {
  const cache = await caches.open(ASSET_CACHE)
  const keys = await cache.keys()
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map(key => cache.delete(key)))
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // Jaringan dulu agar rilis baru langsung dipakai; cangkang tersimpan hanya saat offline.
    event.respondWith(fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone()
          event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.put('/index.html', copy)))
        }
        return response
      })
      .catch(async () => (await caches.match('/index.html')) ?? Response.error()))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(request).then(cached => cached ?? fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone()
        event.waitUntil(caches.open(ASSET_CACHE).then(cache => cache.put(request, copy)).then(trimAssets))
      }
      return response
    })))
  }
})
