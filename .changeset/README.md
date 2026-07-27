# Changesets

Add a changeset to each pull request that should produce a new website version:

```bash
pnpm changeset
```

Choose `patch`, `minor`, or `major` for the private `website` package and write
a visitor-focused summary. Documentation, test, and CI-only changes do not need
a changeset unless they should appear in a website release.

After changes land on `main`, the Changesets action opens or updates one release
pull request. Merging that pull request updates `package.json` and
`CHANGELOG.md`; the same workflow then creates the matching `vX.Y.Z` tag and
GitHub Release automatically.
