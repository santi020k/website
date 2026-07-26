<!-- cspell:words Accessibilitystatement experienceand forteams thelove -->

# UX, UI, copy, and responsive audit

Audit date: July 26, 2026

## Scope

This audit covers every distinct page and dynamic page template in the production build:

- Home, About, Work, Projects, Portfolio, Speaking, Resume
- Blog index and pagination, article, series index and detail, topic index and archive, content calendar
- Technology index and archive
- Accessibility, Privacy, Offline, and 404
- Representative professional and personal portfolio case studies

Dynamic routes were reviewed by template and with representative high- and low-density examples. Content-specific checks also covered all project headings and the generated production route inventory.

Responsive checks ran at 320, 375, 768, 1024, and 1440 pixels. Representative pages were visually checked in light and dark themes. Navigation, search, filtering, empty states, and keyboard dismissal were exercised in the browser.

## Executive summary

The visual foundation is strong. The site has a distinctive, coherent glass aesthetic, clear type hierarchy, good focus states, well-designed mobile navigation and search, and robust responsive behavior. Across the 25 audited route variants there was no page-level horizontal scrolling, missing `alt` attributes, unnamed visible controls, or duplicate IDs at any tested breakpoint.

The highest-value improvements are about trust, semantics, and getting visitors to evidence faster:

1. Correct the privacy statement. It currently says only the theme preference is stored locally, but the site also stores recent searches, caches visited pages and assets, and loads third-party services.
2. Add explicit whitespace between the plain and gradient parts of split hero headings. Several accessible names currently concatenate words, such as “for teams” becoming “forteams.”
3. Move the main content above low-value statistics on mobile directory pages.
4. Make the blog’s primary CTA lead to first-party writing, not Medium.
5. Either turn `/portfolio/` into a real selected-work gallery or stop routing the homepage’s primary CTA through an extra choice page.
6. Refresh or de-emphasize the public content calendar, which says it was last updated April 8, 2026.
7. Restore an H2 section heading on technology archive pages before their H3 project cards.

## Prioritized findings

### P0 — trust and accuracy

#### Privacy copy contradicts actual behavior

`/privacy/` says:

> Only your theme preference (light / dark) is stored locally.

The implementation also:

- stores up to five recent site-search queries in `localStorage`;
- uses Cache Storage through the service worker for visited pages and static assets;
- submits newsletter addresses to Buttondown;
- loads Giscus on article pages;
- displays public reactions sourced through Webmention.io;
- relies on Cloudflare hosting metrics, according to the existing statement.

Recommended replacement:

> This site stores your theme preference and, when you use site search, up to five recent queries in your browser. A service worker may cache visited pages and assets so previously viewed content can work offline. You can clear all of this through your browser’s site-data controls.

Add a separate “Third-party services” section that names Buttondown, Giscus/GitHub Discussions, Webmention.io, and Cloudflare, explains when each is contacted, and links to their policies. Add a visible “Last updated” date.

### P1 — accessibility, conversion, and information architecture

#### Split hero headings can merge words in the accessibility tree

Fifteen page files use the shared `PageHero`. The title expression is immediately followed by a block `<span>` without an explicit text-space node. Custom Home and About heroes use the same pattern.

Examples observed in accessible page output:

- “I build calm systems **forteams** that ship.”
- “Built for **thelove** of it.”
- “Work **experienceand** side projects.”
- “Accessibilitystatement.”
- “React.jsProjects.”

Add an explicit `{' '}` before the gradient span in `PageHero`, `HomeHero`, and the About hero. Preserve visual line breaks with `display: block`; do not rely on block layout to create spoken whitespace.

#### Directory pages delay the content visitors came for

On Work, Projects, Blog, Technology, topic archive, and paginated archive pages, visitors encounter:

1. a large hero;
2. two or three hero actions;
3. three or four stat cards;
4. only then the actual roles, projects, posts, or filters.

This is especially costly on mobile. Statistics such as tag count, total technology signals, or number of roles are weaker than the evidence below them.

Recommended order:

1. compact hero;
2. the primary list, latest item, or search/filter;
3. supporting statistics;
4. related navigation.

Keep the homepage’s outcome-oriented stats near the top; they work as social proof there. On page 2+ of Blog and topic archives, use a compact archive header and remove repeated stat cards entirely.

#### The homepage primary CTA adds an unnecessary step

“See selected work” points to `/portfolio/`, which is a two-card choice page for Work or Projects. Visitors expecting selected case studies get another navigation decision.

Choose one:

- Change the CTA to “Explore case studies” and point to `/work/`.
- Make `/portfolio/` a true selected-work gallery that mixes the strongest professional and personal case studies, then links to the full Work and Projects archives.

The second option best matches the current label and preserves `/portfolio/` as a meaningful destination.

