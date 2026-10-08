---
title: "How API Contracts Keep Frontend Delivery Moving"
description: "Use API contracts and realistic mocks to develop frontend and backend in parallel, expose unclear behavior early, and keep integration honest."
publishDate: "2027-01-05T14:00:00.000Z"
draft: true
coverImage:
  alt: "Off-white interface tiles and violet service blocks connected through a shared translucent template"
  src: "./cover.webp"
tags: ["frontend", "architecture", "developer-experience", "openapi", "headless-commerce"]
postType: "Guide"
---

A frontend team can finish a screen and still be weeks away from knowing whether it works. The
layout looks right, the mock returns a successful response, and the demo is convincing. Then the
real service arrives with a different idea of what an empty result, an unavailable item, or a
failed request means.

That gap is worth addressing before either implementation gets too far ahead.

During the [Marcone storefront rebuild at Smith Commerce](/portfolio/smith-commerce/), part of my
work was enabling parallel frontend and backend delivery against mocked OpenAPI contracts. The
frontend could develop against an agreed interface while the backend implementation progressed.

The useful lesson is that an API contract can make unresolved product decisions visible early.
The workflow below is a practical way to apply that principle. The product example is illustrative.

## Agree on behavior before building the happy path

An endpoint name and a sample response leave many questions unanswered. Before connecting a
screen to a mock, agree on the behavior that affects the user.

For a product detail page, that conversation might look like this:

**Product exists.** Agree on which fields are required, optional, or explicitly empty. Exercise the
details screen with meaningful fallbacks for missing information.

**Price is unavailable.** Decide whether that means unknown, restricted, or temporarily unavailable.
Explain the specific state without displaying a zero price.

**Product cannot be purchased.** Define the availability states and what each one means. Show a clear
reason and the appropriate next action.

**Request is rejected.** Agree on the status and error details the client can rely on. Show useful
feedback without exposing internal details.

**Response is delayed.** Set the expected timeout and retry behavior. Preserve the user's context and
provide a recoverable loading state.

These are product and API decisions. Bringing frontend, backend, and product into the same
conversation helps prevent each team from filling the gaps differently.

[OpenAPI](https://spec.openapis.org/oas/latest.html) provides a standard format for describing
HTTP APIs, including operations, request and response schemas, and examples. Use it to record
the parts of the agreement it can express. Keep the remaining behavior clear in the accompanying
documentation and acceptance criteria.

## Keep the agreement small enough to review

Start with one useful interaction: a product lookup, a search result, or another bounded part of
the experience. A small contract is easier to discuss and exercise than an attempted description
of the entire storefront.

For that interaction, review:

- The request, response, required fields, and meaning of missing values.
- The expected failure responses and the safe information available to the user.
- Who owns each rule and who needs to review a change.
- Examples that cover normal, empty, restricted, and failed states where they apply.

The contract should describe something both teams can implement and verify. If the backend cannot
provide a field reliably, discovering that during review is cheaper than designing a screen that
depends on it.

## Let both implementations move against the same agreement

Once the first interaction is agreed, frontend and backend work can proceed in parallel.

The frontend uses the mock to build rendering, forms, validation feedback, loading states, and
recovery behavior. The backend implements the operation, validates inputs, enforces access rules,
and produces the agreed responses.

Both sides need to review changes to the contract. A renamed field, a new error condition, or a
different meaning for an existing value can change the user experience even when the transport
still works.

Keep the mock on the same request path that the real integration will use. Components that read
fixture objects directly can skip serialization, response handling, and other behavior that matters
when the network is involved. Prefer switching the data source at the transport boundary while
keeping the application flow intact.

The server remains responsible for authorization and business rules. A disabled button is useful
feedback, but it cannot enforce whether an operation is allowed.

## Make the mock useful under imperfect conditions

A mock becomes valuable when it lets you explore a state on demand.

Use a few named, repeatable scenarios. Start with normal data, an empty result, and an expected
failure. Add slow responses, missing optional fields, or permission-related states when they affect
the feature. Keep the data synthetic and small enough to understand during a review.

For the illustrative product page, switching between an available item and an item with an unknown
price should make the UI difference obvious. If both scenarios produce the same screen, either the
contract or the interface still needs work.

Validate examples against the schema where your tooling supports it. That catches structural drift,
but it does not prove that the behavior or the live service is correct. A valid response can still
carry the wrong meaning.

## Integrate while changes are still cheap

Parallel development still needs frequent contact with the real system. Connect the first usable
backend operation as soon as it is available, then run the same important scenarios against it.

The live integration can reveal differences that a mock does not reproduce: authentication,
environment configuration, real data variation, latency, and the way failures travel through the
system. For operations that change data, also check whether retries are safe before allowing the
client to repeat a request.

When the implementation and the contract disagree, decide which one should change. Updating a
fixture until the UI looks correct can hide the disagreement and leave the next consumer with the
same problem.

Keep progress language precise. “The screen works against the agreed mock” is useful evidence.
“The flow works against the real service in the target environment” is a separate milestone.
Neither statement alone establishes production readiness.

## Review the feature as one user flow

Before calling the feature ready, check the complete path:

1. The contract reflects the current product decisions.
2. The examples and mock agree with that contract.
3. The UI handles the relevant loading, empty, success, and failure states.
4. The real service enforces permissions and business rules independently of the UI.
5. The integrated flow has been exercised in the intended environment.

For a small feature, this can be a short conversation and a few focused checks. Add tooling when
the repetition or risk justifies it. The contract earns its place by reducing uncertainty for the
people delivering and maintaining the feature.

The [Smith Commerce case study](/portfolio/smith-commerce/) shows the broader storefront work,
including frontend architecture, performance, and accessibility. Parallel delivery was one part of
that work: giving the frontend a dependable agreement to build against while keeping real
integration visible throughout the process.
