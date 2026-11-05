import { siteConfig } from '@/site.config'

// generate:icons owns these assets; this route only describes the installed app.
export const GET = (): Response => new Response(JSON.stringify({
  name: siteConfig.title,
  icons: [
    { src: 'apple-touch-icon.webp', sizes: '180x180', type: 'image/webp' },
    { src: 'icons/icon-192.webp', sizes: '192x192', type: 'image/webp', purpose: 'any maskable' },
    { src: 'icons/icon-512.webp', sizes: '512x512', type: 'image/webp', purpose: 'any maskable' }
  ],
  short_name: 'santi020k',
  description: siteConfig.description,
  lang: siteConfig.lang,
  id: '/',
  start_url: '/',
  scope: '/',
  theme_color: '#09040f',
  background_color: '#09040f',
  display: 'standalone'
}, null, 2), {
  headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' }
})
