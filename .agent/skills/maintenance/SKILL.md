---
name: Project Maintenance
description: Standard workflows for dependency updates, security audits, and linting.
---

# Project Maintenance Skill

Use this skill when performing general project cleanup, dependency updates, or security audits.

## Workflows

### 1. Dependency Updates

- Check for outdated packages: `npm outdated`.
- Update specific packages: `npm install [package]@latest`.
- Use `--legacy-peer-deps` only if there are unsolvable ESLint plugin conflicts.
- Always run `npm run lint` and `npm run check` after updates.

### 2. Security Audits

- Run `npm audit`.
- Attempt automatic fixes: `npm audit fix`.
- Manually review high-severity vulnerabilities if no automatic fix is available.

### 3. Linting and Fixing

- Check for style/convention issues: `npm run lint`.
- Auto-fix fixable issues: `npx eslint --fix .`.
- Manually address remaining errors (e.g., `no-unknown-classes`, `no-nested-ternary`).
- Verify TypeScript consistency: `npm run check`.

### 4. Deployment Check

- Ensure `astro.config.ts` has the correct `site` and `webmanifest` configuration.
- Check `vercel.json` if deploying to Vercel (used for redirects/headers).
