# Dependency security follow-up

The 2026-10-07 dependency review refreshed compatible security fixes in
`pnpm-workspace.yaml` and `pnpm-lock.yaml`. The registry audit fell from 28
advisories to six, including removal of the critical `shell-quote` finding.
Sharp and its image processing binaries also receive the published security fix.

Run `pnpm run audit` to check the current graph. The command remains a failing
release gate while moderate or higher findings remain; this document is not an
exception or an approval to release. No advisory is ignored in configuration.

## Remaining development dependencies

These packages enter through local and CI tooling. The website deploys static
files, but build inputs and pull requests still cross the affected tooling
boundaries. Do not treat a development-only dependency as automatically safe.

| Package | Dependency path | Required follow-up |
| --- | --- | --- |
| `basic-ftp` 5.3.1 | Lighthouse and `proxy-agent` → `get-uri` → `basic-ftp` | Upgrade the parent chain to support patched 6.2.1 or newer; validate Lighthouse. [Advisory](https://github.com/advisories/GHSA-c475-qrg2-pj4r). |
| `braces` 3.0.3 | Markdown and ESLint tooling → `micromatch` → `braces` | No patched release was available. Track the upstream fix and validate glob handling when it lands. [Advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). |
| `sprintf-js` 1.0.3 | Lighthouse → `js-yaml` 3 → `argparse` → `sprintf-js` | No patched release was available. Upgrade the parent tooling when it removes the affected chain. [Advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). |
| `katex` 0.16.47 | Markdown linting → `micromark-extension-math` → `katex` | Upgrade the parent parser to support patched 0.18.2 or newer; verify Markdown parsing. [Advisory](https://github.com/advisories/GHSA-238p-pmpm-9mq7). |
| `@graphql-tools/utils` 10.11.0 and 11.2.2 | ESLint formats → GraphQL linting and configuration | Upgrade the parent tools to support patched 12.0.1 or newer; verify configuration loading and linting. [Advisory](https://github.com/advisories/GHSA-7mx3-vvmw-hjmv). |
| `postcss-selector-parser` 6.0.10 | `@tailwindcss/typography` → `postcss-selector-parser` | Upgrade the parent plugin to support patched 7.1.6 or newer; verify typography and generated CSS. [Advisory](https://github.com/advisories/GHSA-rj75-hqrm-r3gf). |

The compatible fixes preserve the existing release lines. Forcing the remaining
major or pre-1.0 minor upgrades under consumers that declare older APIs requires
separate compatibility verification. Remove each row after its dependency path
is gone and the registry audit confirms the fix.

## Validation and recovery

After changing dependencies, run a frozen install, `pnpm run verify:full`, and
`pnpm run audit`. Review peer dependency diagnostics as well. The existing ESLint
10 graph includes plugins whose declared peer ranges stop at ESLint 9
(`eslint-plugin-import`, `eslint-plugin-jsx-a11y`, and `eslint-plugin-react`);
coordinate their updates through the owned ESLint configuration packages.

If an update regresses the build, revert its workspace and lockfile changes
together and reinstall with `pnpm install --frozen-lockfile`. Reverting a security
fix restores its exposure, so keep the audit gate closed until a replacement is
validated.
