# Project detail patterns

The approved Smith and Lumen treatments are the shared project vocabulary. All 25
project entries, including the unpublished Workspace Organizer draft, use the
applicable patterns. New projects should reuse these compositions rather than
introducing another project-specific review of the same section.

| Content | Treatment | Authoring contract |
| --- | --- | --- |
| Opening | Context lead | Set `notesLayout: context-lead`; wrap the original h2 and all introduction paragraphs in `ProjectContextLead`. Preserve the heading fragment. |
| Narrative subsection | Section cadence | Wrap the original Markdown h3 in `ProjectSectionHeading`. Gallery, evidence and client mastheads retain their own heading treatment. |
| Outcome summary | Outcome chapter + Context trail | Give `ProjectOutcomesCard` an authored h3 and matching `headingId`. Keep `id="sidebar-outcomes"` for existing links; use `legacyId` only when another wrapper fragment already exists. Link to two or three relevant authored sections. |
| Goals | Intent brief | Use `ProjectIntentBrief labelledBy="goals"` with native `li` children containing complete Markdown statements. The data-array form remains available for plain text. |
| Product capabilities | Capability spread | Use `ProjectCapabilitySpread` with numbered `ProjectCapabilityEntry` children. Keep the descriptions, code and links. Professional responsibilities and results retain Ownership ledger. |
| Technical explanation | Architecture brief | Place authored `dt`/`dd` rows in `ProjectArchitectureBrief`. Its lead and adapter list are optional; do not invent adapters to fill the layout. |
| Release status | Release split | Use `ProjectReleaseSplit` with two evidenced states and an authored Section cadence h3. Links lead to a real download, product status, or launch note. Use only when availability differs by feature or platform; do not invent a pending release for completed projects. |
| Closing reflection | Principle close | Use an existing opening sentence as `lead` and preserve the explanation in the Markdown slot. Add audience perspectives only when the content supports them. Multi-client reflections can retain Synthesis spread. |
| Closing resources | Unified return | Use the existing website/repository metadata and `closingLinks` for additional external resources. Remove only redundant standalone destination sentences. Keep contextual and narrative references. |

Headings remain authored Markdown so desktop and mobile contents share the same
outline and native fragment links. TEDx uses “Outcome summary” for the card because
its original “Outcomes” chapter already owns `#outcomes`. Smith retains both
`#key-outcomes` and `#sidebar-outcomes` while its indexed heading is `#outcomes`.

Shared layouts already provide Hero-led facts, Hero-only stack, Scope ledger,
Chapter opener, Caption chapter contents, Reading close, Named return and related
work navigation. Galleries, comparisons, client mastheads, consumer examples and
validation references remain conditional on the project's actual content.

Preserve draft status, published-versus-development qualifications, claims, media
and destinations. A layout migration is not evidence of a product release or a
reason to add metrics. The project editorial browser checks discover all published
entries and check their openings, outcome chapters and native destinations.

Release split currently fits PostLens (live v2 versus Instagram production approval) and
RoadScore (browser/Android versus the Apple release). Other projects retain their existing
status or security qualifications. PostLens preview captures retain their development origin
and illustrative-image disclosure; launching v2 does not make those captures store screenshots.
