# santi020k.com

<p align="center">
  <a href="https://santi020k.com/">
    <img src="./public/og/pages/index.webp" alt="Santiago Molina — Engineering Leader and Full-Stack Architect" width="1200" height="630">
  </a>
</p>

<p align="center">
  <strong>Thoughtful products. Clear systems. Useful writing.</strong><br>
  Santiago Molina’s portfolio, writing, and life outside code.
</p>

<p align="center">
  <a href="https://santi020k.com/">Website</a> ·
  <a href="https://santi020k.com/work/">Experience</a> ·
  <a href="https://santi020k.com/portfolio/">Case studies</a> ·
  <a href="https://santi020k.com/blog/">Blog</a> ·
  <a href="https://santi020k.com/travel/">Travel</a> ·
  <a href="https://santi020k.com/resume/">Résumé</a>
</p>

<p align="center">
  <a href="https://github.com/santi020k/website/actions/workflows/build.yml"><img src="https://github.com/santi020k/website/actions/workflows/build.yml/badge.svg" alt="Website quality gate"></a>
  <a href="https://github.com/santi020k/website/actions/workflows/codeql.yml"><img src="https://github.com/santi020k/website/actions/workflows/codeql.yml/badge.svg" alt="CodeQL security analysis"></a>
  <a href="./docs/lumen-integration.md"><img src="https://img.shields.io/badge/Lumen-4-620AE6?style=flat-square" alt="Built with Lumen 4"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-source--available-orange?style=flat-square" alt="Source-available license"></a>
</p>

