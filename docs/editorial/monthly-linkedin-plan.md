# Monthly website and LinkedIn plan

Prepared on 30 September 2026. This is an editorial queue, not an active publication schedule.
No LinkedIn posts or scheduling jobs have been created from this document.

## Cadence and coverage

Publish one useful LinkedIn introduction per month, linking to the full website article. The first
three slots preserve the previously proposed articles. The remaining slots complete the original
eight-topic plan without writing duplicate ecosystem or Quality articles.

The queue contains ten distinct articles: four existing website articles and six unpublished drafts.
The drafts include Smith API contracts, Astro Doctor, Void leadership, Lumen accessibility, React
interview practice, and a Theme retrospective. Each draft has a dedicated 1600 × 900 WebP cover.

All dates below are proposals. The suggested LinkedIn time is **10:00 America/Bogota (15:00 UTC)**,
on the first Tuesday of each month. This is a convenient cadence, not a claim about optimal reach.
Draft frontmatter uses 09:00 local on the corresponding day as a provisional website date.

| Proposed LinkedIn date | Topic and website source | Website state |
| --- | --- | --- |
| 6 Oct 2026 | [Developer tool ecosystem](../../src/content/post/2026/building-santi020k-developer-tool-ecosystem/index.md) | Existing article |
| 3 Nov 2026 | [Code standards](../../src/content/post/2025/code-standards-that-scale-with-a-team/index.md) | Existing article |
| 1 Dec 2026 | [Release process](../../src/content/post/2025/a-release-process-that-reduces-drama/index.md) | Existing article |
| 5 Jan 2027 | [Smith: API contracts](../../src/content/post/2027/api-contracts-for-parallel-frontend-delivery/index.md) | Draft |
| 2 Feb 2027 | [Astro Doctor: missing alt text](../../src/content/post/2027/a-successful-astro-build-can-still-miss-alt-text/index.md) | Draft |
| 2 Mar 2027 | [Void: team handoffs](../../src/content/post/2027/making-team-handoffs-easier-to-finish/index.md) | Draft |
| 6 Apr 2027 | [Lumen: dialog keyboard journey](../../src/content/post/2027/a-dialog-is-a-keyboard-journey/index.md) | Draft |
| 4 May 2027 | [Quality: one command](../../src/content/post/2026/one-quality-command-across-polyglot-repositories/index.md) | Existing article |
| 1 Jun 2027 | [React interview practice](../../src/content/post/2027/practice-explaining-decisions-in-a-react-interview/index.md) | Draft |
| 6 Jul 2027 | [Theme retrospective](../../src/content/post/2027/a-developer-tool-retrospective-what-should-stay-small/index.md) | Draft |

## Moving an item from draft to publication

1. Review the article and LinkedIn copy together. Recheck time-sensitive package claims and links
   close to publication, especially for the existing ecosystem and Quality articles.
2. For a new article, confirm the actual website publication date, update `publishDate`, and remove
   `draft: true` only when publication is approved. Use the repository's normal reviewed GitHub and
   deployment workflow described in [deployment documentation](../deployment.md).
3. Run `pnpm run verify:fast`. Preview the article on mobile and desktop and verify its metadata and
   generated social image. Keep the source and the deployed result aligned.
4. Confirm that the public article URL and share preview work before scheduling its LinkedIn
   introduction. Draft URLs below are intended destinations and will not be public until published.
5. Use LinkedIn's native scheduler after the user authorizes scheduling. Confirm the account, date,
   timezone, final text, and preview in the composer. Record the actual scheduled state here.

The website is statically built. A future date does not create a timed deployment. Drafts are
excluded from production even after their date passes; removing the draft flag still requires a
build at or after the publication time. Development previews deliberately include drafts.

There is no need to schedule all ten months at once. Revisit the next item when ready, and skip a
month if the article no longer feels useful. No additional daily activity is part of this plan.

## LinkedIn copy

The text blocks below are drafts for the corresponding slots. Use the article's generated link
preview as the default visual; a separate upload or carousel is unnecessary.

### 1. Developer tool ecosystem — 6 October 2026

I kept solving the same small engineering problems across different projects: interface behavior,
quality checks, release evidence, and shared visual foundations.

Over time, those repeated decisions became tools such as Lumen, Quality, Astro Doctor, and Theme.

The part I care about most is the boundary. Each tool should solve a specific problem and remain
useful on its own. A project should be able to adopt one without adopting everything else.

I wrote about how the pieces fit together, and when a repeated decision deserves its own package:

<https://santi020k.com/blog/building-santi020k-developer-tool-ecosystem/>

### 2. Code standards — 3 November 2026

A useful code standard should make the next decision easier.

For a growing frontend team, I want predictable structure, clear types, explicit testing
expectations, and tooling that handles routine formatting and linting.

That leaves code review with more room for the questions that need context: behavior, tradeoffs,
and maintainability.

I put together the standards I would hand to a team, including how to write a TODO that someone can
actually act on:

<https://santi020k.com/blog/code-standards-that-scale-with-a-team/>

### 3. Release process — 1 December 2026

