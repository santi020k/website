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
