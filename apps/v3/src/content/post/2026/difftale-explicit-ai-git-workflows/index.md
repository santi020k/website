---
title: "Difftale: Explicit AI-assisted Git workflows"
description: "Why Difftale generates editable commit and pull request drafts while keeping staging, committing, pushing, and pull request creation under direct control."
publishDate: "2026-08-28T15:00:00.000Z"
draft: true
coverImage:
  alt: "AI-generated Git drafts stopping at an explicit action boundary before repository operations"
  src: "./cover.webp"
tags: ["vscode", "git", "developer-experience", "ai", "conventional-commits"]
postType: "Case Study"
---

There is a meaningful difference between helping me write a Git action and performing that action for me.

I am comfortable letting a model draft a commit message. I still want to see the staged diff, edit the message, run the real hooks, and choose when to commit.

I am comfortable asking for a pull request outline. I still want to review the branch, change the description, decide whether the branch is ready, and explicitly create the pull request.

That boundary is the reason I built [Difftale](https://github.com/santi020k/difftale), a VS Code extension for Conventional Commit drafts, pull request composition, file history, and visible Git execution.

The extension makes repetitive workflows faster. It does not pretend that faster means invisible.

## Generation stops at the draft

Difftale can generate up to five commit-message alternatives from staged changes through a language model exposed by the VS Code Language Model API.

Every result is editable. Before a message can be used, Difftale validates the Conventional Commits structure:

- accepted type
- optional scope
- header length
- body spacing
- breaking-change syntax

If a model is unavailable, the extension can fall back to a local deterministic draft. A developer can also write the message manually and use the same validation without enabling AI at all.

This separation matters. The durable part of the product is not one model. It is the workflow around the model: context collection, consent, parsing, validation, editing, and explicit execution.

## Staging remains outside the extension

Difftale never stages files automatically.

The staged diff is the developer’s declaration of scope. If an extension quietly adds nearby files because they look related, it changes the meaning of the commit before it even drafts the message.

That is too much authority for a writing assistant.

The flow stays simple:

1. Stage the intended changes.
2. Open the composer.
3. Write or generate a draft.
4. Review and edit it.
5. Commit explicitly.

The model works inside the scope already selected by the developer.

## Pull request drafts need branch context

A good pull request description is not a longer commit message. It needs the story of the branch relative to a base.

Difftale collects the commits and diff between the current branch and a detected or selected base branch. It uses that context to generate or support an editable title and Markdown description.

Drafts are saved per repository and branch in VS Code workspace state. That makes the composer useful even before the branch is ready to publish.

When the developer chooses **Create PR**, Difftale uses the installed and authenticated GitHub CLI. It does not push the branch automatically. It does not invent a separate token store. The extension reuses the explicit local tool and identity the developer already controls.

## Git hooks should be visible

One frustrating pattern in developer tools is a polished “commit failed” notification with the useful output hidden somewhere else.

Difftale runs the real Git command and streams its output into a dedicated channel. It detects executable `pre-commit` and `pre-push` hooks, including custom `core.hooksPath` setups such as Husky.

It does not run the hooks separately. Git executes each hook once, and the full output stays available.

That detail keeps the extension honest. A commit is not successful because a UI animation finished. It is successful when Git and the repository’s checks say it is.

## File history should not create tab debt

The extension also handles a smaller workflow I use constantly: moving through the history of the file already open.

With Difftale, I can step to an older revision, move back toward the working file, choose a revision directly, or compare that revision with the working tree.

The history logic follows files across renames. The editor integration reuses preview diff editors so a quick investigation does not leave a row of nearly identical tabs behind.

This feature does not need AI. It benefits from the same product principle: preserve context and reduce repeated navigation.

## Privacy and consent are workflow states

Source changes are sent to a model only after the developer invokes generation and approves VS Code’s model-access consent.

AI output is parsed and validated. Generated content stays editable. Manual composition continues to work without a model.

These are not disclaimers attached after the feature. They are states in the interaction:

- no generation without an invocation
- no model access without platform consent
- no use without review
- no repository mutation without an explicit action

This is the shape I want AI features to have in developer tools. The assistant can be fast and useful while the product remains predictable.

## A safe sandbox makes Git features easier to test

Difftale includes a disposable Git sandbox for extension development.

The sandbox contains file history across a rename, a local remote, a feature branch, passing Git hooks, and staged, unstaged, and untracked changes. That lets me test commit, push, pull request, and history flows without changing the extension repository itself.

Developer tools need realistic test states. Git behavior is difficult to validate with isolated string fixtures alone. A controlled repository makes the risky edge cases repeatable.

## The story behind the name

A diff tells you what changed. A useful commit or pull request tells the story of why the change belongs together.

Difftale lives between those two things.

It turns selected repository context into a draft, then stops before the decision. That boundary is the product.

You can [explore Difftale on GitHub](https://github.com/santi020k/difftale) or read the condensed [portfolio case study](/portfolio/difftale/).
