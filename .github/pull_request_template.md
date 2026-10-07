# Pull request

## Change

<!-- Explain the problem, the resulting behavior, and why this approach fits the site. -->

## Related issue

<!-- Link the relevant issue, such as Fixes #123. -->

## Validation

<!-- List commands actually run and their results. Include exact blockers when a check cannot run. -->

- [ ] `pnpm run verify:fast`
- [ ] `pnpm run audit` for dependency or release changes
- [ ] Relevant browser and accessibility checks for route or interaction changes
- [ ] `pnpm run ci:verify` for release or substantial visual changes

## Review evidence

- [ ] Tests and nearest documentation reflect the resulting behavior
- [ ] Public URLs, canonical metadata, sitemap, and redirects reviewed when routes change
- [ ] Lumen public contracts and semantic tokens used for UI changes
- [ ] Mobile/desktop and light/dark screenshots attached for material visual changes
- [ ] Keyboard, visible focus, and reduced motion verified for interaction changes
- [ ] Changeset included when this change should produce a release

## Screenshots or release notes

<!-- Add comparable before/after evidence, or an after screenshot for a new surface.
For release changes include migration impact and a rollback or forward-recovery plan. -->
