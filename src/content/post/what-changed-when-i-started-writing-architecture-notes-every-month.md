---
title: "What Changed When I Started Writing Architecture Notes Every Month"
description: "A year of monthly architecture notes changed how I review systems, how I catch drift, and how I explain decisions to the people who inherit them."
publishDate: "2026-09-11T15:00:00.000Z"
tags: ["architecture", "documentation", "software-design", "engineering-culture"]
postType: "Case Study"
seriesId: "the-santi020k-way"
seriesOrder: 12
---

I started writing short architecture notes about fourteen months ago. Not as formal documentation. Not as architectural decision records. Just monthly notes: what I was looking at, what felt like it was working, what felt like it was starting to drift, and what I was uncertain about.

I did not expect them to be useful outside of my own thinking. They turned out to be more useful than most of the formal documentation I have written.

## What the notes actually look like

The format is deliberately unstructured. I keep each note to two or three sections:

**What I reviewed.** A short description of the part of the system I spent time with — a service boundary, a data model, a deployment configuration, an integration that had been modified recently.

**What I noticed.** Not a summary of how it works. That already lives in the code. Instead: what surprised me, what had drifted from the original intention, what was holding up well, and what I was carrying forward as a concern.

**What I decided or deferred.** If I changed something, why. If I held off, what would need to be true before I acted.

Each note takes about twenty minutes to write. Most of them are never read by anyone else. A few of them have been the most useful documents I have shared.

## The first thing that changed: I started noticing drift sooner

Architecture does not degrade in obvious ways. Services do not send a warning when their boundaries become inconsistent. Data models do not announce when they have accumulated enough special cases to make the original design assumptions wrong. Integrations do not flag when they have been patched enough times that the patches are now the real interface.

The drift is invisible until it becomes expensive.

Writing monthly notes forces me to look at the system with fresh eyes on a schedule. Not because a problem was reported, not because a sprint includes a cleanup task, but because I committed to looking. That routine caught two cases in the past year where a service boundary had been gradually eroded by convenience changes until it was no longer doing what it was designed to do.

In both cases, I noticed because I was writing. I would not have noticed otherwise until the cost was much higher.

## The second thing: decisions became easier to explain

One of the more uncomfortable experiences in software is inheriting a decision without understanding why it was made. The code encodes what was decided. It rarely encodes why. And "why" is exactly what you need when you are deciding whether to keep, extend, or replace it.

Monthly notes create a lightweight record of the reasoning at the time.

I have referred back to my own notes to remember why a particular abstraction was introduced, why a simpler approach was ruled out, and what the tradeoffs were in context. That record is imperfect — notes are a snapshot, not a complete story — but it is dramatically more useful than nothing, which is what most decision history looks like.

When someone else needs to understand a past choice, pointing them to a short note with the original context is much faster than reconstructing it in a conversation.

## The third thing: I got better at identifying uncertainty

Most engineers, myself included, are better at describing confidence than uncertainty. The parts of a system that are working well are easy to narrate. The parts we are unsure about are easier to defer than to name.

Writing monthly notes made me more honest about the things I did not have a clear view on. Naming uncertainty in writing is different from holding it loosely in your head. Once it is written down, it is easier to revisit, easier to hand off, and easier to act on when circumstances change.

Several of the most productive technical conversations I have had this year started with sharing a note that said "I am not certain this boundary is right" or "I have two concerns about this integration and I have not resolved which one is more important."

## What makes the habit stick

The notes only compound if you keep writing them. That means the format has to be easy enough that a busy month does not become a reason to skip.

The things that have helped me maintain the habit:

**Not requiring completeness.** A two-paragraph note that covers one concern honestly is more useful than an exhaustive document that never gets written. Short and specific beats long and comprehensive when the alternative is nothing.

**Writing for future me, not for an audience.** The notes that are most useful to re-read are the ones where I wrote what I actually thought, including uncertainty and unresolved questions. Notes written to sound authoritative are usually less useful than notes written to think something through.

**Keeping them in the project.** Notes that live next to the code are easier to find and more likely to stay current than notes in a separate wiki. A `/notes` directory or a dated file in the repository keeps the history close to the thing it describes.

## What I would tell someone starting the habit now

The first note will feel like it is not very useful. Write it anyway. The value is not in any single note — it is in the pattern over time.

After three months, you will have a picture of which parts of the system you keep worrying about. That picture is information. It tells you where the real architectural risk is, even when nothing has broken yet.

After six months, you will notice that the act of writing has changed how you review code. You start looking for drift as a habit, not as a task.

That shift — from reactive to observational — is what the notes are really for.

If you are building the case for making this a team practice, [Common Code Pitfalls That Signal Maintenance Risk](/blog/common-code-pitfalls-that-signal-maintenance-risk/) is a useful companion. The pitfalls it describes are exactly the kind of thing that shows up in architecture notes before it shows up in an incident report.
