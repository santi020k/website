# Changelog

## 4.1.0

### Minor Changes

- Apply Community dossier to the ReactJS Colombia card with a tinted title panel, numbered impact evidence, and a shared action footer. Preserve the complete community contribution, accessible links, and responsive enlarged-text layout.

- Apply Connection folio to the offline cache card with a soft header, a separate live connection-status row, synchronized icons, and readable enlarged text. Preserve retry and page-navigation behavior.

- Apply Directional folio to previous and next article navigation, with open columns, complete titles, chapter numbers, and responsive keyboard-accessible links.

- Apply Evidence rows to Privacy, Terms, and Accessibility with one shared reading
  panel, purple heading rails, and responsive columns. Preserve all policy content
  and dates, including readable layouts with enlarged text.

- Apply Gallery sheet to product previews with complete screenshots, numbered captions, and responsive reading space.

- Apply Invitation folio to speaking booking cards with a tinted invitation, a clear contact action, and ruled briefing notes. Preserve the complete brief, protected WhatsApp link, keyboard focus, and responsive reflow at enlarged text sizes.

- Add annotated Lumen and PostLens product previews, with clear development-preview
  and sample-data disclosures. Refresh featured project capabilities and public
  availability from current product and store evidence.

  Introduce three curated starting points alongside recent writing, group independent
  projects by purpose with keyboard-accessible category links, and clarify the
  contact invitation for engineering roles, product collaboration, and speaking.

- Apply Reading index to series chapter navigation, with numbered rows, an explicit current chapter, and responsive editorial spacing.

- Apply Reading slip to the curated Start here articles, with numbered headers, complete copy, and responsive cards.

- Apply Stacked sheets to the History chapters, pairing a raised introduction card
  with wider desktop and mobile captures. Preserve all chapter content, anchors,
  image alternatives, and archive navigation across responsive layouts.

- Apply System folio to the Developer Experience shipped systems cards, with soft
  category headers, aligned case-study actions, and responsive light and dark layouts.
  Preserve complete descriptions, keyboard navigation, and destinations without JavaScript.

- Apply the Timeline folio design to career cards, with semantic date rails, complete role descriptions, responsive layouts, and visible keyboard focus.

- Apply Tool ledger to the Projects technology snapshot, with featured and supporting tool rows, aligned project counts, and responsive keyboard-accessible links.

- Apply Passport folio to travel country cards with a soft cover, prominent visit counts, and numbered place rows. Preserve home and residence context, map navigation, partial-place notes, and accessible reflow at enlarged text sizes.

- Apply Wayfinding folio to 404 recovery suggestions with full-row destination links, clear descriptions, and responsive keyboard-accessible navigation.

- Add a private motion studio for the website timeline, sharing its real captures
  and era metadata. Preview the film with accessible playback and chapter controls,
  and render portrait, square, and landscape videos locally with shared branded
  bookends and a documented CC0 soundtrack.

- Add a website-history timeline with authentic desktop and mobile captures and
  usable v1, v2, and v3 archives. Maintain all apps with a shared pnpm dependency
  catalog, exclude archives from search indexing, and isolate their navigation,
  storage, and offline behavior.

### Patch Changes

- Improve article reading and search metadata: defer comments until readers approach the section,
  make wide tables keyboard-scrollable with readable text in both themes, improve code badge
  contrast, and match article copy labels to their visible text. Keep project structured images
  fingerprinted, use valid RSS author attribution, distinguish paginated archive descriptions, and
  hide decorative pagination placeholders from assistive technology.

- Restore keyboard access to archived mobile navigation, keep the Close control in
  the focus cycle, and preserve focus when menus close, reopen, resize, or navigate.
  Keep archived search controls reachable with Tab in Safari, and update V2's header
  scroll state after client navigation.

- Keep the archive notice clear of older back-to-top controls by reserving its measured height, let it scale and wrap with enlarged text, hide inactive back-to-top buttons from keyboard focus, wrap v1 portfolio tabs and project cards, reflow the v3 footer directory and v2 contact details with doubled text, and announce v2 email copy results.

