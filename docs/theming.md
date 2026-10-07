# Theming: Shared Santi020k Tokens

The website uses the public `@santi020k/theme` package as the source for core brand color and font tokens. Tailwind CSS v4 still reads everything from `src/styles/global.css`, but the shared token values now enter through:

```css
@import "@santi020k/theme/tokens.css";
```

Local website-only extensions live in `src/styles/partials/tokens.css`.

## Homepage redesign

The [sculpted style guide](sculpted-style-guide.md) defines the new homepage typography,
solid surfaces, spacing, buttons, and responsive compositions. It builds on the same shared
tokens; other routes keep their existing styles until they are deliberately migrated.

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

## Site navigation

`SiteHeader.astro` composes native navigation with Lumen buttons, icons, search, and theme
controls into a single surface. Native `nav` preserves normal Tab access to every link; the
installed Lumen navigation menu uses arrow-key groups instead. `src/styles/partials/nav.css` owns the signature tab, desktop dock, and attached
mobile menu. Both menus derive their links and active route from `menuLinks` in `src/site.config.ts`.
The desktop menu starts at 1024px; the contact button appears at 1200px to preserve link space.
The contact action uses Lumen's unstyled `ButtonLink` with a flat, contrasting label and a
separate arrow tile. It has no gradient, glow, or magnetic effect. Its mobile version fills
the menu width above a quiet resume link; both keep the same keyboard and link semantics.
Below 640px, the shell has more side padding and separation between icon controls. A container
query hides the secondary wordmark when narrow widths or enlarged text need room for the controls;
the signature tab and accessible home-link name remain available.

The mobile panel follows the header's measured position and scrolls within the available viewport.
Its keyboard loop includes the visible header controls, yields to the search dialog, and restores
focus on dismissal. Route changes and desktop resizing close it. Panel motion is disabled for
reduced-motion preferences. Navigation shadows are site tokens in `partials/tokens.css`.

`SearchDialog.astro` carries the same signature tab, solid surface, and squared controls into
site search. Numbered suggestions and compact result rows share a scrollable area above keyboard
hints. The panel uses the available viewport height, with a compact header on short screens.
`SiteSearch.astro` retains query ranking, recent searches, retry and clear actions, keyboard
navigation, focus restoration, and reduced-motion-aware opening and closing.
