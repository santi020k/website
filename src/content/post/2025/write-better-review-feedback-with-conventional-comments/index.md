---
title: "Write Better Review Feedback with Conventional Comments"
description: "A lightweight review language that makes feedback clearer, kinder, and easier to act on."
publishDate: "2025-05-17T17:34:00.000Z"
updatedDate: "2026-04-08T18:00:00.000Z"
coverImage:
  alt: "Distinct review feedback signals flowing from a code change into an actionable revision"
  src: "./cover.webp"
tags: ["code-review", "engineering-culture", "communication", "git"]
postType: "Guide"
seriesId: "the-santi020k-way"
seriesOrder: 4
---

Most review problems are not caused by malice. They are caused by ambiguity.

Comments like "this feels wrong" or "can you fix this?" force the author to guess whether the note is blocking, optional, stylistic, risky, or just exploratory. That uncertainty wastes time and quietly changes the tone of the review.

I like Conventional Comments because they solve that problem without turning review into bureaucracy.

## The core idea

Prefix a comment with a label that explains the intent.

```text
<label> [decorations]: <subject>

[discussion]
```

Examples:

```text
suggestion: Could we move this transformation into the server action so the component stays focused on rendering?
```

```text
issue (blocking): This fallback skips the permission check and could expose the admin branch to non-admin users.
```

```text
question (non-blocking): Do we expect this request to be idempotent if the user refreshes midway through the flow?
```

That tiny bit of structure changes the experience immediately. The author knows what kind of feedback they are reading before they parse the rest of the sentence.

## Labels worth standardizing

You do not need a giant taxonomy. A small, shared set is enough:

- `praise:` for something genuinely strong
- `suggestion:` for an improvement with a preferred direction
- `issue:` for a real problem that needs resolution
- `question:` for uncertainty or investigation
- `todo:` for a small required task
- `note:` for context that should not block the work

The point is not perfection. The point is faster alignment.

## Why this works so well

Conventional Comments improve three things at once.

### They make comments more actionable

A labeled comment nudges the reviewer to be specific. Once I write `suggestion:`, I naturally feel pressure to explain the better path. Once I write `issue:`, I feel pressure to describe the actual risk.

### They lower social friction

Ambiguous feedback often feels harsher than intended because the author has to infer whether it blocks approval. Clear intent lowers that tension.

### They make review easier to scan

When a pull request has many comments, labels make it easier to triage what matters first. That helps both authors and reviewers keep momentum.

## Tone still matters

Structure helps, but tone is still part of the craft.

There are a few habits I try to keep:

- Replace "you" with "we" when possible
- Explain why, not only what
- Be explicit when something is non-blocking
- Pair issues with suggestions whenever I can
- Leave real praise when the work deserves it

That last one is underrated. Praise is not fluff when it is sincere. It teaches the team what good looks like.

## How I introduce this on a team

I would not roll it out as a rigid policy on day one. I would do something simpler:

1. Start using the labels in my own reviews
2. Explain the pattern in a short team note
3. Keep the label set intentionally small
4. Normalize `non-blocking` decoration for optional polish
5. Refine based on where confusion still shows up

It is a lightweight convention, not a ceremony.

## Better reviews create better systems

Code review is one of the main ways teams transmit standards. If the review language is vague, the standards become vague too.

Conventional Comments do not make people thoughtful by themselves. But they make thoughtfulness easier to express. That is enough to improve collaboration, shorten feedback loops, and reduce the number of review threads that turn into avoidable friction.

Clear labels. Clear intent. Better conversations.
