# Blog post instructions

These instructions apply to every post below this directory. Follow the repository-level
`AGENTS.md` first, then use these rules for post content and cover artwork.

## Post structure

- Store each post at `YYYY/<kebab-case-slug>/index.md` or `index.mdx`.
- Keep post-specific assets beside the post.
- Every post must provide `coverImage.alt` and `coverImage.src` in its frontmatter.
- Set `coverImage.src` to `./cover.webp`.

## Cover artwork

Before generating or replacing a cover, read
[`docs/blog-cover-art.md`](../../../docs/blog-cover-art.md). It is the source of truth for the
visual language, composition families, canonical generation prompt, and acceptance checklist.

- Use the image-generation workflow and adapt the canonical prompt to one clear visual metaphor
  from the post. Preserve the graphite, off-white, purple, and lilac foundation; use at most one
  restrained semantic accent.
- Generate artwork without a title, letters, numbers, readable code, screenshots, product logos,
  trademarks, watermarks, or unrelated people. The page supplies the text and branding.
- Keep the focal concept within the central 80% and make it legible at card size. Blog covers and
  Open Graph cards are separate assets; do not design the cover as an OG card.
- Inspect every result visually before accepting it. Reject or edit accidental text, malformed
  symbols, incorrect subject matter, unsafe crops, excessive neon, or decorative clutter.
- Normalize the accepted asset to exactly 1600 × 900 pixels in WebP format and save it as
  `cover.webp` beside the post. Do not keep generated PNG/JPEG intermediates in the repository.
- Write concrete alt text describing the visible metaphor. Do not copy the post title or begin
  with “Editorial cover for”.
- Do not replace an existing cover unless the requested work includes a visual change or migration.

## Verification

After adding or changing a post cover:

1. Run `pnpm run lint:content` to verify the filename, format, dimensions, and frontmatter.
2. Run `pnpm run lint:md` for Markdown quality.
3. Preview the post at representative mobile and desktop sizes, checking the crop, loading state,
   overflow, and browser console.
4. Run the broader repository checks required by the root instructions when code or shared content
   behavior also changes.
