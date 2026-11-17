---
title: "What Firefox and WebKit Found That Chromium Did Not"
description: "Real defects and wrong test assumptions that surfaced when a Chromium-only Playwright suite first ran on Firefox, WebKit, and mobile browser projects."
publishDate: "2027-02-23T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["testing", "e2e", "playwright", "accessibility", "javascript"]
postType: "Article"
---

For most of the v5 redesign, the browser tests for this site ran in Chromium. The configuration had Firefox, WebKit, and two mobile projects, and nothing ran them on a schedule.

Before the release I ran the whole matrix: 2,973 tests in each of five browser projects.

It did not pass. The failures split into two groups, and the split is the useful part.

## Group one: real defects

These were bugs in the site. A visitor could hit them.

### Firefox fetched images that were supposed to wait

The image viewer keeps its large image inside a `<template>` until someone opens it. A template is inert, so its contents should not load.

Firefox can speculatively fetch an image's `src` even there, so a page with a gallery could download large images nobody had asked for.

The fix was to stop putting a real `src` in the template. The viewer now keeps the address in a data attribute and creates the image element when it opens.

### Safari drew one frame without its layout

Some routes have their own stylesheet. During a client-side navigation, the router adds that stylesheet's link to the page along with the new content.

Safari applies a stylesheet linked during the swap only after the new page has painted. For one frame, the About, Work, and History pages appeared without their layout.

Now, before the swap, the router copies each stylesheet the next page adds into a `<style>` element in the incoming document. Inline styles apply with the swap. The files were already preloaded, so this costs no extra request.

### A service worker redirect stalled Firefox

The service worker fetches pages and hands the response to the browser. When a request redirects, for example from a path without a trailing slash, the worker receives a response that has already followed the redirect.

Firefox can stall when a worker answers a page navigation with that kind of response. In that case the worker now steps aside and lets the browser follow the same-origin redirect itself.

### Menus and narrow titles

Two smaller problems also surfaced: menu rows that were only partly visible when they received keyboard focus, and long titles and code names that did not fit narrow screens. Both were real, and neither showed up at a desktop Chromium viewport.

## Group two: tests that assumed desktop Chromium

The second group was larger. The site was correct and the test was wrong.

- **Tab does not reach links in Safari by default.** On macOS, Safari uses Option-Tab to include links and buttons in keyboard navigation. A test that presses Tab and expects focus on a link fails for a reason that has nothing to do with the page.
- **WebKit does not focus a button when you click it.** A test that clicks and then presses a key needs an explicit starting point for the keyboard path.
- **Layout units are fractional.** Engines round computed sizes differently. Asserting that two boxes align to the exact pixel passes in one engine and fails by 1/64 of a pixel in another.
- **Scrolling by key needs a real key hold.** An instantaneous key down and up may not move a WebKit page at all.
- **Touch screens have no hover and no mouse wheel.** A test that scrolls with the wheel needs a desktop context.
- **Launch flags are engine-specific.** WebKit refuses to start when it receives a switch it does not know, so the Chromium switches now go only to Chromium projects. Before that fix, the WebKit project could not start at all.

None of these are browser bugs. They are documented platform behavior that a single-engine suite never has to learn.

## How I told the two groups apart

For each failure I asked one question: would a person using this browser notice?

If yes, the site changes. If no, the test changes, and the new version states the user-facing behavior and not the mechanism. "The link is reachable by keyboard" survives across engines. "Focus lands on this element after one Tab press" does not.

Changing a test to pass is uncomfortable. The comment beside each change says which platform behavior it accounts for, so the next reader can tell an adaptation from a weakened assertion.

## The result

After the fixes, Chromium, Firefox, and Mobile Chrome passed all 2,973 tests. WebKit and Mobile Safari passed with two retried checks each, both in the same shared reading navigation at a wide viewport with enlarged text. I am treating those as flaky and they are still on my list.

The matrix now runs every week. It is too slow for every pull request, and engine differences do not appear that often.

## What I took from it

A cross-browser run is two audits at once. One audits the site. The other audits how much of your test suite describes your browser and not your product.

If your suite has only ever run in Chromium, run it once elsewhere before you need to. Expect the first run to fail, sort the failures with the question above, and schedule the matrix so it never goes that long without running.
