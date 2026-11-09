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
  <a href="./docs/lumen-integration.md"><img src="https://img.shields.io/badge/Lumen-5-620AE6?style=flat-square" alt="Built with Lumen 5"></a>
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

**Explore:** [The site](#explore-the-site) · [Products](#products-and-the-systems-behind-them) · [How it works](#how-the-site-works) · [Local setup](#run-it-locally) · [Quality](#verify-a-change) · [Documentation](#find-your-next-step) · [Feedback](#feedback-and-contributions)

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
| **Lumen 5 + Tailwind CSS v4** | Accessible Astro primitives, shared semantic tokens, and site-owned editorial composition. |
| **Native JavaScript** | Search, filtering, sharing, and progressive enhancement without a frontend framework runtime. |
| **Owned tooling** | Theme tokens, OG generation, ESLint configs, Commitprompt, Quality hooks, and Astro Doctor diagnostics. |
| **Cloudflare Pages** | Production deployment from reviewed `main`, with versioned redirects, caching, and security headers. |

Architecture notes, content authoring rules, search, and date handling are collected in the
[developer guide](docs/development.md).

### The developer tools behind this repository

| Project | Its boundary here |
| --- | --- |
| [Lumen UI](https://github.com/santi020k/lumen) | Astro components, semantic tokens, motion, and public styling hooks. |
| [Santi020k Theme](https://github.com/santi020k/santi020k-theme) | Shared brand tokens and canonical product URLs. |
| [OG](https://github.com/santi020k/og) | Generated social artwork, versioned manifests, and metadata audits. |
| [ESLint Config Basic](https://github.com/santi020k/eslint-config-basic) | Coordinated Astro, TypeScript, browser-test, and tooling rules. |
| [Quality](https://github.com/santi020k/quality) / [Commitprompt](https://github.com/santi020k/commitprompt) | Repository hooks and validated Conventional Commits. |
| [Astro Doctor](https://github.com/santi020k/astro-doctor) | Changed-code diagnostics in pull requests. |

## Run it locally

Use **Node.js 24+** and **pnpm 11.25.0**, as declared in `package.json`.

```bash
git clone https://github.com/santi020k/website.git
cd website
pnpm install --frozen-lockfile
pnpm run dev
```

Open `http://localhost:4321`. Basic local development does not require service credentials.
The development server listens on localhost only. Run `pnpm run dev:host` to open it from
another device on a network you trust. Optional build integrations and production
configuration are documented in the [deployment runbook](docs/deployment.md).

To build and serve the static output:

```bash
pnpm run build
pnpm run preview
```

Contributors install the repository Git hooks as described in the
[developer guide](docs/development.md#git-hooks).

## Verify a change

`pnpm run verify:fast` runs spelling, zero-warning lint, strict Astro checks, Markdown and content
checks, CV consistency, unit tests, and the production build with its audits. The
[developer guide](docs/development.md#verify-a-change) lists every gate, focused browser runs, and
Lighthouse audits; [CONTRIBUTING.md](CONTRIBUTING.md) covers review evidence.

## Find your next step

| Resource | Use it for |
| --- | --- |
| [Contributing](CONTRIBUTING.md) | Setup, validation, contribution scope, and review evidence. |
| [Developer guide](docs/development.md) | Architecture notes, content rules, source map, checks, and generated assets. |
| [Lumen integration](docs/lumen-integration.md) | Components, stable styling hooks, and v5 upgrade checks. |
| [Theming](docs/theming.md) / [Brand](docs/brand-guidelines.md) | Theme behavior and visual standards. |
| [Sitemaps](docs/sitemaps.md) | Canonical routes and cross-site search discovery. |
| [Deployment](docs/deployment.md) | Release automation, environment setup, smoke checks, and rollback. |
| [Release checklist](docs/release-checklist.md) | Gates for the release in flight; earlier logs are in [docs/archive](docs/archive/README.md). |
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
