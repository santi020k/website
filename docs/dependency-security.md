# Dependency security follow-up

The 2026-10-07 dependency review upgraded 17 direct packages to their latest
compatible stable registry releases, including Astro 7.3.6, Vitest 5.0.3, and
Theme 2.0.1. Lumen, Lumen Astro, and Lumen Core remain coordinated npm 4.0.0
packages. TypeScript stays on 6.0.3: TypeScript 7.0 lacks the programmatic API
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
its CLI retains the safe YAML compatibility patch. `pnpm peers check` reports no peer issues;
no peer warning is suppressed. Effective-rule comparison retains the existing
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
