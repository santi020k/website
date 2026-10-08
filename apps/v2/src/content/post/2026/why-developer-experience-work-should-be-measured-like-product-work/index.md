---
title: "Why Developer Experience Work Should Be Measured Like Product Work"
description: "DX improvements that cannot be measured rarely survive long enough to compound. Treating them like product work changes that."
publishDate: "2026-06-12T15:00:00.000Z"
coverImage:
  alt: "Editorial cover showing engineering workflow metrics, dashboards, and delivery feedback loops connected across a development pipeline"
  src: "./cover.webp"
tags: ["developer-experience", "engineering-culture", "metrics", "leadership"]
postType: "Opinion"
seriesId: "the-santi020k-way"
seriesOrder: 12
---

Developer experience work tends to disappear from the conversation.

A team improves the local setup, fixes a slow CI pipeline, or rewrites a painful script that was costing everyone ten minutes per deploy. The work happens. The friction goes away. And then, because nobody measured it, nobody can explain why it mattered when priorities shift and engineering time gets pulled toward something more visible.

That is not a measurement problem. It is a framing problem.

Product work survives because it is attached to outcomes. Conversion rate. Activation time. Retention. Churn. The metrics are imperfect, but they connect the work to outcomes people already care about. Developer experience work often never gets that connection made.

## The case for treating DX like product work

When a product team ships a feature, the expectation is clear: state the goal, ship it, measure the result, iterate. Nobody approves a product initiative by saying "trust us, it will feel better."

DX work gets a different treatment. It often gets approved on the basis of engineering intuition — "the current setup is painful" — and judged on whether the person who complained stopped complaining. That is not a feedback loop. That is a popularity contest.

The teams I have seen do DX work well treat it exactly like product work. They identify the cost before starting. They define what improvement looks like. They measure after shipping. And when they find the numbers did not move the way they expected, they treat that as information rather than embarrassment.

## What is worth measuring

Not everything is easy to measure, but more is measurable than most engineering teams bother to track.

**Cycle time.** How long from "work starts" to "change in production." This captures the full cost of branching, review, CI, deploy, and any manual steps in between. Improving the CI pipeline without measuring cycle time means you may be optimizing the wrong step.

**Feedback loop speed.** How fast does a developer know whether a change is correct? This includes test suite duration, linting speed, type-check time, and how quickly a local preview reflects a change. Every extra minute here multiplies across the team and across every working day.

**Failure recovery time.** When something breaks in the developer workflow — a failed build, a broken local environment, a misconfigured dependency — how long does it take to get back to working? Environments that are easy to reset have measurably different recovery times than ones that require tribal knowledge.

**Setup time for new contributors.** If a new person joins the team and needs to ship something in their first week, how much of that time is spent on configuration, credential hunting, and undocumented prerequisites? This number usually surprises people when they measure it honestly.

**Unplanned tooling interruptions.** How many times per sprint does engineering work stop because a tool is broken, a dependency is stale, or a process failed for a reason unrelated to the feature being built?

None of these require elaborate instrumentation. Most can be tracked with a short retro note and a spreadsheet. The goal is not perfect data. It is directional data that makes the next improvement easier to justify.

## What happens when you do not measure

The pattern I see most often goes like this.

A team accumulates DX debt because each individual problem is small enough to defer. The CI pipeline gets slower by thirty seconds per quarter. The test suite gains another minute over a year. The setup script gains a few undocumented steps as dependencies change.

None of these feel urgent in isolation. Together, they become a significant drag on every developer, every day. But because nobody measured the baseline, nobody can easily quantify the drag — and the work to address it competes directly with product work that has clear metrics attached.

The teams that compound their DX improvements are the ones that caught the drift early because they were watching it.

## Measurement does not require a big system

I am not arguing for elaborate dashboards or DX OKRs that turn into checkbox theater.

The simplest version looks like this:

- Before starting DX work, write down the current state of the thing you are improving. Time it if you can.
- After shipping, compare.
- Share the before and after when you discuss the work.

That is enough. Even an informal note that says "the local dev startup time went from 45 seconds to 12 seconds" is enough to create a record, build the case for future work, and make the outcome visible to people who were not in the room when the decision was made.

It also changes how the team talks about DX work. Instead of "we improved the setup," the conversation becomes "we cut setup time by two-thirds, and here is what that means for new contributors." That framing travels further and survives longer.

## DX is product work for the team building the product

The most durable perspective I have found is to treat the development environment as a product with internal customers.

The customers are the engineers on the team. The product's job is to let them move quickly, with confidence, without unnecessary friction. When the product is slow or broken, there is a cost — it is just paid in developer time instead of revenue.

Measuring that cost is what makes it real enough to prioritize.

If you are building the argument for more DX investment on your team, [Skin in the Game for Software Teams](/blog/skin-in-the-game-for-software-teams/) is worth reading alongside this. Ownership of outcomes — including the outcomes of the tools you build for yourself — is what makes the measurement habit stick.