- Enlarge project-cover logos using visible artwork bounds, balance smaller symbols optically, and keep vector marks sharp across responsive cover variants.

- Bundle the search controller once, keep results aligned with the latest query during slow loads,
  and test its validation and ranking rules. Serve responsive WebP fallbacks for site-owned blog
  pictures, consolidate share feedback motion, and retire unused Python resume tooling and its
  unreferenced font asset.

  Keep mutable downloads and search data fresh through the service worker, bound its cache while
  preserving the offline shell, and align static deployment headers with public routes. Share reading
  metadata across cards and articles, remove unused markup and styles, preserve keyboard focus on
  older browsers, and keep leading headings and covers visible during entrance motion.
  Keep third-party mention avatars independent of build-time network availability.

- Keep portfolio cover focus outlines visible around all four rounded card edges instead of
  clipping them to a line below the image. Preserve separate title and action indicators,
  including forced colors, and show homepage card outlines only for keyboard focus.

  Align technology project outlines and cover corners with their rounded cards.

- Restore each company's hover and keyboard-focus colors on Timeline folio career cards.

- Hide project cover shading with mobile captions and remove stray pixels around the ReactJS Colombia badge.

- Apply clear hierarchy to boxed engineering-principle cards, sharing speaking-card
  typography while preserving complete headings and the About page's editorial layout.

- Give speaking-topic cards a clear title hierarchy while preserving complete headings,
  descriptions, structured data, and responsive reading behavior.

- Apply the approved clear hierarchy to speaking-format cards, sharing the topic-card
  presentation while preserving complete headings, descriptions, and structured data.

- Simplify project artwork, preserve complete logos in mobile crops, and use text-free covers throughout the Projects gallery. Support MDX project entries in the image generator.

- Isolate cached content arrays so page sorting cannot affect other routes. Remove unused current-site helpers, retired Medium and newsletter feed loaders, the unused project-type collection, and legacy CSS utilities and animations. Preserve historical websites, active newsletter signup, and external article links. Bound responsive reading-cover widths to their source dimensions and align contributor guidance with the current Lumen composition.

- Apply compact topic cards with one readable post-count badge, a slimmer meter, and tighter spacing while preserving filtering, sorting, and keyboard navigation.

- Apply refined editorial blog cards across archives, series, related articles, and developer
  experience. Keep complete titles and summaries, plain topic labels, a reading footer, and
  visible keyboard focus without moving artwork on hover.

- Refine the Projects gallery with concise editorial descriptions, readable metadata,
  technology labels that match the artwork, and one clear project action. Preserve
  complete titles, responsive reflow, and full-card keyboard focus.

- Keep Travel, About, Projects, and Portfolio readable with enlarged text. The Travel country panel stays inside the map and scrolls, with 44px close controls and wrapping labels. Very narrow layouts move the zoom toolbar and details out of the map overlay. About, the Projects intro, and project cards stack their columns and wrap full headings, links, and pills. The About carousel sizes its pages from the rendered grid and keeps focus on an enabled control. The mobile topic filter shows complete focus rings, and History and Travel anchors land below the header without extra offset.

- Reduce initial font downloads with self-hosted Latin subsets while retaining variable weights, italic text, and full-font fallback for other scripts.

- Restore legacy technology redirects by placing exact paths before Cloudflare's
  dynamic rules, validate redirect limits and destinations during builds, and cover
  historical technology names. Keep draft and empty series out of production
  archives and unpublished series out of article navigation.

  Include the verified OG, Auth, and Between Contractions public sitemaps in the
  combined domain sitemap.

- Apply Impact rows to project Outcomes cards, preserving complete claims and accessible
  reading across measured results, written achievements, and enlarged text.

- Apply layered editorial portfolio cards with overlapping content, project-colored hover states, and one accessible case-study link.

- Reduce project cover fallbacks and search payloads, remove unused assets and overridden hero styles, and share concurrent build-time content loads. Fix article copy feedback, project modification metadata, initial header rendering, OG manifest revalidation, and service-worker response delays while retaining offline fallbacks.

- Wrap prose table cells so explanatory text fits the reading column, retain keyboard scrolling on narrow screens, simplify an older roadmap to plain list items, and describe the information in two instructional screenshots.

