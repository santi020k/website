# Changelog

## 4.0.0

### Major Changes

- Introduce the v4 website design across the homepage, navigation, footer, About, Work, Projects,
  and blog. Retain public page URLs and the shared content collections while improving responsive
  layouts, keyboard navigation, theme support, and reduced-motion behavior.

  Add a travel notebook with a full-width dotted map before the introduction, interactive country
  notes, repeat visit counts, Colombian roots, and Paraguayan residence. Keep the five title-only
  travel drafts unpublished. Offer concise and full CV downloads and reveal complete project
  technology stacks through accessible disclosures.

  Use the coordinated stable Lumen 4 packages, preserve custom card spacing, and give article code examples distinct
  accessible names. Retain the local candidate preview for future library evaluation. Regenerate CV downloads from the merged design and track the Void MDX source correctly.

### Patch Changes

- Open the resume's external profile links in a new tab and include explicit
  opener protection on external links rendered from Markdown.

- Extend the sculpted design to article and project details, topic and series archives,
  technology indexes, speaking, developer experience, legal statements, and recovery pages.
  Keep filtering, reading controls, public URLs, and resume print behavior intact.
  Add a durable route coverage checklist and fingerprint the supporting-page stylesheet
  when generating resume PDFs.

- Update compatible dependency security fixes, including Sharp and shell utilities,
  and document the remaining upstream tooling advisories without suppressing them.

- Adopt Lumen motion for topic and technology lists, animated metrics, native disclosures, semantic background effects, and the existing Void product screenshot.

- Accept native dates from Astro's frontmatter parser for optional post update,
  project end, and talk dates, preserving quoted dates and omitted values.

- Feature Lumen UI first, followed by PostLens, Between Contractions, and RoadScore across personal project showcases. Include all four on the portfolio page and align project structured data with the visible order.

- Align About with the sculpted navigation and personal homepage: use the soft-smile portrait,
  quieter typography, numbered sections, solid recommendations, and consistent compact actions.
  Preserve the organization carousel, profile metadata, and existing recommendations.

- Extend the sculpted homepage design through work, projects, writing, and community sections with responsive layouts and accessible navigation.

- Refresh the site navigation with a signature tab, compact desktop controls, and an attached numbered mobile menu. Give the contact action a flat contrasting label and separate arrow tile. Keep search, theme switching, and closing reachable by keyboard while the menu is open, and preserve reduced-motion and enlarged-text support.

  Improve mobile navbar spacing and carry the new design into site search with a solid signature-tab panel, numbered suggestions, compact results, and accessible keyboard hints.

- Align the projects index with the new site design, using an editorial introduction, compact metrics,
  and a responsive project gallery while preserving technology archive layouts.

- Use public Lumen hooks for package-manager tab styling and résumé printing, adopt Lumen buttons for organization carousel controls, and expose the current blog topic through accessible Pill links. Preserve the existing appearance, pagination, and tab behavior.

- Validate external Webmention data and URLs before rendering, preserve anonymous
  author fallbacks, and prevent avatar dimension lookup failures from breaking builds.
  Send Webmention authentication in headers instead of request URLs.
  Let the browser handle partial file requests without service-worker cache interception.

## 3.11.0

### Minor Changes

