---
title: "Lumen 2.0.0: One system across web and native"
description: "How Lumen 2.0.0 extends one accessible design language across Astro, React, Web Components, React Native, SwiftUI, and Jetpack Compose."
publishDate: "2026-08-28T15:00:00.000Z"
draft: true
coverImage:
  alt: "A luminous shared token core connecting four distinct platform-shaped structures"
  src: "./cover.webp"
tags: ["design-systems", "cross-platform", "react-native", "swiftui", "jetpack-compose", "accessibility"]
postType: "Article"
---

Lumen started with a question about the web: can one design system support different frameworks without making them pretend to be the same framework?

Version 1 answered that question across Astro, React, and standards-based Web Components.

[Lumen 2.0.0](https://lumen.santi020k.com/) takes the next step. It expands that shared design language into React Native, SwiftUI, and Jetpack Compose, giving web and native applications the same semantic foundation while preserving the authoring and interaction model of every platform.

This is the largest change to Lumen since its first stable release. It is also a clearer statement of what the system is meant to be: one accessible product language, implemented natively wherever it runs.

## The web foundation stays intact

Lumen 2.0 does not replace the web system that came before it.

Astro remains the reference implementation. React keeps a component-and-hook model that feels natural in JSX. Web Components keep the standards-based path for framework-neutral and mixed applications.

The web catalog now includes more than 150 primitives, supported by shared styles, interaction contracts, documentation, templates, and machine-readable tooling.

I wrote about that architecture in [Lumen UI: One system, three frameworks](/blog/lumen-ui-one-system-three-frameworks/). Version 2 carries the same principle beyond the browser.

## Shared tokens are the cross-platform foundation

The center of Lumen 2.0 is a platform-neutral token source.

Colors, spacing, radii, typography, motion, and elevation begin as semantic design decisions. Lumen then generates the form each target needs:

- CSS and TypeScript values for the web
- hexadecimal colors and numeric dimensions for React Native
- `Color`, `CGFloat`, motion, and elevation values for SwiftUI
- `Color`, `Dp`, `Sp`, motion, and elevation values for Jetpack Compose

The source is shared, but the output is native to its destination. Automated drift checks compare the generated surfaces so a color or motion change cannot quietly diverge between web and native applications.

That makes a role such as an accent surface or destructive action portable without reducing it to a raw color value copied between repositories.

## Shared contracts do not mean shared renderers

Cross-platform consistency is often treated as a visual exercise. Matching colors and corner radii is useful, but it is not enough.

Lumen shares the parts of a component that should stay stable: semantic purpose, variants, sizes, states, content rules, accessibility expectations, and token roles.

The implementation stays with the platform.

A button can share primary, secondary, quiet, and danger intents while using React Native `Pressable`, SwiftUI `Button`, or Compose `Button` underneath. Focus, gestures, text scaling, screen-reader behavior, and disabled state continue to follow the host platform.

Native adapters do not depend on the DOM, CSS classes, the Astro runtime, or WebViews. Consistency comes from the contract, not from embedding the same renderer everywhere.

## Three native paths, one design language

Lumen 2.0 introduces first-class foundations and component packages for three native ecosystems:

- `@santi020k/lumen-react-native` for React Native applications
- `LumenUI` as a Swift Package for SwiftUI on Apple platforms
- `lumen-compose` for Android applications built with Jetpack Compose

All three include the universal native tier: themes, text, icons, buttons, surfaces, fields, badges, dividers, spinners, and a broader set of shared controls for common product interfaces.

Parity remains intentional rather than absolute.

Picker, slider, and gauge components belong in SwiftUI and Compose because those platforms provide stable dependency-free native controls. React Native gets a semantic refresh control. SwiftUI includes native date selection and macOS-specific shortcut and symbol tools. Compose includes a Material-native floating action button.

Navigation, window scenes, sheets, popovers, system menus, and other application structure remain owned by the application. Lumen should strengthen the platform, not compete with it.

## Accessibility still belongs in the contract

Moving beyond the web changes the APIs, but it does not change the standard.

Touch targets, loading and disabled behavior, focus, dynamic type, reduced motion, VoiceOver, and TalkBack must be verified in the adapter where they run. A component is not considered supported merely because it renders.

Its public contract, accessibility behavior, tests, and usage guidance have to exist together.

The repository now includes native compatibility documentation, component matrices, consumer validation, and interactive playgrounds for React Native, Apple platforms, and Android. Those surfaces make it possible to test the real packages instead of reviewing token output in isolation.

## Native support becomes a production contract

Lumen 2.0.0 is a coordinated production-support milestone. The shared token foundation and the supported React Native, SwiftUI, Jetpack Compose, WidgetKit, and Wear OS component contracts graduate together under one major version.

That support is explicit about its evidence. React Native and SwiftUI require qualified consumers and current physical-device passes. Compose, WidgetKit, Wear OS, and platforms without owned hardware can be supported with limited device validation: automated checks, published artifacts, upgrade evidence, and immutable real-consumer evidence remain mandatory while the remaining hardware matrix stays visible as post-launch work.

Graduation still requires more than a version number. Version 2.0.0 ships only after the coordinated contract is approved, required consumer and device evidence is complete, the stability history is recorded, every public artifact is verified, and the immutable release tag points to the reviewed revision.

After graduation, supported native APIs follow semantic versioning. Future features that have not met the support bar remain experimental instead of quietly expanding the stable surface.

## One system should still feel native

Lumen 2.0 is not an attempt to make a website, an iPhone app, and an Android app render the same interface.

It is an attempt to let them belong to the same product without losing what makes each platform work.

The web can remain semantic and progressively enhanced. React Native can keep its own composition and gesture model. SwiftUI can respond to Apple environments and conventions. Compose can remain Material-native. Every target can still share the same roles, product language, accessibility baseline, and documented component intent.

That is the promise behind Lumen 2.0.0: not one renderer everywhere, but one system that understands where it is running.

You can [explore the Lumen documentation](https://lumen.santi020k.com/), [read the cross-platform guides](https://lumen.santi020k.com/docs/foundations), or [follow the project on GitHub](https://github.com/santi020k/lumen).