- Restore valid archive color tokens and readable project technology badges, reflow older project details and header controls with enlarged text, and expose current project timelines and sidebar headings with accurate HTML semantics.

- Improve older-page recovery states: keep 404 suggestions visibly linked, make failed-copy feedback readable in both themes, and replace blocked comment widgets with accessible fallback guidance. Expose comments and webmentions in heading navigation and provide machine-readable mention dates.

- Apply Margin chapters to case study summaries with numbered margins, clear headings,
  and complete narratives that remain readable with enlarged text.

- Apply the Margin note design to project Focus cards, with complete readable statements,
  theme-aware emphasis, and narrow-rail spacing that preserves enlarged text.

- Keep search usable with enlarged text and short viewports, preserve visible keyboard focus through mobile navigation, and align shared controls, cards, and reduced-motion behavior with the sculpted design. Replace the static robots and app-manifest build integrations with native Astro routes, remove V1's unmounted search build, and retire unnecessary direct test dependencies.

- Give article code-copy controls 44px touch targets and label the native mobile
  share action as "Share link", while retaining "Copy link" for clipboard-only use.

- Keep project technology disclosures, case-study summaries, and article topics readable on
  narrow screens with enlarged text. Preserve native disclosure controls and visible keyboard
  focus in both themes.

  Align Work timeline markers with their editorial rows and numeric statistics with the shared
  typography. Remove obsolete glass styling and unused statistic variants.

- Preserve focus and scroll position when filtering blog topics, including partially visible mobile controls at enlarged text sizes. Align series-step keyboard feedback with hover and keep passive article and project covers still.

- Apply Ownership ledger to project detail lists with clear lead and explanation columns,
  preserving Markdown content, semantic lists, and readable enlarged-text layouts.

- Limit package release-age exceptions to the exact OG and TypeScript lint-config versions already installed, preserving supply-chain checks for future upgrades.

- Keep generated social images and their cache versions stable when a checkout moves to a different directory, while preserving invalidation for changed content and assets.

- Apply the Project dossier treatment to At a glance and balance portfolio artwork proportions across featured, supporting, and related cards.

- Align project list markers with the first text line at normal and enlarged text sizes.
  Keep project list cards within narrow viewports when text is enlarged.

- Reduce homepage portrait transfer size and remove unused inline logo preloads. Keep hidden
  back-to-top controls out of keyboard navigation, restore focus when returning to the top,
  and include visible labels in the home and footer version links' accessible names. Use fingerprinted
  social artwork consistently in article structured data. Preserve visible card text in
  accessible link names and check label-in-name consistency in browser accessibility audits.

- Reveal tall card groups as soon as they enter the viewport so enlarged text cannot leave
  speaking, series, portfolio, and policy content invisible with animations enabled.

  Remove obsolete principle and testimonial hover effects and unused talk and newsletter
  variants. Preserve reading space inside narrow cards, and stack the newsletter field and
  labeled submit action when enlarged text leaves too little width.

  Keep a continuous keyboard focus outline around wrapped series titles.

- Improve reading-control accessibility: package-manager tabs wrap with enlarged text, the copy button no longer covers long commands or code-header language badges and filenames, code regions get descriptive labels, and the selected tab, code strings, syntax comments, language badges, and copied share state meet contrast targets in both themes.

- Keep reading actions and related-work shelves within narrow layouts at enlarged text sizes. Restore continuous series-title focus outlines, enlarge Webmention controls, and underline policy email links.

- Keep article comments in the current site theme when the theme changes before Giscus loads. Share and copy the clean article permalink instead of the address bar with its query or fragment. Keep code-block copy buttons named for code after each copy, and explain manual recovery when copying fails.

- Preserve browser history and predictable keyboard selection during search, prevent Back navigation from reopening dismissed results, and keep search open when a result opens in another tab. Respect text composition and allow keyboard shortcuts to reopen search during dismissal.