#### The blog’s primary CTA sends visitors away

The first action on `/blog/` is “Open Medium,” even though the site hosts its own archive. That weakens first-party reading, related-content discovery, newsletter conversion, and portfolio context.

Recommended actions:

1. “Read the latest article” → latest first-party post
2. “Browse topics” → topic index
3. “Follow on Medium” → external, tertiary or inline

#### Public editorial roadmap is stale

`/blog/content-calendar/` says the roadmap was refreshed on April 8, 2026 and still frames April–September as scheduled. The page is linked from every footer, so stale planning information is unusually prominent.

Either:

- update it automatically from post status and separate “Published” from “Upcoming”; or
- remove it from the global footer and keep it as a lower-prominence “Publishing roadmap.”

Use “Last reviewed July 26, 2026” only after the roadmap is actually reconciled.

#### Technology archive skips H2

Technology detail pages render an H1, stat cards, then H3 project-card titles. Add a visible H2 such as:

> Projects using React.js

This restores a meaningful document outline and gives the card grid a useful section label.

### P2 — polish and clarity

#### Positioning language is inconsistent

The site alternates among:

- Engineering Leader & Full-Stack Architect
- Tech lead and full-stack engineer
- Senior engineer and tech lead
- Full-stack architect and engineering leader

Pick one canonical positioning line and reuse it in the homepage hero, metadata, About introduction, Resume, and footer. Suggested:

> Engineering leader and full-stack architect helping teams modernize systems, automate delivery, and improve developer experience.

If “tech lead” is the target search term for current roles, use:

> Tech lead and full-stack architect helping teams modernize systems, automate delivery, and improve developer experience.

#### “Open now” sounds transactional

Replace:

> Open now / Open to tech lead, full-stack, and engineering leadership roles

With:

> Available for tech lead, staff-level full-stack, and engineering leadership roles.

This reads naturally and removes the slash-separated status treatment.

#### Table-of-contents links are below the touch-target standard

Article and case-study table-of-contents links measure 32px tall at 375px. Increase the interactive row to at least 44px with vertical padding. Breadcrumb text links are inline-content exceptions and do not need button-sized boxes.

#### Project content uses emoji as heading icons

There are 58 emoji-prefixed H3 headings across project content, including “🎯 What I owned,” “📈 Key outcomes,” and “🛠️ Technical highlights.” They conflict with the otherwise consistent Tabler/Lumen icon language and create noisy table-of-contents labels and URL fragments.

Remove decorative emoji from headings. If a visual cue is still useful, render a consistent decorative SVG icon outside the heading text and keep it `aria-hidden`.

#### Technology taxonomy mixes tools, practices, skills, and product capabilities

The index calls 172 entries “tools and platforms,” but the collection also includes items such as Team Leadership, Public Speaking, Content Strategy, Marketing Collaboration, and Geo-location APIs.

Either:

- rename the area “Capabilities & technologies” and introduce category filters; or
- split it into “Technologies,” “Practices,” and “Domains.”

The current count communicates breadth but makes it harder to understand core expertise. Default to Core and Regular entries; collapse or filter the long Selective group.

#### Newsletter CTA is generic

Replace “Subscribe” with “Get new posts” or “Get engineering notes.” Replace “No spam” with a concrete expectation:

> Monthly at most. Unsubscribe anytime.

#### Universal footer is too promotional on utility pages

The full contact and newsletter block appears on Privacy, Accessibility, Offline, 404, and Resume. It makes these task-focused pages much longer, especially on mobile.

Add a compact footer mode for legal, error, offline, and printable/resume contexts. Keep directory links and policy links, but omit the large “Let’s build something useful together” panel.

#### Static 404 label should not be an alert

“404 · Page not found” uses `role="alert"` even though it is static page content. Remove the role; the H1 and page title already communicate the error.

## Page-by-page review

### Home

What works:

- Strong, memorable headline and clear visual identity.
- Identity, role, availability, and primary action fit in the first mobile viewport.
- Outcome-oriented stats are credible supporting evidence.
- Selected work, writing, speaking, and contact create a complete landing path.

Improve:

- Unify the role language with metadata and Resume.
- Replace “Open now.”
- Send the primary CTA directly to evidence or make `/portfolio/` show evidence.
- The page is long; keep the “More selected…” lists concise and avoid adding more sections.

Suggested hero body:

> Engineering leader and full-stack architect helping teams modernize systems, automate delivery, and improve developer experience.

### About

What works:

- Strong narrative voice and human portrait.
- Clear operating principles and collaboration modes.
- Recommendations add third-party credibility.

Improve:

- Fix the merged heading whitespace.
- Three hero buttons plus four social icons create too many first-screen choices. Keep “See selected work” primary, then one secondary “View resume”; move Speaking into the narrative or social row.
- Standardize “Medellín” with the accent in all visible location copy.
- Keep the narrative under control as more testimonials or organizations are added.

