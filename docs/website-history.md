# Website history

The current website stays at `/`. `/history/` is an indexable timeline of five
visual eras, with authentic desktop and mobile captures and usable archives.

The Chapter spread hero leads with the complete current-era capture and a joined
caption, followed by two smaller archive previews. One fine border and sculpted
frame contain the capture and its ruled footer. The compact version label and
the shared branded Today pill align on a baseline and wrap when space is limited.
Images remain in normal flow with native figure captions and responsive sources.
Narrow and enlarged-text layouts reflow the previews without cropping or overlapping them.

The Timeline index shortcuts follow the hero in chronological order. Each native
fragment link pairs its version with a date, chapter description, and directional
arrow. A shared rule connects the five eras; the current era uses the accent.
The index reflows into two columns, then one, as its available width decreases.

Each chapter uses the Stacked sheets introduction: version, date, and chapter
status share a paper-like card with its title and description. The Split exhibit
below pairs the complete desktop and mobile captures in one sculpted surface,
with a version/address header and separate device captions. Narrow and enlarged-text
layouts stack the introduction and captures, keeping the mobile capture aligned
to the right. The archive action follows the exhibit. The chapter anchors and
full-document archive links remain usable without JavaScript.

The Archive colophon closes the timeline with the preservation heading and a
book seal beside the unchanged explanatory copy. A fine accent rail separates
the two columns, becoming a top rule when the note stacks on narrow screens.
The original preservation contract remains visible as native aside content.

## Preservation contract

The archive labels are curated eras, not retroactive release tags:

| App | Snapshot date | Source commit | Selection |
| --- | --- | --- | --- |
| `apps/v1` | 2026-04-01 | `9ec27f26c9cc3445d2ae8c0334d086073aa07ab5` | Mature original portfolio before the April home redesign |
| `apps/v2` | 2026-05-01 | `088440c28dfcafaf50042421f5ecbd4ffcb75021` | Final stable main snapshot before the v3 visual expansion |
| `apps/v3` | 2026-09-25 | `8dd64f95a18878638bfc08d39196718d3e5f1d46` | Final v3.11.0 snapshot before v4 |
| `apps/v4` | 2026-10-08 | `2e8171e9e4c8bd7b3229aae9fdf94833a33a86a4` | Published v4.0.0 before the v5 editorial redesign |

V5 is the current chapter. V3, V4, and V5 show their release versions; V1 and V2
remain curated era labels. The current metadata date records the design chapter,
not proof of a production deployment.

Design, local content, assets, and stored Medium feed entries are frozen. Software
is maintained: every app uses the same current pnpm catalog and lockfile. Original
package versions remain in the archive manifests for historical footer labels;
these private apps are excluded from Changesets versioning. Do not restore an old
lockfile or deprecated framework integrations to preserve appearance.

Owner-requested withdrawals also remove unpublished drafts and their unused assets
from archive sources.

Archives contain no analytics, service-worker registration, live comments,
Webmention requests, or working newsletter submissions. No newsletter RSS snapshot
was stored for v3, so that page keeps its empty-state behavior instead of showing
present-day issues. v1's Alpine tabs use native keyboard navigation. All versions
use distinct theme, search-history, and package-manager storage keys where relevant.

Keyboard maintenance preserves the original appearance of each era. Mobile
navigation supports Enter and Space activation, Tab and Shift+Tab through the
visible navigation controls, Escape dismissal, and focus restoration. Closing,
reopening, resizing to desktop, and client-side navigation must not leave focus
inside a hidden panel or retain a stale scroll lock. Search owns keyboard focus
while its dialog is open. V2's scrolled header state follows the current page
after navigation. V1's unused post and series
layouts are outside the rendered archive: its routes cover the homepage,
portfolio, technologies, and error page.

Accessibility maintenance also preserves readable project content with enlarged
text. V1 portfolio tabs and project card labels wrap within the available width.
V1 project badges wrap and use valid Tailwind v4 color tokens; v3 project pills, action labels, metadata and prose fit their reading column. Header controls
in v2 and v3 reflow when their enlarged contents no longer fit one row. These
repairs keep each era's content and visual identity rather than applying the
current website's editorial layout to historical pages.

