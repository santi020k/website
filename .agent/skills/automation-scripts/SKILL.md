---
name: Automation Scripts
description: Guidelines for the current asset, font, social image, and resume generators.
---

# Automation Scripts

Run the repository's generators from the project root with Node.js 24+ and its pinned pnpm.
Install dependencies with `pnpm install --frozen-lockfile` first.

| Task | Command | Source |
| --- | --- | --- |
| Generate favicons | `pnpm run generate:icons` | `scripts/js/generate-favicons.mjs` |
| Generate full and Latin-subset fonts | `pnpm run generate:fonts` | `scripts/js/generate-fonts.mjs` |
| Generate social images | `pnpm run generate:og` | `scripts/js/generate-og-images.js` |
| Force social image regeneration | `pnpm run generate:og:force` | Same OG configuration |
| Generate project artwork | `pnpm run generate:project-images` | `scripts/js/generate-project-images.mjs` |
| Generate both resume PDFs | `pnpm run generate:cv` | `scripts/js/generate-resume-pdf.mjs` |

## Resume PDFs

The canonical content is `src/pages/resume.astro` and its referenced project collections.
`generate:cv` first builds the website, then prints its short and full resume variants through
Playwright. It writes `public/pdf/cv.pdf`, `cv-full.pdf`, and `cv.source.json` together.
Run `pnpm run check:cv` to verify the source fingerprint and PDF integrity. Inspect rendered PDFs
after changing content or print styles. The Markdown files under `scripts/py/` are editorial
reference drafts, not generator inputs.

The retired Python PDF and static-weight font generators are no longer used. The project artwork
generator still consumes `public/fonts/Montserrat-Bold.ttf`; preserve that font.

## Fonts and images

The Node font generator reads the committed variable TTF files, writes full WOFF2 files, and derives
Latin subsets from the actual `unicode-range` declarations in `src/styles/partials/base.css`.
Keep the full fonts for characters outside those ranges and for social-image rendering.

The OG package owns rendering, concurrency, fingerprints, and tracked-output cleanup. See
`docs/cache-strategy.md` for the portable cache contract and version-pinned package patch.
Do not hand-edit generated manifests or remove compatibility aliases based on duplicate bytes.

Keep source artwork and historical website assets. Measure emitted browser assets separately from
originals; use the existing Astro image components for optimized delivery.
