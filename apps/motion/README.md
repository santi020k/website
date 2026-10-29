<!-- cspell:ignore HyperFrames GSAP FFmpeg FFprobe MP4 Holizna -->
# Website motion studio

A private Astro workspace for **A website, over time**: a 30-second film about the
five design eras of santi020k.com. It follows the Lumen motion studio strategy:
local assets, one paused GSAP timeline, an interactive preview, and local
[HyperFrames](https://hyperframes.app/docs/1-startup/2-quickstart) MP4 exports.

## Preview and export

Use the repository's Node 24 and pnpm 11 versions, from the repository root:

```bash
pnpm --filter @santi020k/website-motion dev
pnpm --filter @santi020k/website-motion build
pnpm --filter @santi020k/website-motion lint
pnpm --filter @santi020k/website-motion check
pnpm --filter @santi020k/website-motion test
pnpm --filter @santi020k/website-motion check:composition
pnpm --filter @santi020k/website-motion render:portrait
pnpm --filter @santi020k/website-motion render:square
pnpm --filter @santi020k/website-motion render:landscape
```

The preview runs at `http://127.0.0.1:4342/`. Playback starts only on request.
Chapter buttons seek to fully assembled frames. Switching format preserves the
selected chapter. Reduced motion disables playback and keeps still-frame controls.
Preview messages check origin, sender, shape, and finite seek values.

Tests build on the canonical `pnpm run test:motion` command, start their own preview
on port 4343, and use installed Chrome. Set `WEBSITE_MOTION_PORT` to a free port if
needed. Install Chrome before running this workspace's browser tests.

Browser tests launch Chrome with `--disable-audio-output`. Chromium keeps its audio
output path but [substitutes a fake OS-level stream](https://chromium.googlesource.com/chromium/src/+/f29eb01290cd36a30177ecf8197f906c01088a0d),
so music tests do not depend on host audio devices, which can leave native media
time stuck at zero. The tests verify
element playback and timeline synchronization, not physical speaker output. Preview
and render commands do not use this flag.

Local rendering needs Chrome, FFmpeg, and FFprobe. All exports use 30 fps:

| Format | Dimensions | Output |
| --- | --- | --- |
| Portrait | 1080 × 1920 | `renders/website-history-portrait.mp4` |
| Square | 1080 × 1080 | `renders/website-history-square.mp4` |
| Landscape | 1920 × 1080 | `renders/website-history-landscape.mp4` |

The three films include an edited excerpt of **Chills by Holizna**, dedicated to
the public domain under CC0 1.0. See [source, license, and edit details](audio/README.md).
The preview starts paused with music off; its Music button enables playback on
request. Seeking, pausing, switching format, and reduced motion stop the audio.
There is no voiceover. Render commands disable HyperFrames telemetry. Files remain
local; rendering does not publish or deploy them.

## Story and source

| Time | Chapter |
| --- | --- |
| 0–4 s | Purple brand reveal: A website, over time |
| 4–8 s | V1: personal introduction and selected work |
| 8–12 s | V2: purple identity, writing, and projects |
| 12–16 s | V3: shared design system and product family |
| 16–20 s | V4: warmer portrait and sculpted editorial canvas |
| 20–24 s | V5: editorial spreads, case-study evidence, and reading paths |
| 24–30 s | Closing signature: Always a work in progress |

The metadata comes from `packages/website-history/versions.json` and `current.json`.
The real desktop and mobile captures come from `src/assets/website-history/`.
V1 and V2 are curated design eras, not retrospective release numbers. The film
uses the same snapshots as the history page and does not regenerate the exhibits.
Update captures through the existing history capture workflow, then rebuild here.

`src/composition.ts` owns chapter timing and change summaries.
`src/pages/[format].astro` owns the shared film structure. `src/scripts/timeline.ts`
owns every animation and registers the timeline using the composition ID, as
required by the [GSAP authoring contract](https://hyperframes.app/docs/3-guides/3-gsap-animation).
`src/styles/composition.css` owns format-specific layout and uses public Theme tokens.
The preview uses Lumen buttons, badges, and links.

`src/components/BrandBookend.astro` shares the opening and ending structure across
all three formats. The official Theme mark, animated signature, and four nested
frames connect the identity to the five eras. Square and portrait layouts have
their own type sizes, spacing, and safe margins; they are not cropped exports.
The decorative frame group intentionally continues beyond the canvas edge; only
that group declares HyperFrames' `data-layout-allow-overflow` contract. Text and
brand content remain inside the composition.

There are no browser-clock CSS animations or live embedded websites in the film.
Seeking is deterministic, including backwards. Generated assets, stills, static
output, and renders are ignored. The studio is excluded from deployment assembly
and Changesets versioning; production website dependencies do not import it.

Exports use screenshot capture. The accelerated capture path produced an empty
frame during local verification, so render scripts explicitly disable it.

Portrait content leaves space for social overlays, but each platform's upload
preview must be checked before publication. The ending links to the visible,
indexable history page. Attribution: [Santiago Molina](https://santi020k.com).

## Validation and recovery

`pnpm run verify:fast` checks the studio alongside the website and archives,
including its own build and browser tests. `check:composition` additionally checks
all export formats with HyperFrames. Tests verify local assets, chapter text and
layout, deterministic seeking, keyboard controls, reduced motion, music playback
and recovery, and preview accessibility. They save temporary representative stills
under `renders/stills/`, including both bookends in every format.

To revise or remove this film, edit or remove the private workspace and its root
scripts/catalog entries. It has no production data or public runtime contract.
Do not manually edit generated `dist/`, `public/assets/`, or MP4 output.

## Homepage product film

`/products/` is the approved six-shot, 30-second landscape composition.
`/products-portrait/` reflows the same scenes at 1080 × 1350 for phone players;
it does not crop the landscape export. The player selects the matching film
and poster when opened, keeping controls and typography visible at narrow sizes.
It uses the shared Theme tokens, Montserrat, and the existing CC0 soundtrack.
The home page serves the exported MP4 only after a visitor requests playback.

| Time | Scene | Source |
| --- | --- | --- |
| 0–3s | I build products | Santiago brand mark and typography |
| 3–9s | Lumen UI | Recorded task input and priority switch in the real Lumen workbench |
| 9–13s | Web, native, connected | Existing web and SwiftUI playground captures |
| 13–21s | PostLens | Recorded Filters, Vibrant, and original comparison |
| 21–26s | Developer tools | Existing project logos, including the square ESLint Config Basic mark |
| 26–30s | Built by Santiago | Brand ending and canonical author URL |

Recordings in `captures/` were made locally on October 28, 2026. Lumen used the
local docs workbench with illustrative data. PostLens used the development
2.1.0 simulator build and the repository's generated alpine-lake fixture, with
no personal photo-library or customer data. The Lumen crop follows the workbench to remove focus-induced page scrolling.
Idle moments were trimmed and the
PostLens interaction was accelerated for the eight-second scene. These captures
demonstrate interfaces; they do not establish store or provider availability.
The native Lumen scene is a still capture, identified separately from recordings.

The PostLens film and homepage previews have one rounded screen edge. The ESLint
logo is the original square SVG from its documentation site. Shared project
assets are imported directly from the main site's content directory.

```bash
pnpm --filter @santi020k/website-motion build
HYPERFRAMES_NO_TELEMETRY=1 pnpm --filter @santi020k/website-motion exec hyperframes check dist/products --strict
HYPERFRAMES_NO_TELEMETRY=1 pnpm --filter @santi020k/website-motion exec hyperframes render dist --composition products/index.html --output ../../public/media/products/santi020k-products.mp4 --fps 30 --quality delivery --workers 2 --experimental-fast-capture=false
```

Render the phone cut with `--composition products-portrait/index.html` and
`--output ../../public/media/products/santi020k-products-portrait.mp4`.
Run the strict composition check against `dist/products-portrait` as well.

The shipped posters and localized WebVTT tracks live beside the MP4 files. Keep their
timing aligned when changing the composition. Review desktop and mobile playback,
caption selection, focus restoration, video failure, and JavaScript-free access.
