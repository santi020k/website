---
title: "PostLens: A private on-device content studio"
description: "Why PostLens keeps selection, scoring, enhancement, composition, and caption preparation on the iPhone while making optional generative handoffs explicit."
publishDate: "2026-08-14T15:00:00.000Z"
draft: false
coverImage:
  alt: "Photos moving through selection, scoring, enhancement, composition, and export inside a protected phone"
  src: "./cover.webp"
tags: ["ios", "swiftui", "on-device-ai", "privacy", "photography"]
postType: "Deep Dive"
---

The most difficult part of publishing a photo is often not taking it.

It is choosing one image from a crowded library, deciding whether it needs work, fitting it to the destination, writing something useful, and exporting the result without losing quality.

[PostLens](https://postlens.santi020k.com/) is an iPhone-first visual content studio built around that path:

The workflow is **Select → Enhance → Compose → Export**.

The product deliberately stops there. It does not manage social accounts, schedule posts, track engagement, or build an analytics dashboard. That boundary lets it concentrate on visual preparation while keeping the first version private and on-device.

## Selection should begin where the library is

PostLens does not upload a photo library to score it.

The gallery prioritizes visible photos, then analyzes locally available assets in battery-aware batches while the app is open. Results are stored in a private on-device score index so the same asset does not need to be measured from zero every time.

The score uses qualities the app can explain:

- exposure
- contrast
- saturation
- warm and cool balance
- clipping
- sharpness

A score is not an artistic verdict. It is a way to reduce the first pass through a large set and surface images worth reviewing.

That distinction matters. Creative tools should support taste, not pretend to replace it with one number.

## The gallery score is only a snapshot

Once an image enters Review, the rendered edit becomes the relevant state.

A crop can change composition. An exposure adjustment can change clipping. A color change can shift the balance that contributed to the gallery score.

PostLens re-analyzes a bounded preview as the edit changes. The goal is responsive feedback without repeatedly processing the full-resolution source for every slider movement.

When quality matters for export, the full-resolution pipeline takes over.

This split keeps interaction fast while respecting the final image.

## AI looks should remain bounded and explainable

PostLens includes a tailored AI look, but the phrase “AI look” does not mean sending the image to an opaque server and accepting one generated replacement.

The app derives candidate adjustment recipes from measured signals. It renders bounded alternatives on the device, validates the results, and keeps only a candidate that satisfies the quality rules.

Natural, Vibrant, Warm, and Dramatic remain predictable manual alternatives.

That makes the intelligent path comparable to the normal editing path. It can search a larger space, but it still works with understandable adjustments and a result the user can continue editing.

## Composition needs destination context

A strong original photo can fail when it is forced into the wrong crop.

PostLens supports reusable publishing formats for Instagram, TikTok, Pinterest, LinkedIn, X, and generic exports. Destinations can offer more than one format without replacing a crop already saved for another use.

Vision helps position the subject for the selected format. The app treats that framing as a starting point, not a locked answer.

Selected images can continue into layouts or carousels without repeating the selection stage. Supporter workflows add multi-photo comparison, publishing sets, carousel building, profile grids, edit snapshots, and still-frame video export.

The core single-photo workflow remains free.

## Captions should be grounded in the photo

PostLens can prepare a short editable caption from information available on the device.

On supported iOS 26 devices with Apple Intelligence enabled, Foundation Models can add optional coaching. The app also has a deterministic fallback so selection, editing, cropping, and caption preparation do not depend on that capability.

When the user explicitly prepares or generates a caption, Apple’s system geocoder may resolve photo coordinates to a city. Raw coordinates do not enter the language-model prompt or persistence.

That is a small privacy boundary with a large effect on trust. Useful context does not require retaining the most sensitive representation of that context.

## Generative editing is a separate handoff

PostLens also supports an optional **Edit with Image Playground** action on compatible devices.

This is not silently mixed into the normal enhancement pipeline. The user sees a per-use disclosure, the app hands Apple a metadata-free render, and the accepted result returns as a fresh edit.

Apple may use Private Cloud Compute for that system experience. PostLens does not operate its own upload server.

Keeping the handoff separate makes the product state honest:

- normal scoring and editing are local
- Foundation Models coaching is optional and device-dependent
- Image Playground is an explicit Apple workflow with its own disclosure

One “AI” label would hide important differences between those features.

## Saved work should not rebuild the privacy risk

Favorites restore edit state from metadata-free copies. They keep persistent ordering without retaining source-photo metadata or favorite scores.

That design avoids a common mistake: protecting the original processing path, then building a saved-content feature that quietly recreates the sensitive dataset.

Privacy has to follow the asset through selection, editing, storage, and export.

## Localization includes the uncomfortable text

The app, permission messages, StoreKit test catalog, landing page, and support hub are available in English and Spanish.

Permission and purchase language are part of the product. They should receive the same localization care as the happy-path interface.

On-device coaching follows the device locale where supported. The support site gives both language audiences a path to report a bug, request a feature, or ask a question.

## A focused tool can be more complete

PostLens does not need to become a social network dashboard to help someone publish better visual work.

By staying focused on selection, enhancement, composition, and export, the app can go deeper on photo quality, destination formats, local processing, privacy boundaries, and a coherent creative flow.

That scope is not a limitation. It is the product.

You can [visit PostLens](https://postlens.santi020k.com/) or read the condensed [portfolio case study](/portfolio/postlens/).
