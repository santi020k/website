---
title: "The Page Background That Cost a Second of Blocking Time"
description: "A long article scored around 0.7 on Lighthouse with almost no JavaScript. The cause was one missing CSS declaration on the page background."
publishDate: "2027-05-25T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["performance", "css", "lighthouse", "troubleshooting", "web-design"]
postType: "Article"
---

One article on this site kept failing its performance check.

It is a long tutorial with many code examples. On CI, Lighthouse scored it between 0.67 and 0.77, with total blocking time between 0.8 and 1.5 seconds. Every other route scored above 0.90.

The page is static HTML with very little JavaScript. It had its own lower threshold in the Lighthouse configuration, 0.85, and it was missing even that.

## The usual suspects

Total blocking time measures how long the main thread was too busy to respond. The usual cause is script, and a code-heavy article gives you plenty of believable suspects.

Some of them were real. The scroll cues on code examples forced one layout per example, and they now share a single measurement. A copy-link fallback forced a style pass on every page, and it no longer does. The document itself was large: more than four thousand elements, with an inline style on every highlighted token.

All of that was worth fixing. None of it explained a second of blocking on a page that does almost nothing.

## What the trace showed

A trace recorded on the CI runner answered it. The time was going to painting, and the amount of work grew with the height of the page.

That pointed at something drawn behind everything else.

## The backdrop

The page background on this site is not a flat color. It is a few soft radial gradients layered over the base color, which gives the canvas a faint glow near the top.

Each gradient layer already covers the whole body. Nothing in the design repeats.

But CSS backgrounds repeat by default. The stylesheet did not set `background-repeat`, because a layer that covers everything looks identical whether it repeats or not.

It was not identical in cost. With the default, Chromium rasterized a repeat tile as tall as the page. On a short page, that is nothing. On a very long article, it stalled the page for hundreds of milliseconds.

## The fix

One declaration:

```css
body {
  /* Each layer already covers the whole body, so repeating paints the same pixels. */
  background-repeat: no-repeat;
}
```

The pixels on screen did not change. The backdrop is now painted once.

On CI, the same article went from 0.67–0.77 to 0.93–0.94. Total blocking time went from 0.8–1.5 seconds to 10–25 milliseconds.

I deleted the exception from the Lighthouse configuration. Every measured route now has to reach 0.90.

## Why it was easy to miss

Three things hid it.

**It only affected long pages.** The home page and most articles were fine, so the overall numbers looked healthy. One slow route reads as "that page is heavy".

**The page really was heavy.** There was an obvious, believable explanation. Reducing the DOM was worth doing. It was not the cause.

**The exception removed the pressure.** A budget with an exception reports less on the thing you excepted. A lower bar for one route makes its slowness look expected.

## What I do differently now

I read a trace before changing code. Fixes based on what usually causes blocking time are reasonable guesses. One recording shows where the time actually goes.

I treat an exception as a debt with a date. If a route needs a lower threshold, the configuration should say why and when it will be removed.

I check decorative CSS on the longest page, not the home page. Gradients, filters, blurs, fixed backgrounds, and large shadows cost in proportion to the area they cover. A design review happens at the top of a short page. The cost shows up at the bottom of a long one.

And I write `background-repeat: no-repeat` on layered backgrounds, even when repeating would look the same.

## Check your own site

It takes a few minutes:

1. Find your tallest page. A long article or a large listing will do.
2. Record a performance trace while it loads.
3. Compare paint and raster time with a short page that shares the same layout.

If the tall page spends far more time painting than its content explains, look at what sits behind the content before you look at the content.