Utility controls follow the same rule. The archive notice uses relative text and
wrapping links, and stays in normal flow without JavaScript. On archive pages only,
`packages/website-history/archive-banner.js`, copied into each archive, measures
it with `ResizeObserver` and sets
`data-website-archive-ready` plus `--website-archive-banner-height` on `<html>`;
that pins the notice (at most 45dvh, scrolling vertically) and reserves its real
height for body padding, `scroll-padding-bottom` and `#back-to-top`. Astro client
navigation remeasures the new notice. Keyboard focus scrolling accounts for the
fixed notice and header after lazy content layout settles. Pointer focus and
fixed controls retain their own behavior. Hidden v2/v3 back-to-top buttons are `inert`;
activating one from the keyboard moves focus to `#main`. The v3 footer directory and
v2 contact rows choose columns from their own container width, and v2's copy-email
button reports success or failure in a polite status message.

## Workspace and build

The current Astro app stays at the root to retain existing content, CV, release,
and deployment paths. Archive apps live in `apps/`; their shared Astro setup,
metadata, and output transformations live in `packages/website-history`.

- `pnpm install`: install the entire workspace with Node 24 and pnpm 11.
- `pnpm run build`: generate current assets, build all five apps with Turborepo,
  then assemble one static `dist/` deployment. Each archive's `apps/vN/turbo.json`
  caches its `dist/`, so a rebuild replays an unchanged era in under a second. The
  cache key covers the app's tracked files, its resolved dependencies,
  `pnpm-workspace.yaml`, `packages/website-history/`, and the variables in the root
  `globalEnv`. The current site always rebuilds. Run `pnpm exec turbo run
  build:site --force` to ignore cached archives.
- `pnpm run dev`: develop the current app and timeline.
- `pnpm --filter @santi020k/website-v2 dev`: develop an individual archive.
- `pnpm run preview`: serve the assembled production output. Use this for checking
  archive URL rewriting, notices, disabled forms, and version switching.
- `pnpm run lint` and `pnpm run check`: validate current and archive apps.

Staged checks run in small serial batches so importing a complete historical era
does not exhaust a single ESLint process. All lint and type checks remain enabled.

Archive builds use Astro's `/vN/` base for generated assets. The shared build hook
prefixes historical root-relative navigation, media, CSS URLs, and search indexes.
It marks absolute same-origin links leaving an archive for a full document load,
including the v4 footer wordmark, so another app never inherits its script state.
Assembly adds a persistent archive notice with full-document links to `/history/`
and the current equivalent route. When that route does not exist, it links to `/`.
The current service worker bypasses all `/vN` namespaces, including assets.

Every archive HTML document has `noindex, follow`. Assembly also adds
`X-Robots-Tag: noindex, follow` to `/vN` and `/vN/*` in Cloudflare `_headers`, covering
non-HTML assets. Archives have no sitemap integration and never enter the current
sitemap. Do not block them in robots.txt: crawlers must read the exclusion signal.
The timeline and current pages retain ordinary canonical URLs and remain indexable.
Content-hashed `/vN/_astro/*` assets receive one-year immutable caching; archive
HTML and stable asset names retain their existing revalidation policy. The archive
audit checks both header policies and the full-document exit markers.

## Captures and verification

After a complete build, start `pnpm run preview --host 127.0.0.1 --port 4321`, then
run `pnpm run history:screenshots`. Set `HISTORY_PREVIEW_URL` for another local port.
The script captures actual rendered homepages at 1440 × 1000 and 390 × 844 in light
mode with reduced motion. Before saving each capture, it requires a successful
page response and the matching version/date archive notice for historical eras.
The current homepage must not contain an archive notice.
It also checks loaded images and hides only the preservation notice for the exhibit.
The resulting WebP files in `src/assets/website-history`
are intentional product assets. Rebuild after updating them. Do not replace them
with fabricated previews.

Changes to archive plumbing require unit coverage of URL, storage, and submission
boundaries, plus `tests/website-history.spec.ts` against combined production output.
`tests/archive-keyboard.spec.ts` covers mobile menu activation, focus order,
interrupted closing animations, desktop resizing, and client navigation.
`tests/legacy-project-reflow.spec.ts` covers project readability and header
controls at normal and doubled text sizes in light and dark themes.
Inspect mobile/desktop and light/dark behavior, keyboard controls, search results,
archive notices, and current-page return links. Run the repository completion gate.

Deployment remains the existing GitHub Actions / Cloudflare static pipeline.
Rollback is a deployment of the previous main commit; archives have no persisted
server data or migrations. Freeze new eras explicitly rather than silently copying
new content into an existing archive.

## Motion studio

The private [website motion studio](../apps/motion/README.md) turns the same era
metadata and authentic captures into a short film. Preview it with
`pnpm --filter @santi020k/website-motion dev`, or build and test it with
`pnpm run test:motion`. It exports three video formats locally and is excluded
from the assembled website deployment. Playback is optional; reduced motion keeps
chapter stills available. The studio README is the source of truth for timing,
render commands, prerequisites, and the visual description.
