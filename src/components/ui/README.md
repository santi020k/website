# Astro UI Components

Astro-native shadcn-inspired component package for this site.

These components mirror the current shadcn/ui component catalog as framework-free Astro primitives. They use project design tokens, Tailwind v4 utilities, native HTML semantics, and slots so pages can adopt them gradually without adding a React runtime.

Import individual components:

```astro
---
import { Button, Card, Input } from '@/components/ui'
---

<Card>
  <Input aria-label="Email" type="email" />
  <Button>Subscribe</Button>
</Card>
```

Complex components such as Dialog, Popover, Tabs, Command, and Menus expose the semantic shell and styling. Add page-local vanilla JavaScript when a specific workflow needs state, focus management, or async behavior.

## Interactive Behavior

The site loads `UIPrimitives.astro` from the base layout. It progressively enhances these primitives after initial load and after Astro view-transition swaps.

Behavior hooks:

- Dialog family: add `id` to `Dialog`, `AlertDialog`, `Drawer`, or `Sheet`; open with `data-ui-dialog-trigger="id"` / `data-ui-alert-dialog-trigger="id"` / `data-ui-drawer-trigger="id"` / `data-ui-sheet-trigger="id"` and close with the matching `data-ui-*-close` attribute.
- Popover, DropdownMenu, and HoverCard: place a child trigger with `data-ui-trigger`; its `aria-controls` should point to the hidden panel.
- Tabs: use `role="tablist"`, `role="tab"`, `aria-controls`, `aria-selected`, and `role="tabpanel"`.
- Menubar, NavigationMenu, RadioGroup, and ToggleGroup: child buttons, links, radio inputs, or role items get roving arrow-key focus.
- Command and Combobox: child items marked with `data-ui-command-item` or `role="option"` are filtered by the text/search input.
- Carousel: mark the scroll container with `data-ui-carousel-viewport` and controls with `data-ui-carousel-prev` / `data-ui-carousel-next`.
- Sonner: dispatch `new CustomEvent('ui:toast', { detail: { title, description, variant } })` to create a toast.
