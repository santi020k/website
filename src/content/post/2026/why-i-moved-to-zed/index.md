---
title: "Why I Moved from VS Code-Based Editors to Zed"
description: "Why Zed became my editor of choice: responsive work across multiple projects, flexible AI integrations, and Dep Beacon now available as a Zed extension."
publishDate: "2026-09-07"
coverImage:
  alt: "Three floating off-white and lilac panels connected by cyan paths to a purple central hub"
  src: "./cover.webp"
tags: ["zed", "developer-experience", "productivity", "ai", "developer-tools"]
postType: "Opinion"
---

I moved from VS Code-based editors to Zed for two reasons: how it feels with multiple projects open, and how well it integrates different AI tools.

The performance is what made the biggest difference. For the way I work across several projects at the same time, Zed has been the best editor experience I have found. The AI integrations make that choice even more useful: I can keep the editor I like while having options for the assistance I use inside it.

## My working day involves more than one repository

A single project window is only part of the picture. When I work across projects, I need to move between different codebases without losing the thread of what I am doing.

That changes what I value in an editor. Opening a file, navigating code, and switching to another project are small actions, but I repeat them throughout the day. Responsiveness matters most to me when all of those projects are open together.

This is where Zed stands out in my experience. It feels fast while I move between projects, and that makes it easier to stay focused on the work. I spend less attention on the editor itself.

I am describing how it feels in my workflow. I have not run a controlled comparison of memory usage, startup time, or input latency, so I am not putting a percentage on the improvement. My reason for switching is simpler: working across multiple projects feels better in Zed.

## I want flexibility in how I use AI

Performance would already be a strong reason to move. The AI integration gives me another reason to stay.

I like having different AI options available without making the editor choice depend on a single one. The editor is where I read code, make changes, and review the result. I want that environment to remain useful as my preferences for AI tools change.

Zed supports models configured for its own AI features as well as external coding agents. Those are different integration paths: model providers power Zed's native assistant features, while external agents connect through the Agent Client Protocol and typically manage their own authentication and configuration. Zed explains that distinction in its [agents documentation](https://zed.dev/docs/ai/agents).

For model access, Zed also documents [provider API connections](https://zed.dev/docs/ai/use-api-access), including Anthropic, OpenAI, and Google AI. The practical benefit for me is the choice: I can keep a consistent editing environment while choosing the AI integration that fits the work.

That flexibility is what I appreciate. AI assistance belongs close enough to the code that I can inspect what it proposes, understand the changes, and decide what to keep.

## Dep Beacon is now available in Zed

There is also a piece of my own tooling in this move: [Dep Beacon](/portfolio/dep-beacon/) now has a [published Zed extension](https://zed.dev/extensions/dep-beacon-lsp).

I originally built Dep Beacon to keep dependency decisions close to the manifest. Version status, update options, pnpm workspace context, and security findings are more useful when they are near the dependency I am reviewing. I wrote about that motivation in the [original VS Code release post](/blog/dep-beacon-vscode-extension/).

The Zed integration carries that idea into the editor through a language server. It provides dependency diagnostics, hovers, npm links, and individual or bulk update actions. The shared analysis core supports both editors; each integration presents that information through its own editor features. The [project repository](https://github.com/santi020k/dep-beacon) documents the architecture and supported workflows.

To try it, install [Dep Beacon from the Zed extension registry](https://zed.dev/extensions/dep-beacon-lsp), then open `package.json`, `pnpm-workspace.yaml`, or `pnpm-workspace.yml`. The [Zed setup guide](https://beacon.santi020k.com/docs/zed-extension) covers the available signals and update actions.

Having a tool I built available in the editor I now prefer makes the move especially satisfying.

## My theme came with me, too

I also added [Santi020k Theme to the Zed extension registry](https://zed.dev/extensions/santi020k-theme). Its dark and light variants bring the same calm violet palette into Zed, so moving editors can still feel familiar.

The [theme family](/portfolio/santi020k-theme/) now reaches beyond editors: it includes Codex presets, Chrome, terminals, Raycast, Slack, JetBrains IDEs, and Xcode alongside VS Code and Zed. The [theme website](https://theme.santi020k.com/) brings the supported apps and their installation guides together.

Having both Dep Beacon and my theme in Zed makes the workspace feel more like my own.

## Choose around the work you actually do

For me, the deciding combination is responsive work across multiple projects and good integration with different AI tools. Those are things I use throughout the day, so they carry more weight than a longer feature list.

If you are considering a similar move, try it with the projects you normally keep open together. Move between them, review a real change, and use the AI integration you care about. Check the language tooling and extensions your work depends on, too.

That is the experience I want from an editor: I can keep several projects in motion, choose the assistance that helps, and give most of my attention to the code. Zed fits that well for me.