- Reflow homepage statistics and discovery rows, technology pills, history chapters, and speaker
  facts for enlarged text. Keep supporting-page headlines readable within narrow columns,
  and prevent archive preview labels and address bars from crowding their frames.

  Include category names in technology group headings, show singular filtered tool counts,
  and remove the continuous decorative animation from the 404 page.

- Remove a retired developer-tool project and its draft article, artwork, optional sitemap source, and documentation references from the current website and v3 archive sources.

  Preserve old project and article links with permanent redirects to the current project and blog indexes, including trailing-slash variants and v3 archive paths.

- Use WebP portfolio fallbacks and responsive project and organization images, share rendered content headings with layouts, and avoid repeated header and back-to-top DOM updates during scrolling. Reuse hashed offline assets without redundant writes, fetch PDF downloads only after activation, and avoid full-font downloads for common article symbols and unsupported emoji. Let page layouts omit hidden background decorations and consume Lumen's public stylesheet directly.

- Keep linked headings clear of the sticky header and let long article and project rails scroll within the viewport with visible focus and active markers. Fit the homepage hero, history exhibit, cover captions, technology and project pills, resume contacts and corner labels, and talk headings and links to narrow screens and enlarged text. Switch the header to its attached menu and compact controls when enlarged text leaves too little room. Keep the footer version link clear of the Back to Top control and stop article metadata tiles from moving on hover.

- Keep the table of contents marker on the linked section with enlarged text by patching Lumen's Anchor runtime to activate headings at their native fragment landing position. Stack article and project sidebars below the prose, move the homepage portrait below its heading, and stack hero metadata labels when enlarged text leaves too little room, while keeping the default layouts unchanged.

- Apply sculpted statistics cards with icon tiles, shaped corners, prominent values, and responsive layouts across speaking, writing, and technology archives.

- Keep article series titles readable with enlarged text and preserve keyboard focus outlines
  inside rounded navigation rows.

  Restore visible focus on article cards, improve dark pagination contrast, reflow enlarged
  project metadata, and respect reduced motion on repository icons.

- Reuse landscape article image transforms across listings and detail pages, fill their existing natural-aspect frames, and reset navigation progress before its next forward animation. Preserve the selected theme before client navigation swaps the document to avoid a first-frame light flash. Keep contained portrait covers and reduced-motion behavior unchanged.

- Restyle series cards with soft editorial surfaces, plain status and topic labels, and one accessible full-card link.

- Give testimonials a split editorial layout with a tinted author column, complete quotations, and responsive stacking for narrow screens and enlarged text.

- Keep reduced-motion reading targets and joined landing frames synchronized after client navigation and text enlargement by applying spacing immediately. Preserve strict geometry checks, wait for destination initialization and ancestor entrance animations, and measure search-dialog contrast after its fade completes.

- Apply Stack ledger to project technology cards, preserving complete lists, native
  keyboard disclosures, and readable layouts with enlarged text.

- Keep technology summary totals, organization logos, and carousel controls inside their
  containers on narrow screens and with enlarged text. Replace the older technology panel's
  mesh decoration with the shared solid surface and medium-weight labels.

  Give speaking timelines and community panels more room for enlarged copy and complete
  keyboard link labels. Preserve existing navigation, focus, and native link behavior.

  Reflow topic cards around enlarged text, give links complete accessible names, and remove their
  obsolete decorative stripe. Keep supporting-page eyebrows neutral in both themes and bring
  History captions up to the shared metadata size.

- Keep Work, Speaking, Technologies, Developer Experience, Resume, the policy pages, 404, and the topic and series archives readable with enlarged text. Shared sections, statistics, and card grids stack or drop columns when their root-relative width runs out instead of squeezing words, and single-column grids no longer widen past the screen. Timelines move their markers above narrow rows, the Technologies search field stays inside its card, and the resume contacts and downloads reflow on screen without changing print or the PDFs. Work career rows now show a visible inset focus outline, and the Developer Experience field guides link lands at its heading.

  Match the resume download accessible name to its visible label for voice control.

- Remove mismatched rectangular backgrounds from RoadScore and Nebular project artwork while preserving their original logos.

- Make travel destinations easier to explore with a visible grouped country picker, named next-country and previous-country controls, and a mobile close action that returns to the map without resetting its view.

