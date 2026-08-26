---
name: Creating Components
description: Guidelines for creating reusable Astro components, accepting props, and applying Tailwind CSS styles.
---

# Creating Components Skill

Use this skill when tasked with building a new UI component or refactoring an existing one in the `src/components/` directory.

## Best Practices

### 1. Component Placement

- Place generic UI elements (buttons, badges) directly in `src/components/`.
- If the component belongs to a specific feature or layout section, nest it appropriately (e.g., `src/components/blog/`, `src/components/layout/`).

### 2. File Structure

An `.astro` file consists of two main parts: the Component Script (between `---`) and the Component Template.

```astro
---
// Component Script: Imports and Logic
import { Icon } from 'astro-icon/components'

// Always define expected props using a TypeScript interface
interface Props {
  title: string
  isActive?: boolean
}

const { title, isActive = false } = Astro.props
---

<!-- Component Template: HTML and JSX-like syntax -->
<div
  class="flex items-center rounded-lg p-4"
  class:list={[{ 'bg-blue-500 text-white': isActive }, { 'bg-gray-100': !isActive }]}
>
  <Icon name="mdi:star" class="mr-2 size-6" />
  <span>{title}</span>
</div>
```

### 3. Styling Rules

- **Tailwind Utility Classes**: Prefer standard utility classes. Use `class:list` for conditional styling.
- **Single-surface rule**: Do not nest card-like surfaces (`panel-card`, `card-interactive`, `mini-note`, `talk-card`, `glass-pro`, `section-shell`, `section-shell-subtle`, or equivalent rounded/bordered/background/shadow blocks) inside each other. Use plain rows, dividers, typography, and inline metadata inside cards.
- **Icons**: Use the `astro-icon` integration (`<Icon name="collection:icon-name" />`).
- **CSS Formatting**: When applying many Tailwind classes, format them on multiple lines grouped by purpose (layout, spacing, typography, colors, interactions) to improve readability. Do not create excessively long single-line class strings.

### 4. Interactive Components

If a component requires client-side interactivity, you have options:

- **Inline scripts**: Use bundled `<script>` tags, DOM APIs, and custom events for lightweight interactions such as dropdowns, dialogs, and filters.
- **Custom elements**: Prefer a small standards-based custom element when behavior needs a reusable lifecycle or encapsulated state.
- **Client directives**: Do not introduce a frontend framework runtime unless the interaction genuinely requires a component tree and the architectural tradeoff is explicitly approved.
