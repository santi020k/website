# Dependency and Maintenance Rules

## Package Management
- **npm**: Use `npm` as the primary package manager.
- **Audit Fixes**: Run `npm audit fix` periodically to address security vulnerabilities.
- **Peer Dependencies**: Be cautious of peer dependency conflicts (ERESOLVE errors) when updating ESLint or related plugins. Use `--legacy-peer-deps` if necessary after manual verification.

## ESLint Configuration
- **@santi020k/eslint-config-basic**: This is the core configuration.
- **Overrides**: Keep local overrides in `eslint.config.js` to a minimum.
- **Tailwind Linter**: Ensure `better-tailwindcss` is correctly configured with the `entryPoint` in `eslint.config.js`.

## Code Quality
- **Automated Checks**: Always run `npm run lint` and `npm run check` (TypeScript) before committing core changes.
- **MDX Formatting**: Note that some stylistic rules (like `max-len`) are disabled for MDX to avoid linter crashes on virtual files.
