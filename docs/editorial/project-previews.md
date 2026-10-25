# Product previews

Project entries can add `previews.description` and up to four `previews.images`, each
with a relative `src`, descriptive `alt`, `title`, and `caption`. Use MDX to place
the gallery after the relevant chapter introduction and before its technical
subsections. Import `ProjectPreviews` from
`@/components/molecules/ProjectPreviews.astro` and render it with the collection ID:

```mdx
<ProjectPreviews projectId="smith-commerce">

### Inside the product

</ProjectPreviews>
```

The component reads validated preview data from the project collection and renders
complete, lazy-loaded images through Lumen's Astro Image component. The authored
level-three heading puts the gallery in the correct position and depth in the
reading navigation; caption titles use level four. Include one gallery per project.
The `#inside-the-product` heading is the navigation target; the existing
`#product-previews` fragment remains available on the gallery region.

Smith places its gallery after the F.W. Webb introduction. PostLens and Lumen place
it after their two opening paragraphs, before Goals. Projects without previews do
not gain a gallery or navigation entry. Keep annotations as visible text.
Do not crop interfaces, invent product screens, or use private customer content.

## Current sources

- Lumen's `preview-web.webp` and `preview-apple.webp` are unchanged copies of
  `apps/docs/src/assets/platforms/web.webp` and `apple.webp` in the Lumen repository.
  Its platform-assets README records the October 3, 2026 web capture and the native
  playground Store capture. These use illustrative data and do not establish
  current physical-device qualification.
- PostLens's `preview-photos.webp` and `preview-editor.webp` derive from its native
  screenshot evidence under `apps/ios/fastlane/screenshots/evidence/en-US/iphone/`:
  `0D0AA99C-3746-4FE0-BAD9-010AE76769BA.png` and
  `8CC215B4-C683-41EF-8891-223A48AFF350.png`. The source manifest maps them to the
  Photos and Editor XCTest captures from candidate `3b38c041`, October 20, 2026.
  The source workflow uses generated fictional photos, never the user's library.
  Sharp resizes them to 960 pixels wide without cropping and encodes WebP at
  quality 88. Metadata is stripped by default. Astro creates delivery variants.
- F.W. Webb's `webb-home-desktop.webp` and `webb-home-mobile.webp` show Smith's
  storefront running locally with development content in a signed-out session.
  The captures use desktop and mobile layouts, with no customer account data.
  Sharp encodes the complete captures as WebP at quality 88; Astro creates delivery
  variants. The visible gallery description identifies the design as work in progress.

PostLens captions deliberately identify version 2.0 as a development preview and
disclose generated samples and illustrative scores. Recheck the public store
listing before changing that wording; a capture or local build is not a release.
Refresh from the real application and retain the disclosure whenever fixtures are
used. Do not reuse private purchase or App Review screens.
