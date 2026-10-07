# Contributing

Issues, corrections, and focused pull requests are welcome. This is Santiago's personal,
source-available website. Read [LICENSE](LICENSE) before contributing; it permits reference and
contributions under its terms, but does not grant reuse rights for other products.

## Report the right problem

- [Bugs and accessibility](https://github.com/santi020k/website/issues/new?template=bug_report.yml):
  include the page, reproduction, expected/actual behavior, browser, and relevant assistive settings.
- [Content corrections](https://github.com/santi020k/website/issues/new?template=content_correction.yml):
  include the sentence or broken link and a public source for the correction.
- [Improvements](https://github.com/santi020k/website/issues/new?template=feature_request.yml):
  explain the reader's task and how the proposal helps.
- **Security:** follow [the private reporting policy](.github/SECURITY.md).

Search existing issues first. Public reports must not contain secrets, private screenshots,
or personal information. Discuss substantial changes to navigation, architecture, content direction,
or dependencies before implementing them. Reports about separate products belong in their own repos.

## Local setup

Use Node.js `>=24.0.0` and `pnpm@11.25.0`, as pinned in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm run dev
```

Open `http://localhost:4321`. Install the pinned Quality CLI and run `pnpm run hooks:install`
as described in [README](README.md#run-it-locally). Never commit local environment files,
Lumen preview tarballs, credentials, or generated test reports.

## Quality gates

```bash
pnpm run verify:fast
pnpm run audit
```

`verify:fast` covers spellcheck, lint with zero warnings, strict Astro checks, Markdown/content
checks, CV consistency, unit tests, and the production build. For route or interaction changes,
run `pnpm run test:e2e:fast` after building. For release or substantial visual changes, run the
full suite, including coverage, Lighthouse, and stable Chromium browser tests:

```bash
pnpm run ci:verify
```

Record the commands actually run and any exact blockers. A local pass does not establish CI,
deployment, or production status.

## UI, content, and accessibility

- Reuse Lumen's public Astro components and semantic tokens. Follow the
  [integration guide](docs/lumen-integration.md) for runtime, styling, and upgrade checks.
- Keep application behavior in the site and use public `data-slot` hooks and roles for styling.
- Keep internal links with trailing slashes and page metadata descriptive and unique.
- Preserve keyboard access, visible focus, meaningful accessible names, and reduced motion.
- Verify material visual changes in light and dark themes at mobile and desktop widths. Include
  comparable before/after screenshots, or an after screenshot for a new page.
- Update the nearest documentation and add useful regression coverage when behavior changes.
- Regenerate CV downloads after changes affecting the résumé or its rendered styles.

## Commits and pull requests

Follow Conventional Commits and the repository's Commitprompt rules. Keep each change focused
and complete the [pull request template](.github/pull_request_template.md), including validation
and visual evidence where relevant. Do not weaken lint, type, audit, or accessibility gates.

The v4 redesign is integrated on `release/v4.0.0`; coordinate release-bound contributions with
its maintainer. Production changes require reviewed pull requests into `main`. Release metadata
uses Changesets; follow the [deployment runbook](docs/deployment.md) for the exact versioning,
GitHub workflow, production smoke checks, and rollback boundaries.
