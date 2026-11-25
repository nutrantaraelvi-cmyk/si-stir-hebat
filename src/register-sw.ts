// Didaftarkan hanya pada build produksi; server dev Vite tidak memakai service worker.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => { /* aplikasi tetap berjalan tanpa mode offline */ })
  })
}
