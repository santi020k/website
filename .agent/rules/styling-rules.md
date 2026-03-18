# Styling Rules and Patterns

## Tailwind CSS 4.x
- **Configuration**: Managed via `src/styles/global.css`. Avoid adding a `tailwind.config.js` unless strictly required.
- **Entry Point**: Always use `src/styles/global.css` as the source of truth for themes and utilities.
- **CSS Variables**: Use the `@theme` block in `global.css` to define custom colors and tokens.
  - Access these in components using standard Tailwind prefixing (e.g., `bg-accent-base`).

## Component Styling
- **Utility Classes**: Favor utility classes in the component's HTML tags.
- **`class:list`**: Use Astro's `class:list` directive for conditional classes.
- **Custom Utilities**: Define repeated complex patterns as `@utility` in `global.css` (e.g., `.title`).

## Consistency
- **Class Ordering**: Follow the default Tailwind recommended order (Prettier/ESLint should enforce this).
- **Responsive Design**: Use the standard `sm:`, `md:`, `lg:`, `xl:` breakpoints.
- **Dark Mode**: Use the `dark:` variant or the `data-theme="dark"` attribute on the root element.

## Ignored Classes
- If using `better-tailwindcss/no-unknown-classes`, ensure new custom utilities or theme variables are added to the ignore list in `eslint.config.js` if they are not auto-detected.