- [#154](https://github.com/santi020k/website/pull/154) [`a84ac00`](https://github.com/santi020k/website/commit/a84ac00c7865d1f3201b63f72151000d42889668) Thanks [@santi020k](https://github.com/santi020k)! - Publish the santi020k Auth project and its open-source launch story, document the broader owned developer-tool ecosystem, and add the latest architecture note.
  
  Improve page transfer caching, pagination and sharing feedback, content integrity checks, internal navigation consistency, semantic markup, and accessibility coverage while refreshing the supported dependency and Santiago-owned quality toolchain.

### Patch Changes

- [#150](https://github.com/santi020k/website/pull/150) [`04d97c9`](https://github.com/santi020k/website/commit/04d97c90a6b0cc3a5ee7f4847a6dfcd7285d28d9) Thanks [@santi020k](https://github.com/santi020k)! - Add a post about moving to Zed, link the published Dep Beacon and Santi020k Theme extensions, and refresh both project entries with current editor and app support.

- [#150](https://github.com/santi020k/website/pull/150) [`04d97c9`](https://github.com/santi020k/website/commit/04d97c90a6b0cc3a5ee7f4847a6dfcd7285d28d9) Thanks [@santi020k](https://github.com/santi020k)! - Announce highlighted search results to screen readers and keep mobile navigation reliable when reopening the menu or using reduced motion.
  
  Make the shared article introduction welcome reading, gaming, and personal topics alongside software.
  
  Restore native newsletter POST submissions, respect cancelled native sharing, and bound Medium feed requests with cached fallback.
  
  Keep offline responses valid and preserve successful network requests when cache storage fails.
  
  Prevent stale search-close callbacks from affecting reopened dialogs and keep keyboard focus in the topmost overlay when mobile navigation and search are open together.

- [#150](https://github.com/santi020k/website/pull/150) [`04d97c9`](https://github.com/santi020k/website/commit/04d97c90a6b0cc3a5ee7f4847a6dfcd7285d28d9) Thanks [@santi020k](https://github.com/santi020k)! - Restore mobile menu padding, rounded borders, and an opaque background; improve dark-mode contrast and align the contact actions. Keep the menu below the header and scrollable within the available viewport, including landscape screens and larger text.

## 3.10.0

### Minor Changes

- [#148](https://github.com/santi020k/website/pull/148) [`12374eb`](https://github.com/santi020k/website/commit/12374ebe94f1e2929bbbf1718662c28075fcf82c) Thanks [@santi020k](https://github.com/santi020k)! - Welcome reading, gaming, and everyday discoveries alongside software in the blog. Make personal topics easier to find and align newsletter, feed, and social preview copy with the broader writing scope.

## 3.9.0

### Minor Changes

- [#146](https://github.com/santi020k/website/pull/146) [`df98779`](https://github.com/santi020k/website/commit/df987795edf898f6a9952d10aee953ac7e61da31) Thanks [@santi020k](https://github.com/santi020k)! - Publish the RoadScore portfolio project and launch case study.

## 3.8.0

### Minor Changes

- [#144](https://github.com/santi020k/website/pull/144) [`b4f695a`](https://github.com/santi020k/website/commit/b4f695a462414f58ca9039a69b48f1078f63ee13) Thanks [@santi020k](https://github.com/santi020k)! - Publish a tested guide for running R.E.P.O. on Apple silicon, including the DirectX 11 failure diagnosis and 64-bit graphics-runtime fix.

## 3.7.0

### Minor Changes

- [#141](https://github.com/santi020k/website/pull/141) [`bee723f`](https://github.com/santi020k/website/commit/bee723fb21953acf9fc026f982b70c352e276030) Thanks [@santi020k](https://github.com/santi020k)! - Publish the tested e-reader international firmware guide with safety boundaries, troubleshooting guidance, and generated social metadata.

## 3.6.0

### Minor Changes

- [#139](https://github.com/santi020k/website/pull/139) [`d97d6e0`](https://github.com/santi020k/website/commit/d97d6e07a533f76ace4085350a4b3da24f9b095d) Thanks [@santi020k](https://github.com/santi020k)! - Publish the Between Contractions Partner Sync architecture deep dive with a compliant editorial cover and generated social metadata.

## 3.5.0

### Minor Changes

- [#137](https://github.com/santi020k/website/pull/137) [`b69df14`](https://github.com/santi020k/website/commit/b69df1408d5d42ea6aae5724c6e8eafa88b72bcc) Thanks [@santi020k](https://github.com/santi020k)! - Publish the PostLens portfolio case study and deep-dive article with their generated social metadata, modernize the site on the latest compatible Astro, MDX, Vitest, Lumen UI, content, linting, and image-processing dependencies, and move the repository to pnpm 11 with patched transitive dependencies and explicit HAST/UNIST type contracts.

- [#137](https://github.com/santi020k/website/pull/137) [`b69df14`](https://github.com/santi020k/website/commit/b69df1408d5d42ea6aae5724c6e8eafa88b72bcc) Thanks [@santi020k](https://github.com/santi020k)! - Upgrade the portfolio to Lumen UI 2.0, migrate the Astro runtime entrypoint, adopt accessible copy actions and reduced-motion-aware reveal groups, and preserve the existing Lumen component behavior across the site.

## 3.4.2

### Patch Changes

- [#133](https://github.com/santi020k/website/pull/133) [`8d592dc`](https://github.com/santi020k/website/commit/8d592dc1f2be2ed028ba715ff361915b7eab1712) Thanks [@santi020k](https://github.com/santi020k)! - Version generated Open Graph image URLs with the website release so immutable CDN caches and social crawlers receive updated artwork.

## 3.4.1

### Patch Changes

- [#131](https://github.com/santi020k/website/pull/131) [`111203d`](https://github.com/santi020k/website/commit/111203da76d36c10d4282932d4932a9d1efe4c5a) Thanks [@santi020k](https://github.com/santi020k)! - Replace nested portfolio cover artwork in project Open Graph images with each project's dedicated logo on a clean, contrast-aware surface using the native image presentation controls in `@santi020k/og` 1.1.

## 3.4.0

### Minor Changes

- [#129](https://github.com/santi020k/website/pull/129) [`a73de52`](https://github.com/santi020k/website/commit/a73de5298e61dfeaee9d708f20f7c3fceeffc129) Thanks [@santi020k](https://github.com/santi020k)! - Launch the refreshed portfolio with a dedicated developer-experience hub, a complete speaking and community timeline, expanded project context, improved discovery and social metadata, and more resilient responsive presentation across the site.

## 3.3.0

### Minor Changes

- [#126](https://github.com/santi020k/website/pull/126) [`f8f6e0a`](https://github.com/santi020k/website/commit/f8f6e0a3e40567eb5d09e5e4b27d6105eef0805e) Thanks [@santi020k](https://github.com/santi020k)! - Show every published project in the project gallery, migrate social metadata and generated images
  to `@santi020k/og` 1.0, adopt the public Lumen 1.6 primitives, and refresh compatible dependencies.

## 3.2.0

### Minor Changes

- [`521e055`](https://github.com/santi020k/website/commit/521e05561ec05a19ee32f41019f9187c8a97b053) Thanks [@santi020k](https://github.com/santi020k)! - Redesign the projects showcase with a new logo grid, improve technology discovery with clearer stack groupings, and strengthen SEO metadata and redirects.

## 3.1.0

### Minor Changes

- [#89](https://github.com/santi020k/website/pull/89) [`d1634c4`](https://github.com/santi020k/website/commit/d1634c45f5618d75dd9f94f40ca2cf66500b21b9) Thanks [@santi020k](https://github.com/santi020k)! - Automate website versioning with Changesets release pull requests, synchronized
  GitHub labels, semantic version tags, and GitHub Releases.

All notable changes to this project will be documented in this file.

This changelog is generated from committed Changesets through the automated
release pull request.
