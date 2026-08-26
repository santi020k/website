# Blog cover art direction

Blog covers should make the archive feel like one technical publication while giving every post
a distinct central idea. They are editorial artwork, not social cards: the site renders the title,
post type, and reading time separately, and the Open Graph pipeline creates its own 1200 × 630
share image.

## Asset contract

- Save the final image as `cover.webp` beside the post's `index.md` or `index.mdx` file.
- Export at exactly 1600 × 900 pixels (16:9).
- Keep the focal content inside the central 80% for card and hero crops.
- Optimize WebP output for visual quality; the current archive uses quality 88.
- Reference the asset as `./cover.webp` in `coverImage.src`.
- Describe the visible metaphor in `coverImage.alt`; do not copy the title or begin with
  “Editorial cover for”.

`pnpm run lint:content` verifies the filename, format, and dimensions for every post cover.

## Shared visual language

Use a deep graphite, subtly purple-tinted environment with off-white, deep brand purple, and
lilac as the collection palette. Render crisp geometric forms using matte materials, restrained
translucent glass, subtle depth, and a controlled violet glow. The result should feel like a
premium engineering publication: calm, precise, and readable at thumbnail size.

Every cover also carries the same atmospheric signature as the portfolio imagery:

- a near-black aubergine or midnight-navy upper field that opens into brand purple;
- a broad, soft violet sweep across the lower foreground rather than a flat black floor;
- restrained circular line work or grid geometry that sits behind the subject;
- one project-derived accent when the article belongs to a named project;
- purple as the dominant collection color even when a semantic accent is present.

Project-derived accents should follow the related project cover instead of introducing a second
palette. For articles without a direct project relationship, choose the semantic accent below.
The shared signature belongs in the atmosphere and lighting; do not copy portfolio-cover text,
logos, metadata, badges, or their left-copy/right-logo composition into editorial artwork.

Use one restrained semantic accent when it helps explain the topic:

| Accent | Meaning |
| :----- | :------ |
| Cyan | Interaction, performance, shared structure |
| Emerald | Verification, reliability, successful outcomes |
| Amber | Diagnostics, transitions, packaging, caution |
| Coral | Risk, human stakes, exceptions |

Do not use the accent only as decoration, and do not let it overpower brand purple.

## Composition families

1. **Central system** — one core object with connected inputs, outputs, or responsibilities.
2. **Before and after** — disorder or legacy structure becoming a clearer intended state.
3. **Connected layers** — stacked or nested parts sharing tokens, behavior, or architecture.
4. **Journey through gates** — an artifact moving through checks, stages, or controlled decisions.

Choose the smallest number of elements that communicates the article's thesis. Avoid decorating
empty space with unrelated objects.

## Canonical generation prompt

```text
Use case: stylized-concept
Asset type: blog editorial cover
Primary request: visualize [central idea] as [specific visual metaphor].
Scene/backdrop: near-black aubergine or midnight-navy technical space opening into brand purple,
with subtle circular line work or grid geometry and a broad soft violet lower-foreground sweep.
Subject: [one focal system and the two or three relationships that explain the article].
Style/medium: premium dimensional technical editorial illustration; crisp geometric forms,
restrained translucent glass, matte surfaces, subtle depth; sophisticated
engineering-publication aesthetic.
Composition/framing: wide 16:9 landscape; [composition family]; generous margins; all important
content inside the central 80 percent; readable at thumbnail size.
Lighting/mood: [two or three article-specific qualities]; restrained violet glow.
Color palette: graphite, off-white, deep brand purple and lilac, with a restrained
[project-derived or semantic accent] highlight for [meaning]; purple remains dominant.
Constraints: purely visual metaphor; no text, letters, numbers, readable code, logos,
trademarks, UI screenshots, unrelated people, or watermark.
Avoid: cyberpunk clutter, excessive neon, stock illustration style, decorative noise,
and tiny details.
```

Adjust the character constraint when people are genuinely essential to the story. Product case
studies should communicate the product through its problem and system, not by imitating its logo
or interface.

## Review and acceptance

Before replacing a cover:

- Confirm the central metaphor matches the article rather than only its tags.
- Inspect the full image for accidental text, logos, watermarks, faces, and malformed symbols.
- Reject characters or brand marks that were not explicitly requested.
- Check that the focal object survives a centered 16:9 crop and remains clear at card size.
- Confirm the palette belongs to the collection while the topic accent remains restrained.
- Write alt text from what is actually visible in the accepted image.
- Normalize the accepted image to 1600 × 900 WebP before committing it to the post directory.

Generated source files can remain in the image-generation cache, but the accepted optimized WebP
must live in the repository. Git history is the recovery path for replaced archive covers.
