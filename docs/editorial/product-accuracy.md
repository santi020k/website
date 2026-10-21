# Product accuracy

Verified October 20, 2026 for the Lumen UI, PostLens, Between Contractions, and
RoadScore case studies. This is a dated editorial record, not a live release monitor.
Keep public capabilities, development previews, and store availability distinct.

## Evidence and changes

| Product | Verified evidence | Case-study wording |
| --- | --- | --- |
| Lumen UI | The [site catalog](../../pnpm-workspace.yaml) and [lockfile](../../pnpm-lock.yaml) resolve published Lumen 4 packages. The [public documentation](https://lumen.santi020k.com/) describes the web and native adapters. | Refer to the Lumen 4 family rather than repeating individual package versions. |
| PostLens | The [public App Store listing](https://apps.apple.com/app/id6804601300) and [Apple lookup](https://itunes.apple.com/lookup?id=6804601300&country=us) expose the current public app. Its description includes private planning and local reminders, and lists Instagram, Pinterest, LinkedIn, and generic formats. The [product site](https://postlens.santi020k.com/) identifies iPhone and iPad support. | Include both devices, the current destination choices, and local planning. Keep Instagram account connection and direct publishing deferred. Label the PostLens 2 screens as development previews. |
| Between Contractions | The [App Store listing](https://apps.apple.com/app/id6802499436), [Apple lookup](https://itunes.apple.com/lookup?id=6802499436&country=us), and [Google Play listing](https://play.google.com/store/apps/details?id=com.santi020k.betweencontractions) confirm public native distribution. The Apple description includes private iCloud continuity and optional Partner Sync. The [product site](https://between.santi020k.com/) also links the browser timer. | Replace the old pending-review statement with the three public destinations. Describe personal iCloud continuity separately from Partner Sync. |
| RoadScore | The [product site](https://roadscore.santi020k.com/) and [Google Play listing](https://play.google.com/store/apps/details?id=com.santi020k.roadscore) confirm Android availability. The site keeps iPhone and iPad in preparation and advertises hundreds of starter cards. | State Android and browser availability, retain the iPhone and iPad boundary, and avoid a fixed card count that can drift with the catalog. |

The PostLens public listing was still in the version 1 family at verification.
The newer website and local native development branch are not evidence of a
PostLens 2 App Store release. Screenshot provenance and disclosures are recorded
in [product previews](project-previews.md).

The sibling source checks also confirmed these implementation details:

- PostLens's `apps/ios/PostLens/Models/SocialPlatform.swift` exposes four current
  destinations. TikTok and X remain only as identifiers for reading older saved
  data, so the case study no longer advertises them as named presets.
- Between Contractions's `pnpm-workspace.yaml` uses Astro 7. The case study names
  Astro without duplicating a version that is maintained in the product repository.
- RoadScore's local `apps/web/site-config.mjs` still had empty store destinations.
  The live product site and signed-out Google Play listing were authoritative for
  public Android availability. A stale checkout must not override those observations.

## Refresh before the next release

1. Read the current product contract and shipped behavior. Check store listings
   directly for availability; a source branch, screenshot, or successful build
   does not prove public distribution.
2. Check each claimed capability against the current app or its public product
   documentation. Preserve any distinction between released and upcoming tools.
3. Prefer product capabilities and supported platform families over patch numbers,
   changing catalog totals, prices, or unverified launch dates.
4. Update the case study's `updatedDate` when its substantive content changes.
   Refresh this record's date and links when evidence is checked again.
5. Run content, Markdown, and spelling checks, then include the changed entries in
   the website's normal build and rendered verification.
