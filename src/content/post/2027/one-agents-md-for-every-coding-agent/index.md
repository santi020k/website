---
title: "One AGENTS.md for Every Coding Agent"
description: "Two instruction files for two coding agents drifted apart in my repository. What I consolidated, what I archived, and how I keep the instructions short enough to be read."
publishDate: "2027-06-29T15:00:00.000Z"
draft: true
coverImage:
  alt: "Placeholder cover: a graphite panel with a single violet band, pending final artwork"
  src: "./cover.webp"
tags: ["ai", "developer-experience", "workflow", "documentation", "engineering-culture"]
postType: "Guide"
---

I work on this site with more than one coding agent. For a while the repository had one instruction file for each of them.

They were supposed to say the same thing. They did not.

## How two files drift

Nobody decides to let instructions diverge. It happens one reasonable edit at a time.

When I compared the two files, one was missing the active-release section, the rule for external links, the lint policy, and the commit instructions. The other was missing eight skills. A single commit had edited both files and still left them different.

The skills had the same problem at a larger scale. They lived in two directories with nearly the same name. Two skills existed on disk and were listed nowhere. One described patterns for a framework this site does not use.

The effect is subtle. Each agent follows its own file correctly. The work differs depending on which tool you opened that day, and you blame the tool.

## One file, one skills directory

The repository now has a single `AGENTS.md` at the root and a single `.agents/skills/` directory.

The root file is short on purpose. It covers:

- which release branch is active and where work should be based
- the stack, in one line per layer
- a table of key files and directories
- coding and styling rules that are specific to this project
- the commands that must pass before work is considered complete
- a table of skills, each with one line on when to use it

Anything that needs more than a paragraph lives in a skill or in `docs/`, and the root file links to it.

## Instructions closer to the work

Not every rule belongs at the root. The blog posts directory has its own `AGENTS.md` with rules that only matter there: where a post lives, how translations sit beside the original, and the requirements for cover artwork.

An agent editing a component never needs the cover rules. An agent adding a post needs them every time. Placing instructions next to the files they govern keeps the root file small and the local rules complete.

## Say which source wins

The skills table has two parts.

The first part lists project skills: components, content collections, testing, accessibility, and so on. The second lists general design and audit references that came from elsewhere.

One sentence above the table sets the order: the project's instructions, its style guide, and the component library's public contracts take precedence over the general references.

That sentence does a lot. General-purpose design advice is written for every project, so parts of it will contradict yours. Without a stated order, an agent picks whichever it read last.

## Blocks that tools own

Two sections of the file are written by tools: the lint and type-check policy, and the commit workflow. Each sits between marker comments.

```markdown
<!-- commitprompt:start -->
## Commit generation
…
<!-- commitprompt:end -->
```

The tool can update its block without touching the rest, and I know not to edit inside the markers by hand. Skills installed from another repository are pinned in a lock file, so an update is a visible change and not a silent one.

## Shorter documents get read

The same audit covered the documents agents are told to read.

The `docs/` folder had grown past 11,000 lines. A release-readiness log alone was 2,663 lines of dated evidence. It was valuable as a record and expensive as required reading.

I moved the logs to an archive folder and wrote a one-page release checklist to replace them. The README dropped from 25.6 KB to 10.8 KB by separating the introduction for visitors from the internals for contributors.

Context is a budget. Every line an agent reads before starting is a line it weighs against your actual request. A long history file makes the rules in it harder to find, for people and for models.

## Write rules as checks when you can

The most reliable instructions in the file are the ones that a command enforces.

"Never use inline event handlers" is in the file. It is also a build failure. "Run lint and type checks before finishing" is in the file, and the hooks run them anyway.

When a rule can be a check, I make it a check and keep one line in the instructions to explain why. The instruction saves a failed attempt. The check catches the times it is ignored.

## A review you can do today

If your repository has instructions for coding agents, try this:

1. List every instruction file and skill directory. Count them.
2. Diff the files that are supposed to agree.
3. Look for skills that exist on disk and are not listed, and for listed skills that no longer exist.
4. Measure the documents your instructions tell agents to read.
5. For each rule, ask whether a command could enforce it.

Most of what you find will be drift, not disagreement. Pick one file to be the source, move local rules next to the code they govern, and archive what is history.

The goal is modest: the same repository should produce the same kind of work, whichever tool is open.
