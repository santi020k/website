---
title: "How to Find and Fix Missing Alt Text in Astro"
description: "Find images with missing alt text in Astro, choose the right text for diagrams and decorative images, and check the rendered page."
publishDate: "2026-11-09"
coverImage:
  alt: "A glass diagnostic lens reveals an amber inset in a stack of violet page blocks"
  src: "./cover.webp"
tags: ["astro", "accessibility", "developer-tools", "testing"]
postType: "Guide"
---

A plain `<img>` in an Astro page can ship without an `alt` attribute even when the build succeeds. [Astro Doctor](/blog/astro-doctor-announcement/) can flag the missing attribute in the source. To fix it, decide what the image contributes and check that the rendered page gives readers the same information.

## Find images with missing alt text

Imagine an article that explains how to connect a sensor. The wiring diagram sits at `public/images/sensor-wiring.webp` and the page renders it like this.

```html
<img src="/images/sensor-wiring.webp" width="960" height="540" />
```

Astro's built-in `<Image />` and `<Picture />` components require an `alt` prop. A plain HTML image can render without one. [Astro image documentation](https://docs.astro.build/en/guides/images/#alt-text)

Run a scan from your Astro project's root.

```bash
pnpm dlx @santi020k/astro-doctor@latest --no-telemetry
```

Look for the [`astro-doctor/no-missing-alt` finding](https://doctor.santi020k.com/docs/rules/no-missing-alt/). The scan points to the source. Use it to locate the image and decide what a reader needs to know.

## Explain what the image adds

For a wiring diagram, readers need the actual connections. Give the image a short description and put the full instructions beside it, where everyone can read them.

```html
<img
  src="/images/sensor-wiring.webp"
  width="960"
  height="540"
  alt="Sensor wiring diagram. Connections are listed below."
/>
<h2>Sensor connections</h2>
<ul>
  <li>Connect sensor VCC to the board’s 3.3 V pin.</li>
  <li>Connect sensor GND to board GND.</li>
  <li>Connect sensor OUT to board GPIO 4.</li>
</ul>
```

These connections illustrate the format. Use the pins and voltage shown in your own diagram.

For a purely decorative image, use `alt=""` so assistive technology can skip it. If the image is the only content inside a link or button, describe its destination or action. For other informative images, describe the detail that matters in the surrounding content. The [W3C alt text decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/) covers each of these cases.

## Verify the fix in the source and browser

Rerun the scan and confirm that the finding for that image has cleared. Open the rendered page and read the surrounding text as if the image were unavailable. For the diagram above, the list should give you every connection. If you use a screen reader, check what it announces for the image and any enclosing link.

For checks you can repeat as pages change, add a browser scan alongside the source check. My [Playwright accessibility testing guide](/blog/playwright-accessibility-checks-that-teams-keep-running/) shows how to combine an automated scan with targeted keyboard checks.

## Run the scan in GitHub Actions

Add this step to an existing job after checkout. The action reports warnings as failures, including a missing `alt` attribute.

```yaml
- uses: santi020k/astro-doctor@ada77ece2296778b4c9a84b26229bd0c9e52c83f # v1
  with:
    comment: 'false'
    fail-on: warning
```
