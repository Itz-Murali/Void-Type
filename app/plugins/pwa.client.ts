export default defineNuxtPlugin(() => {
  if (import.meta.dev || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { })
  })
})
