# Dependency and Maintenance Rules

## Package Management

- **pnpm**: Use `pnpm` as the primary package manager.
- **Audit Fixes**: Run `pnpm audit` periodically and apply upgrades intentionally instead of bulk auto-fixes.
- **Peer Dependencies**: Be cautious of peer dependency conflicts (ERESOLVE errors) when updating ESLint or related plugins. Use `--legacy-peer-deps` if necessary after manual verification.

## ESLint Configuration

- **@santi020k/eslint-config-basic**: This is the core configuration.
- **Overrides**: Keep local overrides in `eslint.config.js` to a minimum.
- **Tailwind Linter**: Ensure `better-tailwindcss` is correctly configured with the `entryPoint` in `eslint.config.js`.

## Code Quality

- **Automated Checks**: Always run `pnpm run lint` and `pnpm run check` (TypeScript) before committing core changes.
- **MDX Formatting**: Note that some stylistic rules (like `max-len`) are disabled for MDX to avoid linter crashes on virtual files.
