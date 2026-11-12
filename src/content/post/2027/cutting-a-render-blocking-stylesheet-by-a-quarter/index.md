---
title: "Cutting a Render-Blocking Stylesheet by a Quarter"
description: "The shared CSS file on this site was 79 KB compressed on every page. Moving route-only rules to their routes cut it to 62 KB, with two side effects worth knowing."
publishDate: "2027-05-11T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["performance", "css", "astro", "tailwind", "web-design"]
postType: "Deep Dive"
---

Every page on this site loaded one stylesheet before it could render: 490 KB raw, 79 KB compressed.

A stylesheet in the head blocks rendering. The browser will not paint until it has downloaded and parsed it. On a mobile Lighthouse run, this file was the main render-blocking request, with the largest paint landing between 3.0 and 3.7 seconds.

I cut the file by about a quarter without changing a single computed style. Here is where the weight was.

## Measure what is in the file

Before moving anything, I measured what the file contained. Two things made up most of it:

- About 43% was the component library's full stylesheet: every component, on every page.
- Roughly 86 KB of minified CSS belonged to a single page each. The About page, the History page, the home hero, the Work page, the Projects page, and article prose were all imported from the global stylesheet.

A rough check found that 656 of 1,347 class selectors in the file appeared nowhere in the built HTML or JavaScript.

The second item was the easier one. A visitor reading an article was downloading the layout for the About page, the History timeline, and the home hero.

## Move each route's CSS to its route

The change is mechanical. Styles that one route needs move out of the global stylesheet into a file that only that page imports:

```text
src/styles/
  global.css        tokens, base rules, shared partials
  partials/         styles every page may need
  pages/
    about.css
    history.css
    home.css
    work.css
  prose.css         articles and case studies only
```

Each route file starts with a reference to the global stylesheet, so theme tokens and utilities resolve without being emitted a second time:

```css
@reference "../global.css";
```

Article prose was the largest single move. Prose styles cover headings, code blocks, tables, callouts, and figures. Only the article and case-study layouts need them, and at the time those were 71 of the site's 453 pages.

The shared file went from 490 KB to 364 KB raw, and from 79 KB to 62 KB compressed.

## Side effect one: source order stops being reliable

In one big stylesheet, order is under your control. A later rule wins.

Once styles are split, the bundler decides the order of the link tags from the import graph. A route stylesheet can be linked before or after the shared bundle, and that can differ between pages.

Any override that depended on coming later is now fragile. I resolved those conflicts with specificity. If a route rule must beat a shared rule, it says so in its selector, and it no longer matters which file loads first.

I verified the result by comparing computed styles before and after, not by looking at screenshots. Screenshots miss a changed margin on a state you did not open.

## Side effect two: Safari and client-side navigation

This site uses client-side navigation. When you follow a link, the router swaps the new page into the current document and adds any stylesheet the new page needs.

Safari applies a stylesheet linked during that swap only after the new page has painted. For one frame, a page with its own stylesheet appeared without its layout.

The fix is in the router hook. Before the swap, each stylesheet the next page adds is copied into a `<style>` element in the incoming document. Inline styles apply with the swap. The files are already preloaded, so the copy is a cache read.

A full page load was never affected. It only showed during navigation, in one engine, for one frame, which is exactly the kind of bug a single-browser test suite never reports.

## The HTML was heavy too

While measuring CSS I looked at the documents themselves. Two patterns stood out.

**Syntax highlighting.** The highlighter wrote an inline `style` attribute on every token. One long tutorial carried about 1,580 of them, with only 24 distinct values. Emitting a class per color and one small stylesheet removed the repetition.

**Repeated icons.** One listing page had 555 inline SVGs, and only 16 were distinct. A single arrow icon appeared 510 times. Defining it once and referencing it everywhere else took the copies out.

Together those trimmed article HTML by 17 to 19 percent.

## Then the library moved too

The largest share of the file was the component library, and I could not fix that from the site.

It was fixed upstream. The next major version of [Lumen](/portfolio/lumen-ui/) lets each component bring its own styles, and adopting it took the shared file from 62 KB to about 30 KB compressed.

That is not a pure win. A page now links several smaller stylesheets where it used to link one, and the total for a single page fell less than the shared file did. What changed for good is the principle: a route pays for what it renders.

## Budgets keep it from growing back

A one-time cleanup decays. The next feature adds a rule to the global file because that is the easiest place.

Lighthouse runs in CI against the production build, with a performance score of at least 0.90 on every measured route, a ceiling on DOM size, and a limit on largest contentful paint. The check runs three times per route to smooth out noise.

## If you want to try this

1. Open your largest stylesheet and find out what share belongs to a library, to one page, and to everything.
2. Move the single-page rules first. It is low risk and the effect is immediate.
3. Replace order-dependent overrides with explicit specificity before you split anything else.
4. Test client-side navigation in Safari.
5. Add a budget, so the file cannot quietly return to its old size.
