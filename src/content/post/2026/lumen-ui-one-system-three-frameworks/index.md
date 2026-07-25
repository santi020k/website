---
title: "Lumen UI: One system, three frameworks"
description: "How I built 123 accessible primitives for Astro, React, and Web Components while sharing tokens and behavior without forcing one runtime model."
publishDate: "2026-07-04T15:00:00.000Z"
coverImage:
  alt: "Translucent interface primitives connected across three luminous framework lanes"
  src: "./cover.webp"
tags: ["design-systems", "astro", "react", "web-components", "accessibility"]
postType: "Deep Dive"
---

“Works with multiple frameworks” can mean very different things.

Sometimes it means a CSS file that every application can load. Sometimes it means one React implementation wrapped for other environments. Sometimes it means three component libraries that share a name but drift in behavior.

I wanted a stronger definition for [Lumen UI](https://lumen.santi020k.com/).

Lumen is a multi-framework system with 123 accessible primitives for Astro, React, and standards-based Web Components. The packages share tokens, contracts, styles, and interaction patterns while preserving the native authoring model of each framework.

The system is shared. The runtimes are not pretending to be identical.

## Start with the contract, not the wrapper

The component contract is the center of Lumen.

A button should have the same visual roles, disabled semantics, loading expectations, focus behavior, and reduced-motion treatment whether an application writes it as Astro markup, JSX, or a custom element.

That does not require the implementation code to be identical.

The Astro package can emit semantic HTML and use a small progressive-enhancement runtime for interactive behavior. The React package can use components and hooks that fit React’s state model. The Web Components package can register custom elements and rely on browser standards.

Sharing behavior is more important than sharing a runtime abstraction.

## Astro should remain Astro

One reason I built Lumen was frustration with component libraries that make Astro install a front-end framework for basic interaction.

The Astro package treats static HTML as the default. Applications mount one `UIPrimitives` runtime, and that small client layer enhances supported Lumen markup.

That means an Astro application can use dialogs, tabs, menus, and other interactive primitives without turning every component into a hydrated island.

The model fits Astro’s architecture:

- render useful HTML on the server
- keep semantics present before JavaScript
- enhance only the behavior that needs a client
- preserve reduced-motion and keyboard paths

A design system should support the strengths of the host framework, not erase them.

## React gets a React-native surface

The React package exposes components and behavior hooks that feel normal in JSX.

Applications import the shared stylesheet once, then compose Lumen components inside their existing state and rendering model. There is no custom element ceremony and no Astro runtime.

The important part is that the React component still follows the same contract as its counterparts. Tokens, variants, accessibility rules, and interaction expectations remain aligned.

This is where shared metadata becomes valuable. The package surface can be validated against the registry instead of depending only on documentation staying current.

## Web Components create the standards path

The elements package provides standards-based custom elements.

That gives Lumen a path for applications that do not use Astro or React and for mixed environments that want portable markup. The package registers the elements once, loads the same visual foundation, and exposes the component behavior through browser-native APIs.

Web Components are not a fallback implementation. They are one of the three first-class targets.

That distinction affects testing and documentation. Examples need to show the native shape for each framework, and interaction checks need to prove the contract across all three.

## Standalone CSS comes before Tailwind integration

Lumen does not require a Tailwind configuration.

The components ship standalone CSS and tokens. Tailwind applications use an explicit cascade-layer integration so Tailwind’s base styles, Lumen components, and utilities land in the intended order.

That boundary matters for adoption. A design system should not force every consumer to use the same build-time styling tool. It should also document the exact integration path when a popular tool changes cascade behavior.

The shared CSS foundation keeps the visual language coherent while each package focuses on markup and interaction.

## Accessibility belongs in the primitive

Lumen treats semantic markup, keyboard navigation, focus management, and reduced-motion support as part of the component definition.

Applications will still need to use components responsibly. A library cannot choose a useful label or heading hierarchy for the product. It can make the correct behavior the easiest behavior.

The repository validates this through interaction tests, accessibility checks, visual coverage, and framework contract checks.

Accessibility is not a badge applied to the library as a whole. It is a set of decisions repeated across 123 primitives.

## The design system needs machine-readable context

Modern design systems are used by more than developers reading a documentation page.

Lumen includes:

- a Figma community library
- a portable agent skill
- an MCP server
- `llms.txt`
- a machine-readable registry
- installable recipes and file groups

These surfaces give design tools and coding agents a way to discover the real system instead of guessing from a prompt.

The MCP package can list components, retrieve current source, expose props and tokens, and point an agent toward the rules that apply to a composition. The agent skill teaches selection, theming, and verification patterns.

This is not about generating more code. It is about giving generated code the same source of truth human contributors use.

## Validation protects the shared promise

Cross-framework systems fail quietly when one package gains a prop, one example changes, or one behavior is fixed in only one target.

Lumen’s validation includes:

- builds and type checks
- unit and interaction tests
- accessibility and visual tests
- bundle-size checks
- registry synchronization
- Figma token checks
- framework contract checks
- package publication dry runs
- MCP snapshot and evaluation checks
- consumer package smoke tests

The exact list will evolve. The principle is stable: a shared promise needs automated evidence.

## One language, not one implementation

Lumen’s architecture comes down to a distinction I want more design systems to make.

Consistency does not require every framework to run the same component implementation. It requires each implementation to honor the same product contract.

Astro can remain progressive. React can remain React. Web Components can remain standard elements. Users still receive one visual language, one token system, one accessibility baseline, and one documented way to reason about the components.

You can browse the [Lumen UI documentation](https://lumen.santi020k.com/), use the [Figma library](https://www.figma.com/community/file/1662337342676541513), see the [source on GitHub](https://github.com/santi020k/lumen), or read the shorter [portfolio case study](/portfolio/lumen-ui/).
