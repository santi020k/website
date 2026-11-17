---
title: "Publishing an llms.txt Generated from Your Content"
description: "How I generate /llms.txt in Astro from the same published collections as the feeds, and the two checks that keep it from going stale."
publishDate: "2027-06-15T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["ai", "astro", "seo", "content", "developer-experience"]
postType: "Guide"
---

This repository had a file called `llms.txt` for a while. It described the codebase, and it was never deployed. The public address returned a 404.

The version that replaced it is generated at build time from the site's content. It lives at [`/llms.txt`](/llms.txt), and nobody has to remember to update it.

## What llms.txt is

The [llms.txt proposal](https://llmstxt.org/) describes a Markdown file at the root of a site. It gives a short summary and a curated list of links, each with a one-line description, so an AI assistant can find the important pages without crawling navigation and layout markup.

The format is small:

```markdown
# Site name

> One-sentence summary.

A short paragraph of context.

## Section

- [Page title](https://example.com/page/): What the page covers.
```

It is a proposal. I cannot tell you which tools read it today, and I have no measurements of my own to offer. I publish one because it is cheap when generated, and because a plain index of a site is useful to human readers as well.

## Generate it from the content you already have

A static site with content collections already knows everything this file needs: titles, URLs, and descriptions.

In Astro, an endpoint file produces it. This is a shortened version of mine:

```ts
// src/pages/llms.txt.ts
export const GET = async ({ site }: APIContext) => {
  const [posts, projects, seriesSummaries] = await Promise.all([
    getCachedPosts(),
    getCachedProjects(),
    getSeriesSummaries()
  ])

  const body = [
    `# ${siteConfig.author}`,
    `> ${siteConfig.description}`,
    formatLlmsSection('Pages', pages.map(toLink)),
    formatLlmsSection('Case studies', caseStudies.map(toLink)),
    formatLlmsSection('Articles', posts.map(toLink))
  ].filter(Boolean).join('\n\n')

  return new Response(`${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
```

The important choice is the data source. The endpoint calls the same functions as the RSS and JSON feeds. Those functions already exclude drafts and scheduled posts, so the file cannot leak an unpublished title, and a new article appears in it on the next build.

## Order the sections for a reader with limited attention

The file follows the order I would use to introduce the site to a person:

1. **Pages.** The primary destinations in navigation order, each with a description written for this file.
2. **Case studies.** Professional work, most recent first.
3. **Projects.** Personal tools and apps, ordered by relevance.
4. **Series.** Only series that have published articles.
5. **Articles.** Every published post with its description.
6. **Optional.** Secondary links such as the accessibility statement and the sitemap.

The proposal gives "Optional" a specific meaning: links a reader can skip when space is short. I use it for exactly that.

The descriptions on the primary pages are hand-written. Everything else reuses the description each entry already has for search and social cards. If those descriptions are vague, the file will be vague, and so will your search snippets.

## Escape the Markdown you generate

Titles are user content, and Markdown link syntax is fragile.

A title containing a square bracket ends the link text early. A URL containing a parenthesis ends the destination early. The formatter escapes brackets and backslashes in titles, percent-encodes parentheses and spaces in URLs, and collapses whitespace in descriptions so every entry stays on one line.

```ts
export const formatLlmsLink = (title: string, url: string, description?: string): string => {
  const summary = description ? collapseWhitespace(description) : ''

  return `- [${escapeLinkText(title)}](${escapeLinkDestination(url)})${summary ? `: ${summary}` : ''}`
}
```

A section with no entries is omitted, so the file never has an empty heading.

## Two checks keep it honest

A generated file can still be wrong. Two checks guard it:

- The SEO audit fails when the built `llms.txt` is missing.
- A browser test requests every URL listed in the file and expects each one to return 200.

The second check does more than protect the file. A link in an index is a promise that the page exists, and requesting all of them is a cheap link check for the pages I care about most.

## What I left out

**Markdown copies of every page.** Some sites publish a `.md` twin for each route. I decided against it: it doubles the number of URLs and creates a second version of every article to keep correct. The HTML pages are static and readable as they are.

**Archived versions.** The older designs of this site are preserved and not indexed. They stay out of this file for the same reason they stay out of the sitemap.

**A description of the codebase.** That belongs in the repository's instructions for coding agents, which is a different audience. A public `llms.txt` is about the content of the site.

## A short checklist

If you want to add one:

1. Generate it from the same queries as your feed.
2. Write real descriptions for your five to ten primary pages.
3. Escape titles and URLs.
4. Fail a check when the file is missing.
5. Test that every link resolves.

The code is small. The part that takes thought is deciding what the site is about, in one sentence, at the top of the file.
