---
name: Project Maintenance
description: Standard workflows for dependency updates, security audits, and linting.
---

# Project Maintenance Skill

Use this skill when performing general project cleanup, dependency updates, or security audits.

## Workflows

### 1. Dependency Updates

- Check for outdated packages: `pnpm outdated`.
- Update specific packages: `pnpm add [package]@latest`.
- Always run `pnpm run lint` and `pnpm run check` after updates.

### 2. Security Audits

- Run `pnpm audit`.
- Attempt automatic fixes: `pnpm audit --fix`.
- Manually review high-severity vulnerabilities if no automatic fix is available.

### 3. Linting and Fixing

- Check for style/convention issues: `pnpm run lint`.
- Auto-fix fixable issues: `pnpm exec eslint --fix .`.
- Manually address remaining errors (e.g., `no-unknown-classes`, `no-nested-ternary`).
- Verify TypeScript consistency: `pnpm run check`.

### 4. Deployment Check

- Ensure `astro.config.ts` has the correct `site` and `webmanifest` configuration.
- Check `vercel.json` if deploying to Vercel (used for redirects/headers).
