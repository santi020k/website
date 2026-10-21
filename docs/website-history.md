# Website history

The current website stays at `/`. `/history/` is an indexable timeline of four
visual eras, with authentic desktop and mobile captures and usable archives.

## Preservation contract

The archive labels are curated eras, not retroactive release tags:

| App | Snapshot date | Source commit | Selection |
| --- | --- | --- | --- |
| `apps/v1` | 2026-04-01 | `9ec27f26c9cc3445d2ae8c0334d086073aa07ab5` | Mature original portfolio before the April home redesign |
| `apps/v2` | 2026-05-01 | `088440c28dfcafaf50042421f5ecbd4ffcb75021` | Final stable main snapshot before the v3 visual expansion |
| `apps/v3` | 2026-09-25 | `8dd64f95a18878638bfc08d39196718d3e5f1d46` | Final v3.11.0 snapshot before v4 |

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
- `pnpm run build`: generate current assets, build all four apps with Turborepo,
  then assemble one static `dist/` deployment.
- `pnpm run dev`: develop the current app and timeline.
- `pnpm --filter @santi020k/website-v2 dev`: develop an individual archive.
- `pnpm run preview`: serve the assembled production output. Use this for checking
  archive URL rewriting, notices, disabled forms, and version switching.
- `pnpm run lint` and `pnpm run check`: validate current and archive apps.

Staged checks run in small serial batches so importing a complete historical era
does not exhaust a single ESLint process. All lint and type checks remain enabled.

Archive builds use Astro's `/vN/` base for generated assets. The shared build hook
prefixes historical root-relative navigation, media, CSS URLs, and search indexes.
Assembly adds a persistent archive notice with full-document links to `/history/`
and the current equivalent route. When that route does not exist, it links to `/`.
The current service worker bypasses all `/vN` namespaces, including assets.

Every archive HTML document has `noindex, follow`. Assembly also adds
`X-Robots-Tag: noindex, follow` to `/vN` and `/vN/*` in Cloudflare `_headers`, covering
non-HTML assets. Archives have no sitemap integration and never enter the current
sitemap. Do not block them in robots.txt: crawlers must read the exclusion signal.
The timeline and current pages retain ordinary canonical URLs and remain indexable.

## Captures and verification

After a complete build, start `pnpm run preview --host 127.0.0.1 --port 4321`, then
run `pnpm run history:screenshots`. Set `HISTORY_PREVIEW_URL` for another local port.
The script captures actual rendered homepages at 1440 × 1000 and 390 × 844 in light
mode with reduced motion. It checks loaded images and hides only the preservation
notice for the exhibit. The resulting WebP files in `src/assets/website-history`
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