Before a release, I want five clear answers:

What is included? How was it verified? Who is driving it? How will we know it is healthy? What is
the recovery plan?

Those answers are useful to engineering, QA, product, and the person responding if something goes
wrong. A green build contributes evidence, but the follow-through continues after deployment.

I wrote down a practical release process built around those questions:

<https://santi020k.com/blog/a-release-process-that-reduces-drama/>

### 4. Smith API contracts — 5 January 2027

Parallel frontend and backend work gets easier when the team agrees on more than the successful
response.

During my work on Smith's commerce frontend, API contracts and mocked responses helped support
parallel delivery.

This article turns that idea into a practical example: required fields, unavailable prices,
purchase restrictions, failures, and the point where mocks need to give way to real integration.

The most useful contract makes the difficult states discussable early:

<https://santi020k.com/blog/api-contracts-for-parallel-frontend-delivery/>

### 5. Astro Doctor — 2 February 2027

A page can build successfully while an important image has no useful text alternative.

Astro Doctor can flag a missing alt attribute. Choosing the right repair still depends on what the
image communicates in that page.

I worked through a small example: a wiring diagram, a missing description, and the difference
between clearing a diagnostic and giving someone the information they need.

The guide includes the limits of the check and what to verify in the rendered page:

<https://santi020k.com/blog/a-successful-astro-build-can-still-miss-alt-text/>

### 6. Void and team handoffs — 2 March 2027

Work can be progressing in every discipline while a complete feature is still hard to finish.

My technical leadership work at Void spanned web, mobile, backend, and real-time systems. That
scope is the context for this guide to clearer handoffs.

Using a fictional registration feature, I walk through the user outcome, open decisions, owners,
and evidence that help the next person continue.

“Ready for design review” and “ready for release” need different evidence:

<https://santi020k.com/blog/making-team-handoffs-easier-to-finish/>

### 7. Lumen and dialog focus — 6 April 2027

A screenshot cannot show where keyboard focus goes after a dialog closes.

That last step is part of the interaction, just like opening the dialog and using its fields.
Shared components can handle common behavior; the product still owns the labels, errors, and
next step in the workflow.

I wrote a practical review guide around a small display-name dialog, with a keyboard journey and
failure cases to check in the consuming application:

<https://santi020k.com/blog/a-dialog-is-a-keyboard-journey/>

### 8. Quality — 4 May 2027

Different languages deserve their native analyzers. A repository still benefits from one clear
way to run the checks it depends on.

That is the boundary I built Quality around: coordinate the existing tools and make their
evidence easier to read.

The details matter when configuration changes, a required analyzer is missing, or a baseline
could hide a real failure.

I wrote about the decisions behind that approach and what I expect a reliable quality command
to tell me:

<https://santi020k.com/blog/one-quality-command-across-polyglot-repositories/>

### 9. React interview practice — 1 June 2027

“Build a page that searches a list of projects.”

That small prompt is enough to practice several useful interview skills: clarifying requirements,
choosing state, handling an empty result, and explaining what changes when the data becomes remote.

Following the topic of my ReactJS Medellín interview talk, I put together a practical exercise
for making those decisions understandable to someone listening.

You can try it with a friend and compare which assumptions each of you made:

<https://santi020k.com/blog/practice-explaining-decisions-in-a-react-interview/>

### 10. Theme retrospective — 6 July 2027

Santi020k Theme started as an editor extension and expanded into browser and terminal surfaces.

Looking back, the useful question is what should remain small: the shared palette, the source of
generated assets, and the contracts each consumer depends on.

I revisited the documented expansion through ownership, installation safety, generated output,
and the maintenance questions I would ask next.

This is an architecture retrospective, with practical questions for reviewing a developer tool
as it grows:

<https://santi020k.com/blog/a-developer-tool-retrospective-what-should-stay-small/>

## Evidence and editorial boundaries

- Smith: the [public case study](../../src/content/project/smith-commerce/index.md). The product
  example is illustrative; the article does not reveal client endpoints or private implementation.
- Astro Doctor: the maintained missing-alt rule and scanner tests, plus the W3C image guidance
  linked in the draft. Diagnostic coverage is not a claim of complete accessibility.
- Void: the [public case study](../../src/content/project/void/index.md). The handoff structure is
  a recommendation; the fictional registration example is not presented as an internal release.
- Lumen: the public component system and WAI-ARIA dialog guidance linked in the draft. The article
  is a review guide, not a new certification or a claim that every product composition is tested.
- React: the [recorded 2024 talk](../../src/content/talk/surviving-technical-interviews-in-react.md),
  the public community case study, and the official React documentation linked in the draft.
- Theme: the [published expansion article](../../src/content/post/2026/expanding-santi020k-theme-to-the-terminal/index.md).
  The retrospective adds no adoption metrics, user feedback, or committed future release promises.

The cover images are original artwork generated with the built-in image-generation workflow,
following [the blog cover direction](../blog-cover-art.md). Final assets live beside each draft as
`cover.webp`; the articles provide their visible-image descriptions in frontmatter.
