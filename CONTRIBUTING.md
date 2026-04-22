# Contributing

Thanks for contributing to this project.

## Prerequisites

- Node.js `24.x` (the repo enforces `>=24.0.0`)
- `pnpm@10.32.1`

## Local Setup

1. Install dependencies:
   - `pnpm install`
2. Start development server:
   - `pnpm run dev`

## Quality Gates

Run these before opening a pull request:

- `pnpm run lint`
- `pnpm run check`
- `pnpm run test`
- `pnpm run test:e2e:fast` (recommended for route-level changes)

For full parity with pre-push validation:

- `pnpm run ci:verify`

## Commit and PR Expectations

- Follow Conventional Commits (`feat:`, `fix:`, `docs:`, etc.).
- Keep changes focused and include tests/docs when behavior changes.
- Use the pull request template and complete the checklist.

## Content and Accessibility

- Keep internal links with trailing slashes.
- Ensure each new page has a unique title and meta description.
- Preserve WCAG 2.2 AA quality (keyboard access, semantic structure, and reduced-motion support).
