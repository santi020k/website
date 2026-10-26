# Website v4 archive

This app preserves the released v4.0.0 website from commit
`2e8171e9e4c8bd7b3229aae9fdf94833a33a86a4` (October 8, 2026). Its public route
is `/v4/`; the root application is the current v5 design.

Source content, assets, package label, stored Medium feed and layout come from that
snapshot. Build-time publication filtering and year-based labels remain fixed to
October 2026. Archive maintenance removes live comments, Webmentions, newsletter
fetches and service-worker registration, isolates browser storage, and preserves
keyboard access. The shared archive builder disables form submissions, scopes
local URLs, adds indexing exclusions and supplies exit links.

Use the root workspace catalog and lockfile. Do not reintroduce the historical
lockfile, deprecated framework integrations, or current-site content. The original
syntax themes and source appearance remain intact. Run `pnpm run build` from the
root for assembled output; run `pnpm --filter @santi020k/website-v4 dev` for isolated
development. See [website history](../../docs/website-history.md) for captures and
verification.
