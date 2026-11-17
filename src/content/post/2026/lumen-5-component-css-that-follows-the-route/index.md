---
title: "Lumen 5: Component CSS That Follows the Route"
description: "What changed when this site moved to Lumen 5: per-component styles, an asynchronous runtime, public styling hooks, and the checks I ran before removing the full stylesheet."
publishDate: "2026-12-22T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["design-systems", "astro", "performance", "open-source", "accessibility"]
postType: "Deep Dive"
---

A component library usually ships one stylesheet. You import it once and every page gets every component's styles, including the ones it never renders.

That was the largest single cost on this site. When I measured the shared stylesheet in October, roughly 43% of it was the full [Lumen](/portfolio/lumen-ui/) catalog.

Lumen 5 changes that default. This is what the upgrade involved on a real site, including the parts that needed care.

## Styles travel with the component

In Lumen 5, an Astro component imports its own styles. A page that renders a `Card` and a `Link` gets the CSS for those two, and a page that never shows a dialog does not load dialog rules.

The shared stylesheet shrinks to the foundation, the theme, and motion:

```css
@import "@santi020k/lumen-astro/layers.css";
@import "tailwindcss";
@import "@santi020k/lumen-astro/styles/foundation.css";
@import "@santi020k/lumen-astro/styles/themes/santi020k.css";
@import "@santi020k/lumen-core/styles/motion.css";
@import "@santi020k/lumen-astro/tailwind.css";
```

The full `styles.css` is still supported. Selective CSS is something you adopt, and the migration notes say to remove the full stylesheet only after checking every route.

## Import paths decide which routes pay

One detail surprised me. The package root re-exports every component, and Astro can follow that shared import when it assigns component styles to pages. The result is unrelated styles linked on routes that never render them.

Importing each component from its own public entry avoids it:

<!-- eslint-skip -->
```ts
import Button from '@santi020k/lumen-astro/components/Button'
```

It is a longer import. It also keeps the styles with the routes that use them, which is the whole reason for the change.

## Markup that no component renders

Automatic styles work when a component is mounted. Some markup on this site is never mounted that way.

Code tabs and tables in articles are generated from Markdown by a rehype plugin. No Astro component runs, so nothing imports their styles. The article stylesheet imports those two public entries explicitly:

```css
@import "@santi020k/lumen-astro/styles/components/code-tabs.css";
@import "@santi020k/lumen-astro/styles/components/table.css";
```

Anything created at runtime by a script has the same problem. A source audit cannot prove that a route receives the CSS it needs. You have to load the page.

## The runtime is asynchronous now

In Lumen 4, mounting the runtime loaded the interactive catalog. In Lumen 5, controllers load on demand, and the initialization function returns a promise.

For most pages nothing changes: mount `UIPrimitives` once in the shared layout and leave it there. It matters when your own code creates markup and expects it to be enhanced immediately. Await the function, or listen for `ui:ready`. A failed automatic initialization reports `ui:runtime-error`, so the failure is visible.

## Public hooks replace private selectors

Styling a library's internal markup works until the library changes a wrapper.

Lumen 5 documents `data-slot` parts for the timeline, the theme toggle, and the world map, plus a variable for the theme toggle's icon size. The travel map on this site now styles the map through those public hooks.

The general rule I follow: public props, semantic variables, `data-slot` parts, and ARIA roles are a contract. A class name that happens to be in the output is not.

## What I checked before removing the full stylesheet

The list is short, and skipping any item would have shipped a visible bug:

- Every route, in both themes.
- Client-side navigation between routes with different styles.
- Markdown-generated controls and runtime-created markup.
- Saved theme choices, comments, and scroll reveals.

Reveals needed their own look. Lumen 5 honors the requested visibility ratio and keeps content visible when reduced motion, geometry, or keyboard focus makes hiding it wrong, so tall sections are worth checking again.

## The result, with the caveat

The shared stylesheet on this site went from about 62 KB compressed after my own cleanup to about 30 KB after adopting component CSS.

The caveat is that a page now loads several smaller stylesheets. The home page links seven, and a long code article links twelve. The total a visitor downloads on one page dropped less than the shared file did. What improved most is that a route no longer pays for components it does not show.

## The archives stayed where they were

The four archived versions of this site still run Lumen 4 with their original palette. Lumen 5 refreshed the default palettes, and an archive should not change color because the current site upgraded.

The workspace pins both versions side by side, so the current site and the archives resolve different majors of the same packages.

## If you are upgrading

Preview the migration in your project first:

```bash
lumen migrate v5 --dry-run --json
```

Then treat component CSS as a separate step from the version bump. Upgrade, confirm nothing changed, and only then start removing the full stylesheet, one route group at a time. The upgrade is safe to do quickly. The stylesheet removal is the part that deserves a slow afternoon.