### Portfolio hub

What works:

- The professional/personal distinction is immediately clear.
- Two-card layout is responsive and easy to scan.

Improve:

- It currently duplicates navigation already available in the header.
- Convert it into “Selected case studies” with 4–6 high-signal projects and keep Work/Projects as archive links, or remove it from the homepage’s primary path.

### Work

What works:

- Clear market-facing framing around architecture, leadership, and delivery.
- Timeline and technology map show both outcomes and range.

Improve:

- Put Professional Work before the four-card stats grid on mobile.
- Keep the Resume CTA primary; reduce the hero to one secondary action.
- Replace “Technologies” count with a stronger outcome if one is available; raw breadth is less persuasive than evidence.

### Projects

What works:

- The “curiosity becomes reusable practice” framing is specific and human.
- Open-source, community, and personal work are clearly separated from client work.

Improve:

- Make the first-party project gallery the first action, not outbound GitHub.
- Move Side Projects above the stat grid on mobile.
- “Years of hands-on engineering and open-source contribution” overstates what the number measures; the dynamic year count starts at the career start date, not necessarily open-source contribution.

Suggested primary CTA:

> Explore projects

Use an in-page anchor to the project list. Keep GitHub secondary.

### Portfolio case-study template

What works:

- Role, timeline, duration, outcomes, stack, and adjacent projects form a useful case-study structure.
- Professional and personal variants remain visually consistent.
- Mobile code and media remain contained without page-level overflow.

Improve:

- Increase TOC rows to 44px.
- Remove emoji from headings and generated anchors.
- Use “Outcomes” when bullets are qualitative; reserve “Metrics” for measured results.
- Add a short “My contribution” label near the top when work was collaborative.
- Where confidentiality permits, link claims to live pages, recordings, source, or before/after evidence.

### Blog index and pagination

What works:

- Clear subject matter and consistent card system.
- Topics, series, RSS, and related-reading paths support discovery.

Improve:

- Make a first-party article the primary CTA.
- Put the latest post above archive statistics on mobile.
- On page 2+, remove the full marketing hero, stat grid, series promotion, and roadmap context. Use a compact “Blog · Page 2 of 4” header.
- Avoid adding more archive modules; the first page already has latest posts, topics, series, and roadmap.

### Article template

What works:

- Strong reading metadata, topic links, share action, related posts, and readable line length.
- Long code lines scroll inside their code container rather than widening the page.

Improve:

- Increase TOC target height.
- Change “Copy link to share” to “Copy link.”
- Ensure copy success is announced and remains visible long enough; the existing interaction should keep focus on the button.
- Consider a subtle “Code scrolls horizontally” hint only on code blocks that actually overflow at small widths.
- Load Giscus on explicit reader intent if privacy and performance are higher priorities than immediate comments.

### Series index and detail

What works:

- “Reading track” is a clear mental model.
- Part ordering, cadence, and focus areas make long-form collections navigable.

Improve:

- Fix split-heading whitespace.
- “Roadmap tracks” is author-centric; readers care more about total reading time or completion status.
- If a series is incomplete, state that near the first CTA rather than only in metadata.

### Topic index and archive

What works:

- Search, sort, live status text, count badges, and empty state all work well.
- Topic archives clearly preserve the active filter.

Improve:

- Reduce taxonomy fragmentation by merging aliases and reviewing one-post topics.
- Put the filter immediately after a compact hero on mobile; stats can follow the topic grid.
- On page 2+ of an archive, use a compact header and avoid repeating the full stats experience.

### Content calendar

What works:

- The intended publishing rhythm is transparent.
- Series connections make the roadmap more useful than a list of isolated titles.

Improve:

- Refresh the April 8 date and reconcile completed months.
- Separate Published, In progress, and Planned.
- Remove the page from the global footer if it cannot be maintained as current.
- “Content Calendar” sounds internal; “Publishing roadmap” is more reader-facing.

### Technology index

What works:

- Search, live result count, empty state, and recurrence grouping are solid.
- Core/Regular/Selective creates some hierarchy within a very large set.

Improve:

- Reframe the mixed taxonomy as capabilities plus technologies, or split it.
- Show Core and Regular first; collapse Selective behind “Show all.”
- Put search before stats on mobile.
- Replace “Signals 434” with a label visitors can immediately interpret, or remove it.

### Technology archive

What works:

- Clear filter context and route back to the full index.
- Cards consistently connect each label to shipped evidence.

Improve:

- Add an H2 before H3 cards.
- Avoid repeating near-identical description copy in the hero and stat card.
- For one-project technologies, use a compact archive layout instead of a large stats treatment.

### Speaking

What works:

