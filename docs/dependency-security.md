# Dependency security follow-up

The 2026-10-07 dependency review upgraded 17 direct packages to their latest
compatible stable registry releases, including Astro 7.3.6, Vitest 5.0.3, and
Theme 2.0.1. Lumen, Lumen Astro, and Lumen Core remain coordinated npm 4.0.0
packages. TypeScript stays on 6.0.3: TypeScript 7.0 lacks the programmatic API
required by Astro, MDX, and ESLint consumers. This is a compatibility constraint,
not an overlooked upgrade.

Run `pnpm run audit` to check the current graph. The registry still reports the
high-severity `braces` advisory because its published version remains 3.0.3,
even with the mitigation below installed. The audit gate remains failing; no
advisory is ignored, and this document does not authorize a release exception.

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

## Unpublished braces mitigation

`patches/braces@3.0.3.patch` is the same patch used by the parent Lumen project.
Its source is [upstream pull request 72](https://github.com/micromatch/braces/pull/72),
commit `28d440b5dd449dbf1fe6f3506cf94ecca4d02660`; its SHA-256 is
`bfdb0c171556074c2785f98d0a7355209223df8e29dbc2ff489240c16a47da97`.
The upstream change is not a published patched release. Git attributes exempt
trailing whitespace checks only in these two exact unified patch files;
those blank-line markers are required patch syntax. Their original bytes and
other whitespace checks are preserved. Remove each attribute with its patch.

The patch bounds brace and parenthesis nesting to 100 levels across parsing,
compiling, expanding, and string serialization, caps attempts to raise that bound, and
rejects cyclic AST parent chains. Installed-package regression tests cover
ordinary globs and ranges, the 100/101-depth boundary, deep malicious inputs,
fractional limits, manually supplied ASTs, and cycles.

The remaining [registry advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
enters through Markdown and ESLint glob tooling. The website deploys static
files, but build inputs and pull requests still cross those tooling boundaries.
Do not treat a development-only dependency as automatically safe. Track the
upstream release, replace the exact patch with that published fix when available,
and retain the regression coverage.

## Validation and recovery

After changing dependencies, run a frozen install, `pnpm run verify:full`, and
`pnpm run audit`. The canonical full gate includes CV freshness, coverage,
production build and SEO audit, the full Lighthouse route set, and browser tests.
The focused security regression command is:

```bash
pnpm exec vitest run scripts/js/__tests__/dependency-security.test.ts
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
