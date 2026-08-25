---
title: "Coolstead"
description: "Built a native macOS menu-bar app that monitors thermal conditions and applies a gradual, safety-bounded fan curve without replacing macOS thermal protection."
role: "Creator"
startingDate: "24 Jul 2026"
typesId: "personal"
draft: true
relevanceWeight: 74
impactMetrics: ["Returns every controlled fan to automatic mode when cooling stops or the app quits", "Caps requested speed at 75% of each fan's reported range", "Supports fanless Macs with a monitoring-only experience"]
technologies: ["Swift", "SwiftUI", "macOS", "AppKit", "Swift Package Manager", "SMC", "Privileged Helper", "Hardware Monitoring", "Thermal Management", "Safety Engineering", "Testing", "Turborepo", "pnpm"]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.webp"
  logoAspect: "square"
  logoSurface: "neutral"
  alt: "Dark Mac cooling system with a central fan and a gradual curve moving from amber heat to cool cyan"
  ogImage: "./cover.webp"
---

## Designing steadier cooling for a Mac

Coolstead is a native macOS menu-bar experiment that begins cooling earlier than the default fan policy without treating maximum fan speed as the answer. It reads thermal state and sensor data, applies a gradual fan curve, and gives control back to macOS whenever active cooling is disabled.

The product is deliberately conservative. Fan control touches hardware behavior, so every feature is designed around limits, invalid-data handling, and a reliable return to automatic mode.

### Goals

- **Respond before heat becomes uncomfortable** with a smooth curve instead of an abrupt maximum-speed switch.
- **Keep safety visible in the architecture** rather than leaving it to interface copy.
- **Support different Mac hardware** including fanless devices that can still benefit from monitoring.
- **Remain reversible** so quitting, disconnecting, or losing trustworthy sensor data restores automatic control.

### What I built

- **A native menu-bar app** for current thermal state, temperature readings, fan monitoring, and balanced-cooling controls.
- **A privileged helper path** for the narrow set of operations that require elevated permission.
- **A bounded control model** that clamps requests to the fan's reported range and never asks for more than 75% of that range.
- **Gradual target ramping** so fan requests move toward the curve instead of jumping directly to it.
- **Monitoring-only behavior** for unsupported or fanless hardware.

### Technical highlights

- **Native platform work:** `Swift`, `SwiftUI`, macOS app packaging, menu-bar behavior, and a bundled helper.
- **Hardware integration:** reverse-engineered SMC behavior through the MIT-licensed `macos-smc-fan` package.
- **Failure handling:** missing or invalid readings disable writes, and lifecycle events return controlled fans to automatic mode.
- **Workspace tooling:** a small `pnpm` and `Turborepo` shell keeps build, test, type-check, and desktop-bundling commands consistent.

### Results

- **A safety-first thermal loop** where guardrails are part of the control path.
- **A quieter product philosophy** focused on earlier, gradual cooling rather than aggressive fan behavior.
- **A native foundation** that can be tested in monitoring-only mode before privileged control is approved.

### Why it matters

System utilities earn trust through what they refuse to do. Coolstead is an exercise in making a small hardware-facing tool useful while keeping its limits explicit.
