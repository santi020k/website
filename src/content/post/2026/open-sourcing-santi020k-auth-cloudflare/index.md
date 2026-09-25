---
title: "Open-sourcing authentication without sharing accounts"
description: "Why I made @santi020k/auth-cloudflare public, how it reuses email-code and passkey policy across Cloudflare applications, and where the shared boundary deliberately ends."
publishDate: "2026-09-25T13:00:00.000Z"
coverImage:
  alt: "A lock at the center of separate application boundaries connected by a shared policy layer"
  src: "./cover.webp"
tags: ["authentication", "cloudflare-workers", "passkeys", "security", "open-source"]
postType: "Deep Dive"
---

Today I made the [`santi020k/auth`](https://github.com/santi020k/auth) repository public and released [`@santi020k/auth-cloudflare`](https://www.npmjs.com/package/@santi020k/auth-cloudflare) as an experimental `0.x` package.

The package extracts authentication policy I need across single-owner and multi-user applications built with Hono, Cloudflare Workers, and D1. It supports email codes and passkeys, but the more important part is the boundary around them: shared protocol decisions must not become shared identity state.

The code is open source under the MIT license. The release is public and installable. It is also deliberately labeled experimental while integrations on real application origins build the evidence required for a stable contract.

## The repeated code was not the real problem

Several of my applications need the same basic authentication shape:

- one configured owner or an application-owned membership lookup;
- a short-lived email code for sign-in and recovery;
- a passkey after the initial identity check;
- sessions stored beside the product that uses them;
- current membership rechecked when multi-user sessions are created or resolved and when authenticated passkey operations run;
- rate limits that survive Cloudflare Worker isolate restarts; and
- strict browser-origin and cookie boundaries.

Copying that setup into each repository would duplicate more than code. It would duplicate security decisions, migrations, edge cases, and test expectations. A fix in one application could easily fail to reach another.

Centralizing everything would create the opposite problem. One account database or shared session system would couple products that should be able to deploy, recover, and evolve independently.

I wanted to reuse the policy without creating an identity platform.

## Share policy, not identity state

`@santi020k/auth-cloudflare` owns the reusable authentication layer:

- Better Auth configuration for Cloudflare Workers and D1;
- configured-owner or live membership enforcement;
- email-code expiry and verification limits;
- success-shaped responses that avoid disclosing whether an address is authorized;
- discoverable, user-verified passkeys;
- exact-origin request checks;
- production cookie requirements;
- durable D1-backed rate limits; and
- typed server, browser, Hono middleware, and schema exports.

Each consuming application still owns its users, D1 database, additive migrations, secret, cookie prefix, hostname, relying-party ID, passkeys, email copy, delivery provider, authorization rules, recovery policy, and deployment.

That distinction is the project. The package is useful because it stops before product ownership begins.

## Email codes and passkeys have different jobs

Email codes provide the initial identity check and a recovery path. They are six digits, stored hashed, expire after ten minutes, and allow five verification attempts. Unauthorized addresses receive the same response shape without receiving mail, authenticating, or creating a user.

Passkeys improve the normal sign-in path after that initial verification. The policy requires discoverable credentials and user verification, and the WebAuthn relying-party ID is the exact application hostname.

Neither mechanism removes the need for recovery planning. A product still needs to decide how email is delivered, how access is restored, what happens during a provider outage, and how a migration can be reversed safely.

## Edge authentication needs durable boundaries

Worker isolates are disposable, so an in-memory rate limiter is not a meaningful security control. The package persists rate-limit state in D1 alongside Better Auth's application-specific records.

Browser boundaries are equally explicit. A consumer configures its public application origin separately from its authentication server URL. Credentialed CORS responses are scoped to that exact application origin, unsafe requests without the expected origin are rejected, and production origins require HTTPS with secure cookies.

The package also avoids silently mutating production data. It ships a canonical D1 schema that a consumer copies into an application-owned additive migration, reviews, and deploys through that product's normal process.

## Public does not mean stable

The repository, documentation, and npm package are public now. The API is still an experimental `0.x` contract, so consumers should pin the version, read the changelog, and keep their current login and recovery path available during adoption.

Automated checks cover strict types, linting, package exports, D1 integration behavior, browser accessibility, responsive layouts, dependency advisories, CodeQL, and release provenance. Those checks are necessary, but they cannot prove that a particular product's transactional email arrives or that a passkey works on its final HTTPS origin.

That evidence belongs to each integration. A package release and a production-ready consumer are related milestones, not the same one.

## What I want this project to make easier

The goal is not to make authentication look trivial. It is to make the shared decisions reviewable and the product-specific responsibilities impossible to miss.

Opening the project lets other developers inspect the security model, follow its progress, report vulnerabilities through the private channel, and evaluate whether its narrow Cloudflare contract fits their application. Keeping the experimental label visible makes the current maturity just as clear as the availability.

You can [read the documentation](https://auth.santi020k.com/), [inspect the source](https://github.com/santi020k/auth), [view the npm package](https://www.npmjs.com/package/@santi020k/auth-cloudflare), or read the shorter [portfolio case study](/portfolio/auth/).