- Improve travel map details with country silhouettes and readable place lists, and give mobile visitors a taller map with details below it.

- Refine the travel card's next-country hover and keyboard focus with a stable, transparent row, an underlined destination, and an inset arrow highlight.

- Keep WebKit reading-layout geometry stable when text is enlarged after client
  navigation, preserving native TOC fragment alignment and highlighting. Remove
  prose caption margins from code headers and keep copy-button hit areas stable
  during hover and press while retaining 44px touch targets.

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

- Preserve GitHub label hex colors as YAML strings when consolidating the release.

- Track local résumé render dependencies in CV freshness checks and retire the previous
  service-worker cache during the v4 rollout. Verify both PDF links initiate downloads.

- Remove the vulnerable Markdown glob-tooling chain by using the same markdownlint
  engine and rules with native Node file discovery. Retire the braces mitigation
  patch and retain the full dependency audit gate.

- Include the render year in CV freshness checks and preserve legacy Webmention
  reply content alongside modern text values. Improve the repository overview,
  site navigation, developer-tool map, and local verification guidance.

- Upgrade OG to 1.2.0 and the coordinated ESLint 3.6 package family. Refresh
  social card compositions and use content-versioned manifest URLs in page metadata
  while preserving custom artwork. Replace the Playwright detection workaround
  with the shared configuration's explicit browser-test scope.

- Remove 93 unused primitive style definitions and replace supported Lumen internal
  selectors with public styling contracts and site-owned hooks. Preserve active
  utilities and document the remaining Timeline, WorldMap, and ThemeToggle parts
  that lack public styling hooks in 4.0.0.

- Return keyboard focus to the travel map when closing country details with a
  pointer, including browsers that do not focus clicked buttons.

- Fetch page HTML from the network first during Astro client-side navigation,
  retaining cached pages for offline use. Release offline connection listeners
  during navigation and rebind them when returning to the offline page.

- Remove unused legacy page components and font-import configuration. Replace the
  all-framework ESLint bundle with the applicable owned packages and refresh the
  compatible transitive dependency graph without weakening lint rules. Add a
  complete built-page integrity audit for local links, assets, fragment targets,
  duplicate IDs, and page landmarks. Keep phone metadata behind a separate lazy
  chunk and validate search-index responses so malformed data offers retry rather
  than breaking result rendering.

- Extend the Signature frame across About, Work, Projects, and the Blog landing
  page while preserving their distinct layouts. Keep the quiet dock for Travel,
  reading pages, and archives, and stack Projects statistics when space is tight.

- Join the homepage navbar and hero with the Signature frame design. Refine the
  attached mobile menu with coordinated motion and blur, and carry the stepped
  shape into search. Preserve keyboard focus while search results are loading.

- Preserve authored search titles and descriptions without automatic truncation or filler.
  Add focused search titles for the homepage, selected tutorials, and personal projects;
  clarify selected About, portfolio, newsletter, and article copy. Remove FAQ markup from
  speaking topics and use verified case-study update dates in project sitemap entries.

- Unify the Blog landing and shared buttons, labels, newsletter, and Back to Top with
  the sculpted design. Keep long mobile article grids visible and show complete titles
  at narrow widths. Preserve the background balls and improve dark-theme link contrast.

- Open the resume's external profile links in a new tab and include explicit
  opener protection on external links rendered from Markdown.

- Refresh compatible dependencies and npm Lumen 4 integration guidance. Remove legacy
  vulnerable tooling chains and apply the upstream braces nesting mitigation while retaining
  the registry audit blocker until a fixed release is published.

- Preserve modification dates in the combined sitemap, fetch shared Theme product sitemaps
  once, reject malformed source metadata, and safely serialize caller-provided structured data.

- Preserve the blog topic filter's viewport position in both navigation directions after
  destination page initialization. Verify transition completion and subsequent scroll stability.

- Refresh the visual README, Lumen v4 project overview, and contribution guidance. Add
  content correction reports and accessibility context, and extend full Lighthouse validation
  across eight release routes.
  Include dependency patch changes in CI and retain manual Lighthouse diagnostics.

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
