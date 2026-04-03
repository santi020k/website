---
name: Testing Infrastructure
description: Guidelines for writing and running Vitest unit tests and Playwright E2E tests.
---

# Testing Skill

Use this skill when adding new features or fixing bugs to ensure regression testing is in place.

## Test Types

### 1. Unit Tests (Vitest)

- **Location**: `src/**/__tests__/*.test.ts`
- **Purpose**: Test utility functions and pure logic.
- **Mocking**:
  - Virtual modules like `astro:env/server` are mocked in `vitest.config.ts`.
  - Use `vi.mock()` in `src/test-setup.ts` or individual test files for other dependencies.
- **Commands**:
  - `pnpm run test`: Run all unit tests once.
  - `pnpm run test:watch`: Run tests in watch mode.

### 2. E2E Tests (Playwright)

- **Location**: `tests/*.spec.ts`
- **Purpose**: Test user flows, navigation, and cross-browser compatibility.
- **Commands**:
  - `pnpm run test:e2e`: Run Playwright tests.
  - `pnpm run test:e2e:ui`: Open Playwright UI for interactive debugging.

## Best Practices

- **Isolation**: Pure utility functions should be tested in isolation in `src/utils/__tests__/`.
- **Naming**: Use descriptive `describe` and `it`/`test` blocks.
- **Timezones**: When testing dates, use ISO strings with time components (e.g., `2024-01-01T12:00:00`) to avoid local timezone shifts during parsing.
- **Astro Components**: For component testing, prefer E2E tests for now as they validate the full rendered output in a real browser.
