---
title: "Playwright Accessibility Checks That Teams Keep Running"
description: "How to add accessibility automation to your Playwright suite in a way that is fast enough to stay in the workflow and specific enough to actually catch problems."
publishDate: "2026-05-15T15:00:00.000Z"
tags: ["accessibility", "playwright", "testing", "e2e", "developer-experience"]
postType: "Guide"
seriesId: "building-a-production-nextjs-app"
seriesOrder: 8
---

Most accessibility audits happen too late. A designer runs a contrast checker before launch. An engineer skims a screen reader once during QA. A stakeholder runs Lighthouse on the homepage and the score looks acceptable.

That is not a workflow. That is a ceremony that repeats the same findings and fixes the same surface while deeper problems stay invisible.

The better approach is to make accessibility checks part of the E2E suite — automated, repeatable, and fast enough that nobody has to decide whether to run them.

## Why Playwright is a practical fit for this

Playwright already owns the critical user flows: login, navigation, form submission, key interactions. Those are exactly the surfaces where accessibility problems do the most harm. Keyboard traps, missing focus management, unlabeled form controls, and broken ARIA announcements do not show up in unit tests. They show up when a person — or an automated tool acting like one — tries to complete a task.

Adding accessibility assertions to an existing Playwright suite means you get coverage without a separate toolchain, without a separate CI step, and without asking anyone to context-switch.

## The baseline: axe-core with @axe-core/playwright

The most reliable starting point is pairing Playwright with [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright). axe-core is the engine behind most major accessibility testing tools. The Playwright integration makes it straightforward to inject and run a full audit against any page or component state.

```ts
import { checkA11y, injectAxe } from 'axe-playwright'

test('home page has no critical accessibility violations', async ({ page }) => {
  await page.goto('/')
  await injectAxe(page)
  await checkA11y(page, undefined, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
  })
})
```

That single test covers a large surface quickly. The `wcag2a` and `wcag2aa` tags map directly to the WCAG 2 conformance levels most teams target. Any critical violation — missing alt text, insufficient color contrast, form inputs without labels — fails the test immediately.

## Do not audit everything at once

The temptation is to add `checkA11y` to every test as a catch-all. That creates noise.

Pages in transitional states, modals partially initialized, or content under a loading skeleton will produce violations that are not real. Auditing too broadly also makes failures harder to triage because the violation report mixes legitimate issues with transient ones.

I prefer a targeted approach:

- Audit each major page in a stable, loaded state
- Audit interactive components after their key states are reachable (open modal, focused input, error message visible)
- Audit forms before and after validation fires
- Skip states that are explicitly transitional

That keeps the failure signal clean and the suite fast.

## Focus management deserves its own assertions

axe-core catches many things automatically but focus management often needs explicit assertions. Automated tools do not easily detect that a modal opened and focus did not move into it, or that a navigation action left focus stranded on a removed element.

These are worth testing directly:

```ts
test('modal traps focus correctly', async ({ page }) => {
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Open settings' }).click()
  await expect(page.getByRole('dialog')).toBeFocused()

  // Tab through all focusable elements and verify we stay inside the dialog
  await page.keyboard.press('Tab')
  const focused = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]'))
  expect(focused).not.toBeNull()
})
```

Focus traps, restore-on-close, and skip links are three areas where manual assertions catch what automated scanning misses.

## Keyboard navigation on critical flows

Keyboard-only navigation should be verified on every path a user depends on. Not every path — just the critical ones.

For most applications that means:

- Logging in
- Navigating between primary sections
- Submitting the main conversion action (purchase, publish, send)
- Dismissing errors and dialogs

A test that completes a flow without ever using a mouse is a meaningful accessibility signal. If it fails, something in that flow is genuinely broken for keyboard users.

## Where to run these checks in CI

Accessibility checks in Playwright fit naturally into the same CI job as the rest of the E2E suite. They do not need a separate pipeline or gate.

The one thing worth setting explicitly is which rules should block merge. I keep two tiers:

- **Block on merge**: critical and serious violations against WCAG 2.0 AA rules
- **Warn only**: best practice rules and WCAG 2.1 additions not yet in the baseline

That way a missing alt attribute fails the build, but an emerging pattern improvement creates a visible warning without blocking the team.

## The practical setup I keep

If a team is adding accessibility testing for the first time, the steps I would take:

1. Install `@axe-core/playwright` and run a full audit on the three most important pages
2. Fix the violations that come back before adding more coverage
3. Add keyboard navigation tests to the two or three flows with the highest user impact
4. Add focus management assertions to every modal and drawer in the app
5. Set the CI rule tier so critical violations block and improvements warn

Accessibility automation does not replace manual testing or screen reader verification. But it does make the baseline automatic — which means the team spends its manual testing time on the things machines genuinely cannot check.

For the broader testing approach this fits into, [Testing React Components with Vitest and React Testing Library](/blog/testing-react-components-with-vitest-and-react-testing-library/) is a good companion on the unit side.
