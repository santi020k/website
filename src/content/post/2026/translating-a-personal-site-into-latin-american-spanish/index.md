---
title: "Translating a Personal Site into Latin American Spanish"
description: "How I added Spanish to a static Astro site: adjacent translation files, one owner for publication state, and a safe fallback for pages that are not translated yet."
publishDate: "2026-12-08T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["astro", "i18n", "seo", "content", "accessibility"]
postType: "Deep Dive"
---

I write in English and I live in Medellín. For years this site only spoke one of those languages.

Adding Spanish looked like a translation task. Most of the work turned out to be deciding what a translation is allowed to change.

## Which Spanish

"Spanish" is not one thing. I chose neutral Latin American Spanish and address the reader as "tú". That rules out regional slang from Colombia as much as it rules out "vosotros".

Product names, code samples, and quoted recommendations keep their original wording. A translated tutorial with translated variable names helps nobody.

## A translation sits beside its original

Each article or case study lives in its own folder as `index.md`. Its Spanish version is a second file in the same folder:

```text
src/content/post/2026/why-i-moved-to-zed/
  cover.webp
  index.md
  index.es.md
```

The Spanish file is deliberately small. Its frontmatter carries the translated title, description, and image alt text, and nothing else:

<!-- eslint-skip -->
```yaml
---
title: "Cómo detectar y corregir la falta de texto alternativo en Astro"
description: "Detecta imágenes sin texto alternativo en Astro…"
coverImage:
  alt: "Una lente de diagnóstico de vidrio revela una pieza ámbar…"
---
```

There is no date, no draft flag, no tags, and no image path. A strict schema rejects them.

## One owner for publication state

This is the decision I would repeat on any multilingual site: the original entry owns everything that is not prose.

Publication date, schedule, draft status, tags, asset paths, and content identity all come from the English file. A translation cannot publish a hidden article, change a date, or move an entry to another topic.

Without that rule, two files can disagree. One says draft and the other says published. One has five tags and the other has four. Every disagreement becomes a bug that only shows in one language.

Comments follow the same rule. A discussion belongs to the article, so both language versions share one thread.

## Untranslated pages fall back safely

A site is rarely fully translated. Mine is not: a few drafts have no Spanish file yet.

When a Spanish route has no translation, it renders the English body, marks that content as English with `lang="en"`, and shows a short notice. The page is also marked `noindex, follow`, stays out of the sitemap, and advertises no language alternates.

That last part matters for search. A page at a Spanish URL with English content is a duplicate, and before this safeguard the sitemap listed every one of them.

Once a translation exists, the pair behaves like two real pages. Each has its own canonical URL, the two link to each other as `en` and `es` alternates, and both enter the sitemap.

There is one exception. An article first published elsewhere keeps its external canonical URL. Its Spanish translation is original to this site, so it gets a local canonical and can be indexed, and the pair omits language alternates because the external original cannot link back.

## Headings keep their IDs

Section links should survive a language switch. If you are reading a section and change language, you should land on the same section.

So heading IDs stay identical across languages, and only the visible label is translated. The language switch keeps the page, the query string, and the fragment. It also means a translator has to preserve the original heading hierarchy, which is a useful constraint on its own.

## Interface text uses typed keys

Prose lives in Markdown. Interface text lives in catalogs: one stable key, one English source, one Spanish message.

```ts
const t = sharedTranslator(locale)
const aboutLabel = t('nav.about')
```

TypeScript checks the keys and the interpolation fields. A catalog must provide both languages, and unit tests reject empty messages and mismatched placeholders. At runtime, a missing Spanish message still falls back to English, so a mistake produces an English label and never a blank one.

## No redirects by browser language

English stays at the original URLs. Spanish lives under `/es/`. The site never redirects based on browser language or a previous visit.

I have been on the wrong side of that redirect too many times: you follow a link someone sent you and land on a different language than they saw. A visible switch in the header is enough.

## What still needs work

Translating the articles was the visible part. The rest takes longer:

- Search needed a separate index per language, loaded again when the language changes.
- Social cards had to be generated per language.
- Feeds needed a Spanish edition that lists only the translated articles.
- Travel notes are authored in one language and are not duplicated.

Spelling checks run with a Spanish dictionary next to the English one, which caught more of my typos than I expected.

## Where to start

If you are adding a second language to a content site, settle these before translating a single paragraph:

1. Which variety of the language, and how you address the reader.
2. Which file owns dates, drafts, and taxonomy.
3. What an untranslated page does, and whether search engines may index it.
4. Whether section links survive a language switch.

The translation itself is the part you can change later. Those four decisions are much harder to undo.
