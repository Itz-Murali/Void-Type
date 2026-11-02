const LOGO = 'https://files.catbox.moe/52pvkc.png'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/main.css', '~/assets/site.css'],
  nitro: { prerender: { routes: ['/about', '/terms', '/license'] } },
  app: {
    head: {
      title: 'VOIDTYPE — 3D typing combat',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content' },
        { name: 'description', content: 'A 3D space-combat typing game. Type. Aim. Survive.' },
        { name: 'theme-color', content: '#03050a' },
        { name: 'application-name', content: 'VOIDTYPE' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'VOIDTYPE' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { property: 'og:title', content: 'VOIDTYPE — 3D typing combat' },
        { property: 'og:description', content: 'Type. Aim. Survive. A 3D space-combat typing game.' },
        { property: 'og:image', content: LOGO },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:image', content: LOGO }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'preload', as: 'image', href: 'https://files.catbox.moe/po4yde.png' },
        { rel: 'icon', type: 'image/png', href: LOGO },
        { rel: 'shortcut icon', href: LOGO },
        { rel: 'apple-touch-icon', href: LOGO },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Space+Grotesk:wght@400;500;600&family=Orbitron:wght@600;800&display=swap' }
      ]
    }
  },
  typescript: { strict: true },
  vite: { build: { chunkSizeWarningLimit: 1200 } }
})
