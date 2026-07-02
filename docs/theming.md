# Theming: Shared Santi020k Tokens

The website uses the public `@santi020k/theme` package as the source for core brand color and font tokens. Tailwind CSS v4 still reads everything from `src/styles/global.css`, but the shared token values now enter through:

```css
@import "@santi020k/theme/tokens.css";
```

Local website-only extensions live in `src/styles/partials/tokens.css`.

## Token Layers

1. **Package tokens**: `@santi020k/theme/tokens.css` defines the core Santi020k HSL variables, font variables, `data-theme` dark variant, and Tailwind `@theme` color mappings.
2. **Website extensions**: `src/styles/partials/tokens.css` defines status colors (`success`, `warning`, `danger`) and animation shorthands used by local components.
3. **Base and utilities**: the remaining style partials consume those tokens through semantic custom properties and Tailwind utilities.

## Key CSS Variables

- **`--theme-bg`** / `--color-canvas`: page background.
- **`--surface`**, **`--surface-muted`**, **`--surface-strong`**: card, panel, and elevated UI surfaces.
- **`--line`**: borders and dividers.
- **`--ink`**, **`--ink-soft`**, **`--ink-muted`**: text hierarchy.
- **`--brand`**, **`--brand-solid`**, **`--brand-soft`**, **`--accent`**, **`--glow`**: brand and interactive emphasis.

## Dark Mode

Dark mode is controlled with `data-theme="dark"` on `<html>`. Do not use `class="dark"` for theme switching; the Tailwind custom variant is defined against the data attribute.

## Usage

Use Tailwind token utilities such as `bg-canvas`, `bg-surface`, `border-line`, `text-ink`, `text-ink-soft`, `text-brand`, and `bg-brand/10`. For custom CSS, use semantic variables such as `hsl(var(--surface))` or `hsl(var(--brand) / 0.12)`.

## Asset And Font Helpers

Use package assets for shared Santi020k brand surfaces:

```text
import logoUrl from '@santi020k/theme/assets/logos/logo-santi020k.webp'
import { fontFamily, staticAssets } from '@santi020k/theme'
```

- `fontFamily` and `typography` provide the canonical Montserrat stacks and metadata.
- `staticAssets` maps public output paths to package asset paths for generated favicons and app icons.
- Direct `@santi020k/theme/assets/...` imports are preferred for Vite/Astro-managed image URLs.
- `import.meta.resolve('@santi020k/theme/assets/...')` is preferred in Node scripts that need filesystem paths for Sharp or Satori.

Do not duplicate core brand values or package-owned assets in this repo. If the Santi020k palette or shared assets change, update and publish `@santi020k/theme`, then bump the dependency here.
