# Package improvement opportunities

These findings came from integrating `@santi020k/og` 1.0.0 and Quality CLI 0.3.1 into the
`santi020k.com` production image pipeline. They are upstream opportunities, not local blockers.

## `@santi020k/og`

- Track a local `preset.brand.logo` as a cache source automatically. `definePresetConfig()` already
  adds `preset.typography.file`, but a changed local logo does not currently invalidate cards unless
  every consumer also lists it in `cache.sources`.
- Normalize or reject local embedded formats that the SVG renderer cannot decode. In this setup,
  WebP logo and cover data URLs produced valid cards with empty visual panels; converting the same
  sources to PNG data URLs before preset rendering made them visible. A preset-level normalization
  step would keep this workaround out of consumer configs.
- Validate `definePageMetadata()` values at runtime, or expose an opt-in validating companion. A
  JavaScript config can currently pass display labels such as `"Homepage"` as the Open Graph type;
  the valid contract is `website`, `profile`, or `article`, and the identity helper cannot catch it.
- Let `paginateArchive()` and `groupArchive()` derive route-manifest `title`, `description`, and
  `alt` fields from preset card data. Their current route descriptors contain only `pathname`, so
  consumers need a second enrichment pass to produce a complete public manifest.
- Decouple content variants from fallback artwork, or add an explicit `decoration: false` /
  `fallbackVisual: false` option. Today `article`, `docs`, and `product` always reserve a narrow
  visual layout and render a generic illustration when no image exists; consumers must switch to
  `simple` or return an undocumented empty string even when the semantic variant still applies.
- Support additive decoration layers before and after the built-in cover visual. The current
  `preset.decoration()` callback replaces the complete visual slot, so a consumer cannot apply the
  same ambient treatment across image-free and cover-backed cards without rebuilding the package's
  private image markup.
- Pass documented visual-slot bounds and small SVG composition helpers to `preset.decoration()`.
  The slot is powerful, but consumers currently need to infer its coordinates from the built-in
  preset implementation to align meaningful custom artwork reliably.
- Refine `santi-og migrate --report` so it recognizes existing `createCards()` usage. The current
  report recommends moving a large catalog through `createCards()` even when the config already
  does so for its static catalog.

## Quality CLI

- Add a first-class `santi-og` adapter that can run `check` before a build and parse `audit` output
  after a build. A generic task runs the commands today, but cannot surface image path, staleness,
  dimensions, or metadata findings as structured Quality diagnostics.
- Support task dependencies or phases for work before, during, and after a build. This would let
  the OG check share generated state with the repository build without duplicating work or hiding
  the relationship inside one package script.
- Add artifact-aware changed checks. A source change to a font, logo, renderer, or content cover
  should be able to select the affected generated images through the OG manifest and cache graph
  rather than treating the generator as an opaque repository-wide task.
- Avoid parsing routine progress output such as Astro's timestamped `[content]` and `[types]` lines
  as generic warnings. Project tasks that exit successfully can currently fail the Quality gate
  because ordinary framework status lines look diagnostic-like to the generic parser.
