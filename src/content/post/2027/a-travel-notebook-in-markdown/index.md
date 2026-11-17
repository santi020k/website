---
title: "A Travel Notebook in Markdown: Modeling What You Have Not Written Yet"
description: "How I built country pages for my travel notebook with a schema that tells unanswered apart from zero, keeps facts and opinions in separate files, and hides empty pages from search."
publishDate: "2027-07-20T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["travel", "astro", "content", "typescript", "personal-projects"]
postType: "Case Study"
---

The [travel page](/travel/) on this site has a world map and a notebook of the countries I have been to. Each country now has its own page.

The interesting part was not the map. It was building pages for notes I had not written yet, without filling the gaps with made-up content.

## Facts and opinions live in different files

There are two kinds of information about a trip.

Some of it is fact: the country, the places, how many times I visited, where I lived. That lives in one typed data file. It drives the map, the totals, and the notebook list.

The rest is personal: a score, a summary, highlights, whether I would go back. That lives in one Markdown file per country.

The Markdown files do not repeat the facts. A country file never says how many visits there were. It links to its facts through a country code, and the schema rejects a code that does not exist in the data.

One fact, one place. If I correct a visit count, I change it once, and no page can disagree with the map.

## Unanswered is not zero

Every country file starts empty:

<!-- eslint-skip -->
```yaml
---
code: AR
score: null
summary: ''
visitedWhen: ''
highlights: []
wouldReturn: null
language: en
---
```

The schema distinguishes "no answer" from "an answer":

- `score` is a number from 0 to 10, or `null`. Zero is a real score. `null` means I have not scored it.
- `wouldReturn` is `yes`, `maybe`, `no`, or `null`.
- `highlights` is a list. An empty list is fine. An empty item is not.

This matters more than it seems. A numeric field that defaults to `0` turns "I have not thought about it" into "the worst trip of my life". A boolean for "would return" cannot say "maybe" and cannot say "not answered".

The page renders each state differently. An unanswered score reads as not rated. It never shows a zero.

## The schema refuses to guess

The notebook knows how many times I visited a country. It does not know when.

It would be easy to let a page say "visited several times since 2019" from a count and a guess. So `visitedWhen` is free text in my own words, and it stays empty until I write it. Nothing derives dates from visit counts.

The same rule applies to the map. It highlights countries. It does not place pins on cities, because I supplied place names and not coordinates, and some of those names are regions. A pin would claim precision the data does not have.

A personal site is a small place to practice this, and it is the same discipline as a product: do not display a fact your data does not contain.

## Empty pages stay out of search

All the country pages exist from the first day. The links in the notebook need somewhere to go.

A page with no summary is marked `noindex, follow` and stays out of the sitemap. It is reachable for a visitor who clicks through, and it does not ask a search engine to index a heading and a visit count.

When I write the summary, the page becomes indexable. No flag to flip: the presence of the content is the signal.

It is worth being clear about what this does and does not do. `noindex` controls discovery through search. It is not privacy. These files are public source for a public site.

## One language per note

The site has an English and a Spanish interface. Travel notes are personal writing, and I did not want to translate my own memories twice or publish a version I had not really written.

Each file declares the language its notes are written in. The page controls and country facts follow the interface language. The notes stay in the language I wrote them in.

Only the route that matches the note's language can be indexed. The other interface shows the same note, marked with its real language, and stays out of search.

## The map works without the map

The map is a component from [Lumen](/portfolio/lumen-ui/), and the country geometry comes from the same library. Selecting a country opens a card with its name, its outline, and its places.

A few decisions kept it usable for everyone:

- A native country selector sits before the zoom buttons in reading and keyboard order. You never have to aim at a small country.
- The complete notebook is a native disclosure below the map. It works without JavaScript.
- On a phone, the card follows the map in the page flow and does not cover it.
- Browsing order is the order of the data. It does not claim to be a timeline.

## Editing is a text file

There is no admin screen. To fill in a country, I open its Markdown file, write, and preview locally.

That sounds primitive, and it is the right size. The notebook has fifteen entries: my home country and fourteen others. A form, a database, and an account would be more software than content.

The checklist of which countries still need notes is a Markdown file as well, in the repository's documentation.

## What I would reuse

The travel content is specific to me. The modeling is not:

1. Keep facts in one typed source and opinions in content files that reference it.
2. Give every optional answer an explicit empty state, and never let empty render as zero.
3. Do not derive facts the data does not contain.
4. Let content presence control indexing.
5. Declare the language of authored text, and do not machine-duplicate it.

Some of my country files are still waiting for their notes. The pages are honest about that, and the structure is ready for when I write them.