- Primary action matches the page goal.
- Booking notes reduce friction and the WhatsApp prefill requests useful context.
- Topics and formats are grounded in practical delivery.

Improve:

- “One of the largest React communities in Latin America” needs evidence or softer wording.
- Two sessions from the same 2024 community event do not yet support the breadth implied by the rest of the page. Add recordings, slides, internal-session anonymized examples, languages, audience feedback, or remove unsupported breadth.
- The booking CTA appears twice; one strong closing CTA is enough after the hero.

### Resume

What works:

- Download and open-PDF actions are clear.
- Mobile stacking and print-specific styles are thoughtful.
- Roles include outcome bullets and technology context.

Improve:

- The web resume includes every professional role and every personal project, which weakens prioritization. Lead with the most recent/relevant four roles and 3–4 selected projects; link to the full Work and Projects archives.
- Replace “Languages & Interests” with separate “Languages” and “Community” or remove vague “continuous learning.”
- Tailor the summary and skills order to the target role instead of listing the full technology inventory.
- Use one canonical role title across Resume and the rest of the site.

### Accessibility statement

What works:

- Names the WCAG 2.2 AA target and acknowledges limitations.
- Barrier-report instructions request useful debugging context.

Improve:

- Add “Last reviewed” and an expected response window.
- List any known open barriers rather than only general categories.
- Use a compact footer so the policy action remains the page’s closing focus.

### Privacy

What works:

- Plain-language tone is appropriate.
- No-ad-tracker and no-profiling claims are easy to understand.

Improve:

- Correct local-storage, cache, and third-party-service disclosures immediately.
- Add a last-updated date and deletion instructions.
- Use a compact footer.

### Offline

What works:

- Explains what remains available and what may be stale.
- No page-level responsive issues.

Improve:

- Add a “Try again” control and an `online` event status so recovery does not depend on manual refresh.
- “Browse projects” points to the portfolio choice page; use “Open portfolio” or route directly to the intended cached archive.
- Use a compact footer.

### 404

What works:

- Friendly copy, clear primary recovery action, and useful alternate destinations.
- Decorative illustration is correctly hidden from assistive technology.

Improve:

- Remove `role="alert"` from the static 404 badge.
- Three buttons plus three repeated text links are redundant. Keep “Back home,” then offer Search and two contextual links.
- Use a compact footer.

## Responsive and accessibility evidence

Checked route variants:

- `/`
- `/about/`
- `/work/`
- `/projects/`
- `/portfolio/`
- `/speaking/`
- `/resume/`
- `/blog/`
- `/blog/2/`
- `/blog/content-calendar/`
- `/blog/series/`
- `/blog/series/the-santi020k-way/`
- `/blog/tags/`
- `/blog/tags/developer-experience/`
- `/technologies/`
- `/technologies/react-js/`
- `/technologies/developer-experience-dx/`
- `/portfolio/smith-commerce/`
- `/portfolio/lumen-ui/`
- a current article
- a legacy code-heavy article
- `/accessibility/`
- `/privacy/`
- `/offline/`
- an unknown route rendering the 404 page

Results:

- No page-level horizontal scroll at 320, 375, 768, 1024, or 1440px.
- No visible unnamed buttons, links, form fields, or selectors.
- No missing image `alt` attributes.
- No duplicate IDs.
- One H1 per audited page.
- Mobile navigation exposes active state, expanded state, and Escape dismissal.
- Search uses an `aria-modal` dialog, focuses the search field, exposes guidance, and supports Escape dismissal.
- Technology filtering updates an `aria-live` status and shows a clear zero-result state.
- Light and dark modes preserve the visual hierarchy on representative pages.
- Long code examples remain locally scrollable without widening the page.

Known issues from the same checks:

- Split hero text can concatenate words in accessible names.
- Technology archive headings skip from H1 to H3.
- TOC links are 32px tall instead of the project’s 44px target.
- Desktop navigation links are 40px tall. This is acceptable for pointer-heavy desktop use but could be raised to 44px for consistent target sizing.

## Recommended implementation order

1. Correct Privacy copy and add a last-updated date.
2. Fix split-heading whitespace everywhere.
3. Add H2 headings to technology archives.
4. Raise TOC rows to 44px and remove emoji from project headings.
5. Change Blog’s primary CTA and simplify page 2+ archive layouts.
6. Move directory content above stats on mobile.
7. Decide whether `/portfolio/` becomes a selected-work gallery or leaves the primary funnel.
8. Refresh and reposition the content calendar.
9. Unify positioning copy, availability copy, and newsletter CTA.
10. Add compact footer mode for legal, error, offline, and resume pages.

## Verification baseline

- `pnpm run lint`: passed with zero errors.
- `pnpm run check`: passed with zero errors, warnings, or hints.
- `pnpm exec astro build`: passed; 317 pages built.
