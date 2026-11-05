---
title: "santi020k auth"
description: "Built an open-source authentication policy for single-owner and multi-user Hono applications on Cloudflare Workers and D1, with email codes, passkeys, isolated identity state, and explicit production-readiness gates."
brand:
  primary: "#4d9272"
  secondary: "#dc8b37"
  surface: "#10291f"
role: "Creator"
startingDate: "24 Sep 2026"
githubUrl: "https://github.com/santi020k/auth"
liveDemoUrl: "https://auth.santi020k.com/"
typesId: "personal"
relevanceWeight: 20
impactMetrics: [
  "Published @santi020k/auth-cloudflare as an experimental open-source package for single-owner and multi-user Cloudflare applications",
  "Combines email-code and passkey authentication with exact-origin checks, durable D1 rate limits, and secure production cookies",
  "Keeps every consumer's users, sessions, secrets, migrations, passkeys, recovery policy, and deployment isolated"
  ]
technologies: [
  "TypeScript", "Better Auth", "Hono", "Cloudflare Workers", "Cloudflare D1", "Passkeys", "WebAuthn",
  "Email OTP", "Astro", "Lumen UI", "pnpm", "Vitest", "Playwright", "GitHub Actions", "CodeQL",
  "Authentication", "Security", "Developer Experience (DX)", "Open Source"
  ]
coverImage:
  src: "./cover.webp"
  horizontal: "./cover-horizontal.webp"
  vertical: "./cover-vertical.webp"
  logo: "./logo.svg"
  logoAspect: "square"
  logoSurface: "light"
  alt: "Lock mark representing isolated authentication for Cloudflare applications"
  ogImage: "./cover.webp"
caseStudy:
  problem: "Several applications needed the same carefully reviewed authentication policy without sharing accounts, credentials, or operational ownership."
  approach: "Extract the protocol policy into a narrow Better Auth adapter while keeping data, migrations, secrets, origins, cookies, email delivery, authorization, and recovery inside each consumer."
  outcome: "A public experimental package now provides a consistent authentication foundation for single-owner and multi-user applications, with explicit adoption and production-readiness checks."
---

## Reusing authentication policy without sharing accounts

I built `santi020k auth` for a recurring problem across my Cloudflare applications: the security-sensitive protocol work was similar, but the identity state and product responsibilities needed to stay separate.

The first public adapter, [`@santi020k/auth-cloudflare`](https://www.npmjs.com/package/@santi020k/auth-cloudflare), provides email-code and passkey authentication for single-owner and multi-user Hono applications running on Cloudflare Workers and D1. The [source repository](https://github.com/santi020k/auth) is open under the MIT license, and the package is available as an experimental `0.x` release.

### Goals

- **Reuse reviewed authentication policy** without creating a shared account system across products.
- **Keep every browser boundary explicit** through exact application origins, cookie prefixes, and WebAuthn relying-party IDs.
- **Make secure behavior reviewable** with D1 integration tests, package-contract checks, browser tests, and documented adoption gates.
- **Support gradual migration** while each product preserves its existing login and recovery path until the new flow is proven on its real origin.

### What I built

- **A typed Better Auth policy layer** with single-owner and application-owned multi-user membership policies for Hono applications on Cloudflare Workers.
- **Email-code authentication** with hashed codes, ten-minute expiry, limited verification attempts, and success-shaped responses that do not reveal whether an address is authorized.
- **Passkey support** that requires discoverable credentials and user verification for the exact application hostname.
- **Durable rate limiting in D1** instead of isolate memory that disappears when a Worker is recycled.
- **Server, browser client, Hono middleware, and schema exports** so consumers can integrate the package without reaching into private modules.
- **A local playground and documentation website** for reviewing the complete flow, security boundary, migration steps, and release status.

### The isolation contract

The package owns protocol policy and reusable integration code. It does not own a product's users.

Every consuming application keeps its own D1 database, additive migrations, authentication secret, cookie namespace, hostname, passkeys, email delivery, authorization rules, recovery process, and deployment. Sessions never cross application boundaries, and adopting the package never turns separate products into one identity platform.

### Security and release discipline

- **Exact-origin requests:** credentialed browser requests are accepted only from the configured application origin.
- **Current membership:** only the configured owner or an email approved by the consumer's live membership policy may create or update a user; multi-user sessions and authenticated passkey operations recheck access so removal does not wait for session expiry.
- **Production transport:** non-local origins require HTTPS and secure cookies.
- **Private vulnerability reporting:** security reports follow the repository's documented private channel rather than public issues.
- **Evidence before stability:** repository checks can prove package behavior, but real email delivery, recovery, migrations, and passkeys must still be verified on each consumer's production origin.

### Why it matters

Authentication reuse becomes dangerous when sharing code quietly turns into sharing identity state. The stronger boundary is narrower: standardize the protocol decisions that should be reviewed once, then make every product remain responsible for its own data and operational recovery.

That is what `santi020k auth` provides. It is public so the policy and implementation can be inspected, tested, and improved in the open. It remains explicitly experimental while real consumers produce the evidence needed for a stable contract.

[Read the documentation](https://auth.santi020k.com/), [install the package from npm](https://www.npmjs.com/package/@santi020k/auth-cloudflare), or [explore the source on GitHub](https://github.com/santi020k/auth).
