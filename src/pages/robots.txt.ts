// Search crawlers may index public pages, but not the duplicate search payload.
// Archived pages remain crawlable so their noindex directives can be read.
export const GET = (): Response => {
  const policies = ['OAI-SearchBot', 'PerplexityBot', 'Claude-SearchBot', 'Claude-User', '*']
    .map(userAgent => `User-agent: ${userAgent}\nDisallow: /search-index.json\nDisallow: /es/search-index.json\nDisallow: /pagefind/\nAllow: /`)
    .join('\n\n')

  const sitemap = new URL('/sitemap.xml', import.meta.env.SITE)

  return new Response(`${policies}\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
