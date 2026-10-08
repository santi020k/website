<!-- cspell:ignore HyperFrames GSAP FFmpeg FFprobe MP4 -->
# Website motion studio

A private Astro workspace for **A website, over time**: a 26-second film about the
four design eras of santi020k.com. It follows the Lumen motion studio strategy:
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

Local rendering needs Chrome, FFmpeg, and FFprobe. All exports use 30 fps:

| Format | Dimensions | Output |
| --- | --- | --- |
| Portrait | 1080 × 1920 | `renders/website-history-portrait.mp4` |
| Square | 1080 × 1080 | `renders/website-history-square.mp4` |
| Landscape | 1920 × 1080 | `renders/website-history-landscape.mp4` |

The three films are silent. On-screen text describes the changes; there is no
voiceover or music dependency. No hosted rendering, generated-media service, or
subscription is used. Render commands disable HyperFrames telemetry. Files remain
local; rendering does not publish or deploy them.

## Story and source

| Time | Chapter |
| --- | --- |
| 0–2 s | Opening: A website, over time |
| 2–7 s | V1: personal introduction and selected work |
| 7–12 s | V2: purple identity, writing, and projects |
| 12–17 s | V3: shared design system and product family |
| 17–22 s | V4: warmer portrait and sculpted editorial canvas |
| 22–26 s | Ending: Old ideas. Open doors. |

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

There are no browser-clock CSS animations or live embedded websites in the film.
Seeking is deterministic, including backwards. Generated assets, stills, static
output, and renders are ignored. The studio is excluded from deployment assembly
and Changesets versioning; production website dependencies do not import it.

Portrait content leaves space for social overlays, but each platform's upload
preview must be checked before publication. The ending links to the visible,
indexable history page. Attribution: [Santiago Molina](https://santi020k.com).

## Validation and recovery

`pnpm run verify:fast` checks the studio alongside the website and archives,
including its own build and browser tests. `check:composition` additionally checks
all export formats with HyperFrames. Tests verify local assets, chapter text and
layout, deterministic seeking, keyboard controls, reduced motion, and preview
accessibility. They save temporary representative stills under `renders/stills/`.

To revise or remove this film, edit or remove the private workspace and its root
scripts/catalog entries. It has no production data or public runtime contract.
Do not manually edit generated `dist/`, `public/assets/`, or MP4 output.
