---
name: seo
description: SEO optimization for this Astro website. Use this skill whenever working on meta tags, Open Graph, structured data (JSON-LD), sitemaps, robots.txt, Core Web Vitals, image optimization, page speed, internal linking, or any task related to search engine visibility and ranking. Trigger on mentions of SEO, search ranking, Google, meta description, canonical URL, schema markup, page speed, Lighthouse score, or discoverability.
---

# SEO Skill — Astro / santi020k Website

This site uses `@astrojs/sitemap`, `astro-robots-txt`, and `src/site.config.ts` as the central source of truth for metadata. All SEO work should start from and stay consistent with those anchors.

## Quick Reference

| Concern | Where it lives |
|---|---|
| Site-wide metadata | `src/site.config.ts` |
| Per-page `<head>` | Layout components in `src/layouts/` |
| Sitemap | `@astrojs/sitemap` in `astro.config.ts` |
| robots.txt | `astro-robots-txt` in `astro.config.ts` |
| Open Graph images | Generated via Satori in `src/pages/og/` |
| Structured data | Inline `<script type="application/ld+json">` in layouts |
| Analytics | `@vercel/analytics` + `@vercel/speed-insights` |

---

## Meta Tags

### Page-level metadata pattern
Every page should resolve a title and description from its content — never hardcode them. Derive from front matter or pass as props to the layout:

```astro
---
// In a layout component
interface Props {
  title: string
  description?: string
  ogImage?: string
  canonicalURL?: string
  noindex?: boolean
}
const {
  title,
  description = siteConfig.description,
  ogImage = '/og/default.png',
  canonicalURL = new URL(Astro.url.pathname, Astro.site).href,
  noindex = false,
} = Astro.props
---

<head>
  <title>{title} | {siteConfig.title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalURL} />
  {noindex && <meta name="robots" content="noindex, nofollow" />}

  <!-- Open Graph -->
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonicalURL} />
  <meta property="og:image" content={new URL(ogImage, Astro.site).href} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={siteConfig.title} />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={new URL(ogImage, Astro.site).href} />
</head>
```

### Blog post / article pages
For content collection entries, set `og:type` to `article` and include `article:published_time`, `article:modified_time`, and `article:author`.

---

## Structured Data (JSON-LD)

Always inject structured data as a server-rendered `<script type="application/ld+json">` — never client-side JS. Use `JSON.stringify` to serialize it safely.

### Website schema (global layout)
```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": siteConfig.title,
  "url": Astro.site?.href,
  "description": siteConfig.description,
})} />
```

### Article schema (blog posts)
```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": post.data.title,
  "description": post.data.description,
  "datePublished": post.data.publishDate.toISOString(),
  "dateModified": (post.data.updatedDate ?? post.data.publishDate).toISOString(),
  "author": {
    "@type": "Person",
    "name": siteConfig.author,
    "url": Astro.site?.href,
  },
  "image": new URL(ogImage, Astro.site).href,
})} />
```

### Person / Portfolio schema (homepage)
```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": siteConfig.author,
  "url": Astro.site?.href,
  "sameAs": [
    siteConfig.githubURL,
    siteConfig.linkedinURL,
  ].filter(Boolean),
})} />
```

---

## Sitemap & Robots

Both are managed by integrations in `astro.config.ts`. If pages need to be excluded from the sitemap, pass a `filter` function:

```ts
// astro.config.ts
sitemap({
  filter: (page) => !page.includes('/private/'),
  changefreq: 'weekly',
  priority: 0.7,
  lastmod: new Date(),
})
```

For dynamic OG image routes or API endpoints that should never be indexed, add them to `robots.txt` disallow rules via `astro-robots-txt` config.

---

## Open Graph Images

This project generates OG images server-side using Satori. When adding new content types, ensure there is a matching OG image route in `src/pages/og/`. The image should:
- Be 1200×630px
- Include the page title and site branding
- Have sufficient contrast for legibility as a thumbnail

---

## Core Web Vitals & Performance

The site uses `@vercel/speed-insights` for real-user monitoring. When making performance changes, aim to improve:

- **LCP** (Largest Contentful Paint) — ensure above-the-fold images have `loading="eager"` and `fetchpriority="high"`.
- **CLS** (Cumulative Layout Shift) — always set explicit `width` and `height` on `<img>` tags so the browser reserves space.
- **INP** (Interaction to Next Paint) — keep Alpine.js handlers lightweight; defer heavy work off the main thread.

### Image optimization checklist
- Use `sharp` (already installed) via Astro's `<Image>` component from `astro:assets`.
- Always pass `width`, `height`, and a meaningful `alt` text.
- Use `format="avif"` with a `webp` fallback for hero images.
- For decorative images, use `alt=""` and `role="presentation"`.

```astro
import { Image } from 'astro:assets'
import heroImg from '@/assets/hero.png'

<Image
  src={heroImg}
  alt="Descriptive alt text"
  width={1200}
  height={630}
  format="avif"
  loading="eager"
  fetchpriority="high"
/>
```

---

## Content SEO

- **Title length**: 50–60 characters (titles get cut off at ~60 in SERPs).
- **Meta description**: 140–160 characters — write it as a call to action.
- **Heading hierarchy**: One `<h1>` per page (usually the post/page title). Use `<h2>` for main sections, `<h3>` for subsections. Never skip levels.
- **Internal linking**: When adding or editing content, link to 2–3 related pages naturally. Use descriptive anchor text (never "click here").
- **URL slugs**: Keep them short, lowercase, hyphen-separated, and keyword-relevant. Avoid dates in slugs unless the content is time-sensitive.

---

## SEO Audit Checklist

Run through this when reviewing any page:

- [ ] Unique, descriptive `<title>` (50–60 chars)
- [ ] Meta description present (140–160 chars)
- [ ] Canonical URL set correctly
- [ ] `og:image` points to a valid, fully-qualified URL
- [ ] Structured data valid (test at schema.org/validator)
- [ ] No duplicate `<h1>` tags
- [ ] All images have `alt` text
- [ ] Page is in sitemap (or intentionally excluded)
- [ ] Page speed ≥90 on Lighthouse (mobile)
- [ ] No broken internal links
