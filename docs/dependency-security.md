# Dependency security follow-up

## IPv6 parser denial-of-service fix

The October 22, 2026 audit found
[GHSA-rxp7-6hxx-x8q5](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5)
in `ip-address` 10.7.3, reached through Lighthouse and motion tooling's SOCKS
proxy dependencies. Repeated zone markers followed by a line terminator could
block the process while validating an IPv6 address. This development dependency
is absent from the static production site.

The existing override now selects the stable 10.7.4 patch for affected versions.
It replaces the quadratic zone scan with a linear scan while preserving accepted
addresses and supports Node 24. Remove the override once every parent dependency
resolves a patched version without it; keep the dependency audit enabled.

## Vitest development-server fix

The October 22, 2026 audit found
[GHSA-p458-7748-mcp3](https://github.com/advisories/GHSA-p458-7748-mcp3)
in Vitest UI 5.0.3. Vitest's UI, browser, and API servers could serve files that
Vite normally denies. Plain `vitest run` does not start an HTTP server and is
unaffected. The website's static production output does not include this tooling.

The shared catalog raises Vitest, its UI, and V8 coverage to 5.0.5 together,
preserving their exact peer-version alignment. This stable patch restores the
file-denial rules and supports the repository's Node 24 runtime. Keep these
packages coordinated when updating them; do not suppress the advisory.

## Version updates

[`renovate.json`](../renovate.json) configures Renovate for the pnpm catalogs: one monthly pull
request for minor and patch releases that are at least seven days old, with Astro, Vitest and
Playwright grouped separately, TypeScript held below 7, and the per-generation Lumen pins left to
manual updates. It takes effect once the Renovate GitHub app is installed for the repository.
Dependabot continues to open security updates and GitHub Actions updates.

The November 12, 2026 review raised Pagefind to 1.6.0, Turbo to 2.11.10, and Vitest with its UI
and V8 coverage to 5.1.0. Astro stays on 7.3.6: 7.4.5 resolves Vite 8.3.8 and Rolldown 1.3.2,
whose `@emnapi/runtime` 2.0.0-beta.2 fallback made `@astrojs/check` fail to load on Linux arm64
in that review. Retry it once a stable `@emnapi/runtime` 2 is resolved.

## Previous dependency review

The 2026-10-07 dependency review upgraded 17 direct packages to their latest
compatible stable registry releases, including Astro 7.3.6, Vitest 5.0.3, and
Theme 2.0.1. Lumen, Lumen Astro, and Lumen Core used coordinated npm 4.0.0
packages in that review; `pnpm-workspace.yaml` records the current versions. TypeScript stays on 6.0.3: TypeScript 7.0 lacks the programmatic API
required by Astro, MDX, and ESLint consumers. This is a compatibility constraint,
not an overlooked upgrade.

Run `pnpm run audit` to check the current graph. The final Markdown tooling
migration produces a clean audit, including development dependencies. No advisory
is ignored and no release exception is required.

The sitemap collector uses the maintained `fast-xml-validator` 1.4.2 syntax
validator alongside Fast XML Parser 5.11.2, replacing the parser package's
deprecated validator API. Validation runs during builds and adds no browser
bundle. The Markdown serializer dependency graph is deduplicated to 2.2.0 so
its directive extension and application types share the same contract.

## Published security fixes

Targeted overrides install `basic-ftp` 6.2.2, `katex` 0.18.2,
`@graphql-tools/utils` 12.0.3, and `postcss-selector-parser` 7.1.6 under older
parent dependency ranges. Their advisories no longer appear in the registry
audit. Validate Lighthouse, Markdown linting, ESLint, and the production build
when changing these overrides.

The `sprintf-js` chain was removed by migrating Lighthouse CI's only
`yaml.safeLoad` call to `yaml.load` and overriding that consumer to `js-yaml`
4.3.2. YAML 4 removes the old method and uses safe loading by default. The
exact-version `@lhci/utils` 0.15.1 patch preserves YAML and JSON configuration
loading and rejects JavaScript-specific YAML tags. Remove the patch when an
upstream Lighthouse CI release adopts the supported API and dependency.

## Braces dependency chain removed

ESLint Basic 3.6.0 and its coordinated adapters removed the ESLint dependency
chain. The only remaining `braces` consumer was `markdownlint-cli2`, through
`micromatch`, `globby`, and `fast-glob`. The registry still has no published fix
for [the advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

The website now depends directly on markdownlint 0.41.1, the same engine version
used by the former CLI. `scripts/js/lint-markdown.mjs` uses Node's native file
discovery and the unchanged rules and patterns in `markdownlint.config.json`.
Migration verification found the exact same 115 files. Regression tests cover
nested files, excluded MDX and unrelated Markdown, preserved rule exceptions,
actionable file/line/rule diagnostics, and successful and failing exit codes.
An empty match set fails instead of silently passing.

Removing the CLI removes every installed `braces` chain. Its unpublished patch,
patch whitespace exemption, and obsolete CLI-specific overrides are retired.
The installed-package braces tests are removed because that package no longer
exists in the graph; the Lighthouse YAML security regression remains in place.
`pnpm why braces` returns no installed dependency and `pnpm run audit` passes.

## Static site metadata

`src/pages/robots.txt.ts` and `src/pages/manifest.webmanifest.ts` now emit the
site's fixed crawler policy and install manifest using Astro's static routes.
The manifest reads the existing site configuration; `generate:icons` remains the
single owner of its image assets. This removes `astro-robots-txt`,
`astro-webmanifest`, their two exclusive filename-validation dependencies, and
the obsolete webmanifest Sharp override. No replacement package is introduced.
The crawler allow/disallow rules, sitemap URL, app identity, launch scope, colors,
and icon paths and dimensions remain unchanged. The old plugin's second image
encoding pass is no longer needed.

`tests/site-resources.spec.ts` verifies the built endpoints and decodes all
manifest icons. Keep Markdown parsers, Lumen, and shared archive dependencies:
their active consumers justify them, and local replacements would duplicate
substantial behavior.

The archived V1 search component was never mounted: the only import and render
were commented out, and no built V1 HTML referenced its UI or index. Its unused
component, declaration, Pagefind build command, and two packages are removed;
V2 and V3 search remain available. The current test suite also replaces its four
`toHaveClass` assertions with native `classList.contains` checks, removing
the direct `@testing-library/dom` and `@testing-library/jest-dom` dependencies.
`@testing-library/dom` remains a peer of the existing lint configuration.

## Validation and recovery

After changing dependencies, run a frozen install, `pnpm run verify:full`, and
`pnpm run audit`. The canonical full gate includes CV freshness, coverage,
production build and SEO audit, the full Lighthouse route set, and browser tests.
The focused tooling and security regression command is:

```bash
pnpm exec vitest run scripts/js/__tests__/lint-markdown.test.ts scripts/js/__tests__/dependency-security.test.ts
```

Review peer dependency diagnostics as well. The final local cleanup replaces the all-framework ESLint bundle with Basic,
Astro, Libraries, Testing, Formats, and Tools. A fresh lockfile resolution removes
385 package entries compared with the original release candidate, including unused
framework adapters. It also refreshes compatible transitive dependencies such as
TypeScript ESLint 8.71.1 and Vite 8.3.3. Lighthouse is updated to 13.5.0;
its CLI retains the safe YAML compatibility patch. Peer compatibility is checked separately from lint; the current upstream peer
constraint is recorded below, without suppressing its diagnostic. Effective-rule comparison retains the existing
coverage and enables the newer unsafe-enum-assignment error rule.

Theme 2 moves product URLs beneath `https://theme.santi020k.com/` and expands the
`SiteUrls` fields. Existing consumers use `getSiteUrls()` rather than constructing
that interface. Review the cross-site sitemap and product links against the new
canonical routes.

If an update regresses the build, revert its workspace, patch, and lockfile changes
together and reinstall with `pnpm install --frozen-lockfile`. Reverting a security
fix restores its exposure, so keep the audit gate closed until a replacement is
validated.

Restoring markdownlint-cli2 would restore the vulnerable chain. If the native
runner needs a correction, preserve the engine, configured scope, and rule set,
and fix the runner with regression coverage before reopening the release gate.

The mobile-interaction cleanup removes six direct dependencies and 21 lockfile
package entries. `pnpm audit --audit-level=moderate` finds no known vulnerabilities.
`pnpm peers check` still reports the pre-existing `eslint-plugin-jsx-a11y@6.10.2`
peer range (`^3` through `^9`) against ESLint 10.12.0. The npm registry still lists
6.10.2 as latest; the plugin runs successfully in the canonical lint gate. Do not
hide the peer diagnostic or downgrade the shared lint stack to silence it.

## October 23 Zod advisory follow-up

The updated [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) flags
versions below 4.6.6. The workspace resolves Zod 4 consumers to the stable 4.6.7
patch, which includes the collection-bound validation fix. This does not impose
limits on schemas that intentionally accept unbounded collections.

The old Zod 3 copy came from Puppeteer's Chromium BiDi dependency in Lighthouse
and the motion tooling. Updating Puppeteer Core within major 25 to its stable
[25.16.0 release](https://github.com/puppeteer/puppeteer/releases/tag/puppeteer-core-v25.16.0)
uses the maintained BiDi dependency and removes that copy without forcing Zod 4
onto a Zod 3 consumer. The overrides pin matching ranges to Zod 4.6.7 and
Puppeteer Core 25.16.0; dependency ranges starting above the bounds are unaffected.
Remove the overrides when upstream ranges require patched versions. Manifests
and the lockfile must change together.

Chromium BiDi now follows Chrome's four-part version through the official release
pipeline: the final component is represented by a semver suffix, such as
`157.0.8090-0`. This is the exact dependency of the stable Puppeteer release;
see the [upstream publishing and versioning policy](https://github.com/GoogleChromeLabs/chromium-bidi#publish-new-npm-release).
No independent BiDi version override is added.

Validate this update with the frozen install, dependency audit, workspace gate,
Lighthouse, and motion/browser checks. These are build and local tooling changes;
the website remains statically deployed.

## October 23 transitive advisory follow-up

The October 23, 2026 audit reported seven new advisories in three transitive
packages. No direct dependency, runtime, or catalog version changes. Each bounded
override selects the latest stable release within the consumer's existing major
version, so dependency ranges outside the bounds are unaffected.

- **body-parser 1.20.8** (one high):
  The [compressed request advisory](https://github.com/advisories/GHSA-27r3-jxmh-p828) is a
  denial of service from trailing bytes after a compressed request body. The only
  chain is `@lhci/cli` → `express` 4.22.3 → `body-parser`, a development
  dependency. Express 4 requires body-parser 1.x, so
  `body-parser@>=1.0.0 <1.20.9` resolves to the
  [1.20.9 release](https://github.com/expressjs/body-parser/releases/tag/1.20.9)
  rather than major 2.
- **fast-uri 3.1.8** (two moderate, two low):
  The [encoded scheme](https://github.com/advisories/GHSA-w74x-v6f9-j3xg),
  [host canonicalization](https://github.com/advisories/GHSA-wjr9-j795-jxcr),
  [relative path](https://github.com/advisories/GHSA-xhq7-xmqj-769h), and
  [suffix reference](https://github.com/advisories/GHSA-333x-w4r6-6crp) advisories cover
  scheme spoofing and injection, host confusion, and path equivalence. Every chain
  reaches it through AJV 8: Astro Check's YAML language server, Commitlint and
  Commitprompt config validation, Lighthouse, and ESLint's TSDoc config. All are
  development dependencies. The existing override's upper bound is raised to
  `<3.1.9`, resolving `fast-uri@>=3.0.0 <3.1.9` to the
  [3.1.9 release](https://github.com/fastify/fast-uri/releases/tag/v3.1.9),
  keeping AJV's major 3 range.
- **undici 8.11.2** (two moderate):
  The [EventSource advisory](https://github.com/advisories/GHSA-4qv8-2p9j-2685) is
  unbounded EventSource parser memory, and
  the [integrity advisory](https://github.com/advisories/GHSA-f72v-6w45-q472) is a
  response integrity bypass via non-lowercase algorithm tokens. Chains are
  `astro` → `unifont` → `undici` in every Astro workspace and `jsdom` 30.1.2 →
  `undici` under Vitest. The audit classifies the Astro chain as a production
  dependency path; the deployed site remains static output. The
  [8.12.2 release](https://github.com/nodejs/undici/releases/tag/v8.12.2) contains
  both fixes, and `undici@>=8.0.0 <8.12.3` resolves to the
  [8.12.3 release](https://github.com/nodejs/undici/releases/tag/v8.12.3), which
  adds follow-up fixes and requires Node 22.19.0 or later, satisfied by Node 24.
  The unused undici 7 override is removed: the installed graph contains only
  major 8, and the former 7.29.0 pin is also below the advisory's patched floor.

Remove each override once its parent dependency ranges require a patched version.
The overrides and lockfile must change together. Validate with the frozen install,
dependency audit, production build, Lighthouse, and the unit and browser suites
that exercise jsdom.

## November 3 glob, minimatch, and qs advisories

The November 3, 2026 audit reported three moderate advisories, all in development
tooling. The deployed site is static output and includes none of these packages.

- **minimatch before 11.0.1**: the
  [glob parts advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) is a
  denial of service from patterns that expand into very many parts. ESLint, its
  config array, typescript-eslint, Import X, SonarJS, and JSX A11y reached
  minimatch 3, 9, or 10, as did the glob copies below. Minimatch 11 replaces the
  matching engine, and its maintainer states that engine will not be backported, so
  `minimatch@<11.0.1` resolves to the 11.0.4 release.
- **glob 9.0.0 through 14.0.1**: the
  [cancellation advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) lets a
  walk continue after its `AbortSignal` fires. The MDX lint engine and its plugin
  loader reached glob 10, and the NestJS lint plugin reached glob 11.
  `glob@>=9.0.0 <14.0.2` resolves to 14.0.3, which is built on minimatch 11 and keeps
  the promise and sync APIs these consumers call.
- **qs through 6.16.0**: the
  [comma-format advisory](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) lets an
  array value with a non-callable `toString` throw from `qs.stringify`. The only
  chain is `@lhci/cli` → Express 4.22.3 and body-parser 1.20.9, which both require
  `~6.16.0`; the existing override's bound is raised so `qs@>=2.2.5 <6.16.2`
  resolves to 6.16.2.

Minimatch 11 changes its API: it has no default export, drops `makeRe`, and stores
matcher objects instead of regular expressions in a pattern's parts. No consumer has
adopted it yet, so two exact-version patches adapt the ones that rely on the old API:

- `patches/eslint-plugin-jsx-a11y@6.10.2.patch` calls the named `minimatch` export
  where the plugin's compiled code expected a default export.
- `patches/eslint-plugin-import-x@4.17.1.patch` matches the `no-internal-modules`
  `allow` and `forbid` globs through `Minimatch` instead of the removed `makeRe`.
  Without it, Import X fails to load and ESLint cannot start.

Both patches keep the original call when the old API exists. glob 7 reads minimatch's
former regular expressions and cannot walk patterns on minimatch 11. Its only chain
was Lighthouse CI's chrome-launcher 0.13.4 through rimraf 3, and Lighthouse CI uses
that launcher only to find installed Chrome builds; Lighthouse launches Chrome with
its own chrome-launcher 1.2.2. `@lhci/cli>chrome-launcher` resolves to 0.15.2, which
offers the same lookup and deletes profiles with Node's `fs`, removing rimraf 3,
glob 7, and inflight from the graph.

`scripts/js/__tests__/dependency-security.test.ts` checks that both patched plugins
still match their option globs. Before and after the change, ESLint lints the same
804 files with no diagnostics. Remove each override and patch once its consumers'
ranges require minimatch 11, glob 14.0.2 or later, and qs 6.16.1 or later. Validate
with the frozen install, dependency audit, full lint (current site, archives, and
motion), Markdown lint, Lighthouse, and the unit suite.
