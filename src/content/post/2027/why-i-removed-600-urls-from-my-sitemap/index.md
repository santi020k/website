---
title: "Why I Removed 600 URLs from My Sitemap"
description: "A sitemap should list pages with something distinct to say. How I found thin archives and untranslated copies, marked them noindex, and kept them reachable for readers."
publishDate: "2027-03-16T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["seo", "astro", "content", "i18n", "build-tools"]
postType: "Guide"
---

The sitemap for this site listed 886 URLs. After one change it listed 285.

No page was deleted. Every one of those 600 pages still exists and is still linked. They stopped asking to be indexed, because none of them had anything of their own to say.

## How a small site gets a large sitemap

Generated archives are cheap to build, so a site accumulates them.

Every tag gets an archive page. Every technology mentioned in a project gets one too. Then I added a second language, and each of those pages gained a Spanish twin.

When I counted:

- 154 of 240 technology pages listed exactly one entry.
- About 70 of 112 tag pages listed exactly one post.
- Spanish article and case-study routes existed for every entry, including the ones whose content was still in English.

A one-entry archive is a title, one card, and a link to the entry. It repeats what the entry already says. A Spanish URL showing an English article is a copy of the English page.

The pages that came out were roughly two thirds of the sitemap.

## Why it matters

A sitemap is a list of pages you are asking a search engine to consider. Filling it with near-duplicates makes that request less useful.

Thin and duplicate pages can also compete with the real ones. When an archive with one card and the article it points to both target the same topic, there is no reason to prefer the archive.

I do not have a before-and-after traffic chart to show, and I am not going to invent one. The argument is simpler: these pages were not worth indexing, so I stopped submitting them.

## One threshold, in one place

The rule is a single constant:

<!-- eslint-skip -->
```ts
export const MIN_INDEXED_ARCHIVE_ENTRIES = 3

export const isIndexedArchive = (entryCount: number): boolean =>
  entryCount >= MIN_INDEXED_ARCHIVE_ENTRIES
```

A topic or technology archive with fewer than three published entries is marked `noindex, follow`. It stays in navigation, and its links still count. When a third entry is published, the archive becomes indexable without anyone remembering to flip a flag.

Three is a judgment call. One is clearly a duplicate. Two is a short list. Three is where an archive starts to work as a way to browse.

The archive pages, the sitemap, and the social-card generator all read the same constant, so they cannot disagree about which pages matter.

## The sitemap reads the built pages

A sitemap filter can repeat the rules: skip thin archives, skip untranslated routes. Then every new rule has to be written twice, once in the page and once in the filter.

This one reads each built HTML file and drops any page marked `noindex`. The page is the source of truth. If a page says it should not be indexed, it cannot be submitted, whatever the reason.

That removed a whole class of mistakes. A sitemap that lists a `noindex` page sends two opposite signals, and it is an easy inconsistency to ship.

## Untranslated pages

A Spanish route without a translation falls back to the English body. That page is marked `noindex, follow`, stays out of the sitemap, and declares no language alternates.

When the translation is written, the page becomes a real Spanish document with its own canonical URL, and it enters the sitemap as one half of an `en` and `es` pair.

Keeping the fallback matters. It means a new article can be published in English first without creating a duplicate at the Spanish address.

## Stop marking your own links nofollow

While checking the archives I found a related problem in the opposite direction.

The Markdown pipeline added `nofollow` to every external link. That is a reasonable default for links you do not vouch for. But 90 of the 153 affected links in my articles pointed to my own subdomains, repositories, packages, and profiles.

I was telling search engines not to trust links to my own work.

The plugin's `rel` option accepts a function, so the rule is now specific: third-party links keep `nofollow`, and my own properties do not. Every external link still opens with `noopener noreferrer`.

## Do not block what you want ignored

One detail is easy to get backwards. A page marked `noindex` must remain crawlable.

If you block it in `robots.txt`, the crawler never fetches the page and never sees the `noindex`. The URL can still appear in results, without a description. The exclusion has to be readable to work.

## How to check your own site

You can do this audit in an afternoon:

1. Count the entries on every generated archive. Sort by count and look at the bottom of the list.
2. Open your sitemap and search for any URL that carries `noindex` in its HTML.
3. For each language, check whether the page content is in that language.
4. List the external links marked `nofollow` and see how many are yours.

Most of what you find will be pages nobody would miss in a search result. Keep them for readers who browse, and stop submitting them.

One note on the numbers. The 285 is this site's own pages. The file I submit also lists the documentation sites for my other projects, which is a separate decision and a much longer file.
