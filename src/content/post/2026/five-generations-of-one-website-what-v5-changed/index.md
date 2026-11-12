---
title: "Five Generations of One Website: What v5 Changed"
description: "How the v5 editorial redesign shipped while four earlier versions of the site stayed online as maintained, non-indexed archives."
publishDate: "2026-11-24T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["astro", "web-design", "architecture", "personal-projects", "developer-experience"]
postType: "Case Study"
---

Most redesigns delete the previous site. The new one replaces it, the old screenshots end up in a folder, and a year later nobody remembers how the navigation used to work.

For v5 I did the opposite. The current site lives at the root, and the four designs that came before it are still online at `/v1/` through `/v4/`. You can open the [website history](/history/) and walk through all five.

This is what v5 changed, and what it costs to keep the older generations running.

## What v5 is

v5 is an editorial redesign. The layout borrows from print: chapter spreads, ruled lists, captions under figures, and quieter surfaces. The content model stayed the same, so every existing public route kept working and visitors needed no migration.

Three additions came with it:

- **Spanish.** The current site is available in Latin American Spanish under `/es/`, with translated articles and case studies.
- **Full-text search.** Search still ranks titles and tags first. When there is room for more results, it loads a body index for published articles and case studies.
- **A contact page.** [Work with me](/work-with-me/) collects the ways to start a conversation in one place.

v4.0.0 was published on October 8, 2026. I had a v4.1 release prepared, and instead of shipping it separately I folded that work into v5.0.0. Two releases in a row with different visual directions would have been noise.

## The archive rule: freeze the design, maintain the software

The archived sites are not screenshots. Each one is a working Astro app in `apps/`, built with the current site and assembled into one static deployment.

The rule I settled on has two halves.

**Design and content are frozen.** An archive keeps its layout, its copy, and its assets from the snapshot date. I do not backport new articles or the current visual language into an old era.

**Software is maintained.** Every archive uses the same dependency catalog and lockfile as the current site. I do not restore an old lockfile to preserve how something looked. If a framework upgrade changes the output, I fix the archive so it keeps its original appearance on current dependencies.

That second half matters more than it sounds. A frozen lockfile is a growing list of unpatched dependencies. Keeping the archives on current versions means one audit covers everything I deploy.

The version labels are curated. v3, v4, and v5 match real release versions. v1 and v2 are era labels I assigned afterwards to two stable snapshots, and the history page says so.

## What an archive is not allowed to do

A preserved site can cause real problems if it behaves like a live one. So each archive has limits:

- No analytics, no service worker, no live comments, and no working newsletter form.
- Every archived page is marked `noindex, follow`, and the archives never enter the sitemap. I do not block them in `robots.txt`, because a crawler has to read the page to see the exclusion.
- A notice above the navigation says which version you are looking at and links to the current homepage, the history page, and the current equivalent of the page when one exists.
- A link that leaves an archive triggers a full document load, so one app never inherits another app's script state.
- Theme and search-history storage use separate keys per version.

Accessibility repairs are allowed, and they follow the same idea as the software rule. Keyboard navigation, focus restoration, and text reflow were fixed in the old sites without applying the current design to them.

## The cost

Keeping five sites is not free, and I would rather be specific about it.

The full production build takes about 22 minutes, and most of that time goes to the archives. Each archive's output is cached, so a rebuild that does not touch an era replays it in under a second. A cold build still pays the whole bill.

The deployment is also large. Old image formats and duplicated assets across generations add up, and that is on my list to reduce.

Tests grew too. Archive plumbing needs its own coverage: URL rewriting, storage boundaries, disabled forms, and keyboard behavior in menus from older designs.

## The captures are real

The history page shows desktop and mobile captures of each era. A script takes them from the assembled production build at fixed sizes, in light mode, with reduced motion. Before saving a capture, it checks that the page responded and that the archive notice shows the expected version and date.

I did not want mockups of my own history. If a capture looks dated, that is the point.

## Would I do it again?

Yes, with one condition: decide the rule before you start. "Frozen design, maintained software" answered almost every question that came up, from whether to fix a focus bug in v1 to whether an old newsletter page should show new issues.

If you are about to replace a site you care about, consider keeping the old one reachable. Give it a clear label, keep it out of search results, and keep its dependencies current. It is a better record than a folder of screenshots.