I’m [Santiago Molina](https://github.com/santi020k), an engineering leader, full-stack architect,
and product builder. Since 2014, I’ve worked across commerce, sports media, esports, developer
tools, and native apps. This site connects that work with the decisions, experiments, and
experiences behind it.

This repository is also a working consumer of my developer tools: Lumen provides the interface
contracts, Theme supplies shared foundations, and OG generates social cards. The website keeps
its own content, editorial layouts, and application behavior. Follow the source and verification
commands below to see how those boundaries work together.

**Explore:** [The site](#explore-the-site) · [Products](#products-and-the-systems-behind-them) · [Architecture](#how-the-site-works) · [Local setup](#run-it-locally) · [Quality](#verify-a-change) · [Documentation](#find-your-next-step) · [Feedback](#feedback-and-contributions)

## Explore the site

| Start here | What you’ll find |
| --- | --- |
| [Experience](https://santi020k.com/work/) / [Case studies](https://santi020k.com/portfolio/) | Engineering roles and the systems behind the work. |
| [Projects](https://santi020k.com/projects/) | Developer tools and personal products, with their technology stacks. |
| [Writing](https://santi020k.com/blog/) | Software decisions, books, games, and everyday experiences. |
| [Speaking](https://santi020k.com/speaking/) | Talks, workshops, and community work. |
| [Travel](https://santi020k.com/travel/) | An interactive country map and personal travel notebook. |
| [Résumé](https://santi020k.com/resume/) | A readable web résumé and concise or full PDF downloads. |

Light and dark themes, keyboard search, responsive layouts, and reduced-motion support run
through the site. Browser tests cover the interactions; the accessibility statement records the
[accessibility scope and feedback path](https://santi020k.com/accessibility/).

## Products and the systems behind them

<table>
  <tr>
    <td><a href="https://santi020k.com/portfolio/lumen-ui/"><img src="./public/og/portfolio/lumen-ui.webp" alt="Lumen UI project artwork" width="560"></a></td>
    <td><a href="https://santi020k.com/portfolio/postlens/"><img src="./public/og/portfolio/postlens.webp" alt="PostLens project artwork" width="560"></a></td>
  </tr>
  <tr>
    <td><strong><a href="https://lumen.santi020k.com/">Lumen UI</a></strong><br>Shared interface foundations across web and native platforms.</td>
    <td><strong><a href="https://postlens.santi020k.com/">PostLens</a></strong><br>A visual content studio for iPhone and iPad.</td>
  </tr>
  <tr>
    <td><a href="https://santi020k.com/portfolio/between-contractions/"><img src="./public/og/portfolio/between-contractions.webp" alt="Between Contractions project artwork" width="560"></a></td>
    <td><a href="https://santi020k.com/portfolio/roadscore/"><img src="./public/og/portfolio/roadscore.webp" alt="RoadScore project artwork" width="560"></a></td>
  </tr>
  <tr>
    <td><strong><a href="https://between.santi020k.com/">Between Contractions</a></strong><br>A calm contraction timer with native apps, watches, and widgets.</td>
    <td><strong><a href="https://roadscore.santi020k.com/">RoadScore</a></strong><br>An offline road-trip game with a shared scoreboard and trip journal.</td>
  </tr>
</table>

*Generated project artwork from this repository, rather than application screenshots.*
[Browse projects](https://santi020k.com/projects/) or [read professional case studies](https://santi020k.com/portfolio/).

## How the site works

| Foundation | What it does here |
| --- | --- |
| **Astro 7 + TypeScript** | Static pages, typed content collections, Markdown/MDX, and View Transitions. |
| **Lumen 4 + Tailwind CSS v4** | Accessible Astro primitives, shared semantic tokens, and site-owned editorial composition. |
| **Native JavaScript** | Search, filtering, sharing, and progressive enhancement without a frontend framework runtime. |
| **Owned tooling** | Theme tokens, OG generation, ESLint configs, Commitprompt, Quality hooks, and Astro Doctor diagnostics. |
| **Cloudflare Pages** | Production deployment from reviewed `main`, with versioned redirects, caching, and security headers. |

The [Lumen integration guide](docs/lumen-integration.md) maps the components in use, application-owned
controllers, v4 styling contracts, and upgrade checks. The catalog and lockfile use
`@santi020k/lumen` 4.2.0 with `lumen-astro` and `lumen-core` 4.1.0 from the npm registry.
The integration guide records the version-pinned Anchor, synchronized code tabs, and CoverImage fallback patches.

Current pages share their components across English and Spanish (`/es/`). English remains the
primary language and translation fallback. The [language maintenance guide](docs/i18n.md) explains
stable message keys, translation coverage, and the authored content that stays in English.

Collection helpers in `src/utils/content.ts` cache published entries during a build and return
an independent array to each caller, so page-specific sorting cannot reorder another page.
Blog slugs must be unique across year folders. The shared post loader rejects duplicate
routes with all conflicting entry IDs; drafts and scheduled posts are excluded in production.
Project frontmatter can curate up to two `relatedWriting` post references; the shared Story pair
section omits drafts, scheduled posts, and missing entries in every environment.
Article and project routes render their collection entry once and pass its typed headings to the
layout, keeping the reading sidebar aligned with the rendered content.
Article microformats keep the local permalink as hidden, non-interactive metadata and scope the
visible author link as its own `h-card`, so author properties do not become article properties.
The current site uses its own posts and project schemas; historical integrations and styles
belong to the preserved `apps/v1`, `apps/v2`, `apps/v3`, and `apps/v4` sites. Keep those archives separate
when tracing unused code. New styling follows the [sculpted style guide](docs/sculpted-style-guide.md)
and existing Lumen contracts, rather than restoring retired utility layers.

### Content with room for a life outside code

- **Blog:** one chronological feed for software, reading, gaming, hobbies, and everyday experiences.
  Published tags generate topic archives; reading and gaming remain discoverable in the filters.
- **Travel:** Lumen `WorldMap` connects country visit counts with personal notes. Follow the
  [travel editing guide](docs/editorial/travel.md) for data and title-only drafts.
- **Projects:** `relevanceWeight` ranks personal projects across the homepage and portfolio.
  The Projects page groups entries by `purpose`: `developer-tools`, `apps`, and `experiments`,
  preserving relevance within each group and matching structured data to the visible order.
  Category links work without JavaScript; drafts remain unpublished.
- **Start here:** three published articles introduce the tools, decisions, and motivations behind
  the work. Edit `startHere.order`, `label`, and `reason` in post frontmatter; drafts and scheduled
  posts are excluded. Recent writing shows the four newest remaining posts, so no article appears
  in both homepage sections.
- **Project destinations:** the shared hero uses Destination brief for the website or repository.
  Named return reuses those names in the closing navigation, with a link back to product previews.
  Set `liveDemoName` when its identity differs from the case-study title. Archived website links
  are identified explicitly. Gallery links appear only when the rendered chapter exists;
  `previews.linkLabel` can name a client preview, such as F.W. Webb. Retain existing destination URLs.
  Optional `closingLinks` add named external resources to Unified return, as Lumen does for its
  playgrounds. Add only supplementary destinations; the website, previews, and repository still
  come from their existing metadata. Keep the closing paragraph focused on the project takeaway.
- **Project focus:** every project supplies two or three `focusAreas` entries with a short
  `label` and `description`. These form the sidebar's Scope ledger; summarize the actual work
  in the case study instead of repeating a generic project-type statement or technology list.
- **Project outcomes:** place one `ProjectOutcomesCard` in the MDX chapter that owns the
  `impactMetrics`, after its introduction. Pass the collection ID as `projectId`; the component
  reads the existing claims. Keep contextual galleries before the card and do not add a sidebar copy.
  Consolidate repeated results into `impactMetrics`; pass a removed section's fragment as the
  card's optional `id` to preserve existing links without repeating its heading or list.
- **Technical highlights:** use `ProjectTechnicalHighlights` for chapter-specific Connected folios.
  Supply the client, existing Markdown heading and fragment, and grouped canonical technology labels.
  Use `{ label: 'React', technology: 'React.js' }` when display copy differs from the index label.
  Links and project counts come from the published collection; missing destinations fail the build.
- **Client chapters:** wrap authored Markdown headings in `ProjectClientMasthead` for Client masthead.
  Separate the client name and subtitle with the component's data attributes; retain the heading's
  full text and punctuation so chapter navigation and existing fragments stay stable.
  The desktop contents rail uses Captioned chapters for `Name: description` headings,
  deriving its two-line labels and named overview links from that same heading text.
- **Opening context:** set `notesLayout: context-lead` and wrap the authored opening heading
  and introduction in `ProjectContextLead`. Its `projectId` supplies the notes label and
  current stage; `headingId` retains the original fragment. This replaces the generic preface.
- **Narrative subsections:** wrap plain Markdown h3 headings in `ProjectSectionHeading`
  for Section cadence. The original heading and fragment remain the navigation source;
  galleries, technical folios, and other composed sections retain their own headings.
- **Closing reflection:** `ProjectSynthesis` uses Synthesis spread to pair existing client
  perspectives with one shared takeaway. Keep the authored Markdown heading in its slot
  so the original closing fragment remains part of chapter navigation.
- **Product previews:** annotated application captures complement project artwork. Follow the
  [preview provenance guide](docs/editorial/project-previews.md) and
  [product accuracy record](docs/editorial/product-accuracy.md) when refreshing claims or images.
- **Search:** the header searches posts and projects; open it with ⌘K or Ctrl+K.
  If the index request stalls for 10 seconds, search offers a retry and preserves the current query.
  Its typed controller is bundled once and keeps a successfully fetched index, even an empty one,
  across page transitions until a full reload; a failed request retries on the next open.
  Recent searches keep up to five searchable queries, deduplicated case-insensitively, and saved
  history is validated on read and write. Validation, relevance, and history rules live in
  `src/utils/search.ts`. Production builds also create a lazy Pagefind index of current,
  published English article and case-study bodies. Body matches fill the remaining slots
  below title/tag matches, keeping at most eight results. The optional module, search, and
  result fetches each time out after five seconds; failures settle without removing primary
  results. Archives, drafts, and translated UI shells stay outside that index. Pagefind is
  absent in `astro dev`, where title/tag search remains usable. Safe response handling lives
  in `src/utils/full-text-search.ts`; `pagefind.yml` defines the indexed scope. Pagefind files
  bypass the service-worker cache and revalidate through HTTP across deployments.
- **Reading metadata:** cards, article headers, and structured data share `src/utils/reading-time.ts`;
  the retired Markdown plugin no longer writes unused frontmatter.
- **Content dates:** write frontmatter dates as `2026-09-04` or `4 Sep 2026`; both mean that calendar
  day at UTC midnight in every build timezone. ISO timestamps with `Z` or an offset such as
  `-05:00` keep their exact instant, and zone-less timestamps are read as UTC. Schemas, the sitemap,
  social-card scheduling, and formatted labels share `src/utils/content-date.ts`; other formats and
  nonexistent days such as `2026-02-29` fail validation.
  CI runs quality checks in Bogotá and builds browser-test pages in Tokyo to cover both sides of UTC.
  Content lint accepts LF or CRLF frontmatter and a closing fence at end of file; body text still
  participates in the distinction between title-only drafts and drafts that require artwork.

### The developer tools behind this repository

| Project | Its boundary here |
| --- | --- |
| [Lumen UI](https://github.com/santi020k/lumen) | Astro components, semantic tokens, motion, and public styling hooks. |
| [Santi020k Theme](https://github.com/santi020k/santi020k-theme) | Shared brand tokens and canonical product URLs. |
| [OG](https://github.com/santi020k/og) | Generated social artwork, versioned manifests, and metadata audits. |
| [ESLint Config Basic](https://github.com/santi020k/eslint-config-basic) | Coordinated Astro, TypeScript, browser-test, and tooling rules. |
| [Quality](https://github.com/santi020k/quality) / [Commitprompt](https://github.com/santi020k/commitprompt) | Repository hooks and validated Conventional Commits. |
| [Astro Doctor](https://github.com/santi020k/astro-doctor) | Changed-code diagnostics in pull requests. |

### Source map

| Path | Responsibility |
| --- | --- |
| `src/site.config.ts` | Metadata, navigation, and social links. |
| `src/content.config.ts` / `src/content/` | Schemas, posts, projects, and editorial data. |
| `src/layouts/` / `src/components/` | Page composition and reusable Astro UI. |
| `src/styles/global.css` / `src/styles/partials/` | Shared style boundary, tokens, and page styles. |
| `scripts/` | Assets, content checks, CV generation, sitemap, and deployment helpers. |
| `markdownlint.config.json` | Markdown rules and file scope, checked through the engine and native file discovery. |
| `src/**/__tests__/` / `tests/` | Unit and rendered browser regression coverage. |
| `docs/` | Editorial, UI, security, SEO, and deployment guidance. |

## Run it locally

Use **Node.js 24+** and **pnpm 11.25.0**, as declared in `package.json`.

```bash
git clone https://github.com/santi020k/website.git
cd website
pnpm install --frozen-lockfile
pnpm run dev
```

Open `http://localhost:4321`. Basic local development does not require service credentials.
Optional build integrations and production configuration are documented in the
[deployment runbook](docs/deployment.md).

To build and serve the static output:

```bash
pnpm run build
pnpm run preview
```

[Quality CLI](https://github.com/santi020k/quality) v1.3.0 powers repository Git hooks. Install it
with the checksum-verifying installer, then mount the hooks:

```bash
curl --proto '=https' --tlsv1.2 -fsSL \
  https://raw.githubusercontent.com/santi020k/quality/main/install.sh \
  | sh -s -- santi020k/quality v1.3.0
pnpm run hooks:install
```

Dependency installation remains non-blocking when Quality is absent and prints recovery instructions.
Normal commands use published Lumen packages. The isolated
[candidate preview](docs/lumen-integration.md#lumen-4-candidate-preview) is available for evaluating
future library changes without committing tarballs.

## Verify a change

| Command | Evidence |
| --- | --- |
| `pnpm run verify:fast` | Spellcheck, zero-warning lint, strict Astro checks, Markdown/content checks, CV consistency, unit tests, and build. |
| `pnpm run audit` | Moderate-and-higher dependency vulnerability audit, including development dependencies. |
| `pnpm run ci:verify` | Coverage, production build, Lighthouse assertions, and stable Chromium E2E alongside quality checks. |
| `pnpm run audit:seo` | Built-page metadata, canonical, and social-image audit. |
| `pnpm run audit:pages` | Every built document: local links/assets within the build directory (including responsive image candidates), fragments through page aliases and redirects, duplicate IDs, and page landmarks. |
| `pnpm run lint:content` | Frontmatter and editorial quality checks. |

For a focused browser run against an existing build:

```bash
SKIP_BUILD=1 pnpm run test:e2e:ci:stable tests/lumen-interactions.spec.ts --retries=0
```

`pnpm run test:e2e:fast` reuses an existing build; browser-test scripts install Chromium when
needed. Run `pnpm run build` first when verifying changed routes. Use `pnpm run lighthouse`
for a quick homepage lab audit. The full Lighthouse configuration also covers a long article
with code examples and the Smith Commerce case study, alongside the main landing pages.
Passing checks describe the revision tested; badges above describe their
workflow runs and do not certify an unpublished release candidate.

<details>
<summary>Generated assets and release boundaries</summary>

Builds regenerate favicons, fonts, and OG images before Astro renders pages.
OG 1.2.0 writes content-versioned image URLs to `public/og/manifest.json`; page
metadata uses those URLs so changed cards invalidate social preview caches.
A version-pinned [cache portability patch](docs/cache-strategy.md#portable-og-fingerprints)
keeps those fingerprints stable when the checkout directory changes.
Explicit custom artwork and unlisted utility-page fallbacks remain supported.
ESLint Basic 3.6.0 owns browser-test detection through `testingFiles.playwright`,
with `tests/**/*.spec.ts` declared in the site configuration. After-build scripts
assemble the cross-site sitemap, generate Cloudflare redirects, and audit SEO and local page integrity.

`pnpm run generate:project-images` discovers frontmatter and logos, producing thumbnail,
horizontal, and portrait covers. `src/utils/project-cover.ts` owns fallback selection. The
projects index and technology archives share the editorial gallery.

`pnpm run generate:cv` builds the site and regenerates résumé downloads after UI or dependency
changes. Do not edit generated files by hand.

The next release is consolidated on `release/v5.0.0`. Production publishing follows the reviewed
GitHub workflow from `main`; local validation and integration are separate from remote merge,
Cloudflare deployment, and production smoke checks. See the
[deployment runbook](docs/deployment.md) for Changesets, protected checks, and rollback.
The [v5.0.0 readiness record](docs/v5-release-readiness.md) tracks the prepared
version, final local validation, independent review, and remaining publication gates.

</details>

## Find your next step

| Resource | Use it for |
| --- | --- |
| [Contributing](CONTRIBUTING.md) | Setup, validation, contribution scope, and review evidence. |
| [Lumen integration](docs/lumen-integration.md) | Components, stable styling hooks, and v4 upgrade checks. |
| [Theming](docs/theming.md) / [Brand](docs/brand-guidelines.md) | Theme behavior and visual standards. |
| [Sitemaps](docs/sitemaps.md) | Canonical routes and cross-site search discovery. |
| [Deployment](docs/deployment.md) | Release automation, environment setup, smoke checks, and rollback. |
| [v5 readiness](docs/v5-release-readiness.md) | Current integration, browser coverage, review findings, and release gates. |
| [Cache strategy](docs/cache-strategy.md) | Browser and edge cache behavior. |
| [Security](.github/SECURITY.md) / [Incident response](docs/incident-response.md) | Private vulnerability reports and recovery. |
| [Observability](docs/observability.md) | Existing diagnostic boundaries and operational evidence. |
| [Changelog](CHANGELOG.md) | Version history. |

## Feedback and contributions

[Report a bug or accessibility problem](https://github.com/santi020k/website/issues/new?template=bug_report.yml),
[correct content or a broken link](https://github.com/santi020k/website/issues/new?template=content_correction.yml),
or [suggest an improvement](https://github.com/santi020k/website/issues/new?template=feature_request.yml).
Reports are public: remove personal information, tokens, and private screenshots. Follow the
[security policy](.github/SECURITY.md) for suspected vulnerabilities.

This is a personal, **source-available** site. Issues, suggestions, and pull requests are welcome
under the contribution terms in [LICENSE](LICENSE); the code, content, images, and brand assets
are not licensed for reuse in other products.

## Connect with Santiago

[Website](https://santi020k.com/) · [GitHub](https://github.com/santi020k) ·
[LinkedIn](https://linkedin.com/in/santi020k) · [Medium](https://medium.com/@santi020k) ·
[Email](mailto:hi@santi020k.com)

© 2026 [Santiago Molina](https://santi020k.com/). All rights reserved.

## Website history

`/history/` presents five design eras. The current Astro app remains at the root;
`apps/v1`, `apps/v2`, `apps/v3`, and `apps/v4` preserve usable historical websites. pnpm
workspaces share one maintained dependency catalog and lockfile; Turborepo builds
one combined static deployment. See [website history](docs/website-history.md)
for snapshots, SEO, storage isolation, and screenshot capture commands.

### Website history film

The private [motion studio](apps/motion/README.md) uses the real website-history
captures for a short film in portrait, square, and landscape formats. Run
`pnpm --filter @santi020k/website-motion dev` to preview it locally.

## Affected static checks

Ordinary pull requests limited to current `src/` files run current-site lint and
types, every unit and motion test, spelling, Markdown/content/CV checks and scope
regressions. Historical application lint/type checks stay in the full lane.
Production builds still include every historical site, assembly and audits;
browser and Lighthouse validation remain unchanged. Shared packages, assets,
configuration and unknown files select all checks. Release branches, pushes,
manual runs and missing Git history select full validation.

`CI_BASE_SHA=<base> pnpm ci:check` compares the merge base and local changes;
`pnpm ci:check --full` runs `verify:quality`. `pnpm verify:full` retains complete
release coverage. Revert the selector or use these full commands for recovery.

A local Node 24 benchmark at `e4ed4ca1` compared a current-site source edit in
separate fixtures with remote caching disabled. The cold pair was 259.30 seconds
full versus 95.79 seconds affected (63.1% lower). Two alternating warm pairs were
373.59/102.00 and 270.36/78.93 seconds full/affected; their medians were
321.98/90.46 seconds (71.9% lower). Full-run timings varied with host load.
These samples measure only the static lane, exclude installation, and predate
the subsequent article scroll-cue and Projects integration. They do not predict
hosted CI duration or savings for the unchanged build, Lighthouse, and browser jobs.
