# Site Components

Reference for the component architecture and reusable components in this Astro project.

## Component Hierarchy

```
src/components/
├── atoms/          # Single-purpose, non-composite elements
├── molecules/      # Simple component combinations
├── organisms/      # Complex sections (kept minimal)
└── pages/          # Page-specific components
```

## Atomic Components

### AnimatedPortrait
Hero portrait wrapper with decorative effects.

```astro
import AnimatedPortrait from '@/components/atoms/AnimatedPortrait.astro'
import portraitImage from '@/assets/photos/portrait.webp'

<AnimatedPortrait
  src={portraitImage}
  alt="Portrait description"
  showFloatingBadges
  badgeProps={{
    location: { label: 'Base', text: 'City · Remote' },
    experience: { label: 'Experience', value: '12+' }
  }}
/>
```

**Props:**
- `src: ImageMetadata` - Astro image asset
- `alt: string` - Alt text
- `showFloatingBadges?: boolean` - Enable floating badges
- `badgeProps?.location` - Left badge config
- `badgeProps?.experience` - Right badge config

### MiniNote
Small info card with label slot.

```astro
import MiniNote from '@/components/atoms/MiniNote.astro'

<MiniNote label="Experience">
  <p class="text-lg font-semibold">12+ years</p>
</MiniNote>
```

**Props:**
- `label: string` - Section label
- `className?: string` - Additional classes
- `borderPosition?: 'left' | 'right' | 'none'` - Border accent side

## Molecular Components

### SectionHeader
Standardized section header with eyebrow, title, description.

```astro
import SectionHeader from '@/components/molecules/SectionHeader.astro'

<SectionHeader
  eyebrow="Work Experience"
  title="Professional roles."
  description="Client and product work across teams."
/>
```

**Props:**
- `eyebrow?: string` - Small uppercase label
- `title: string` - Main heading
- `description?: string` - Supporting text
- `variant?: 'default' | 'shelf'` - Card vs plain style
- `align?: 'center' | 'left'` - Text alignment

### ProjectPreviewCard
Simplified project card for listing pages.

```astro
import ProjectPreviewCard from '@/components/molecules/ProjectPreviewCard.astro'

<ProjectPreviewCard
  project={projectEntry}
  accentTone="brand"  // or "accent" for different color
/>
```

**Props:**
- `project: CollectionEntry<'project'>` - Astro content collection entry
- `accentTone?: 'brand' | 'accent'` - Status badge color theme

### PrincipleCard
Numbered principle display with optional featured span.

```astro
import PrincipleCard from '@/components/molecules/PrincipleCard.astro'

<PrincipleCard
  index={0}
  title="Automate the friction"
  body="Description text..."
  featured={true}  // Spans 2 columns on sm+
/>
```

### TestimonialCard
Quote card with avatar/initials fallback.

```astro
import TestimonialCard from '@/components/molecules/TestimonialCard.astro'

<TestimonialCard
  quote="The actual testimonial text..."
  authorName="Jane Doe"
  role="Engineering Manager"
  relationship="Former colleague"
  avatarInitials="JD"
  avatarUrl={optionalImageUrl}
/>
```

### CommunityCard
Icon-driven info card for speaking/community sections.

```astro
import CommunityCard from '@/components/molecules/CommunityCard.astro'

<CommunityCard
  title="ReactJS Colombia"
  subtitle="Co-organizer"
  description="Building the local React community..."
  icon='<path d="M12 22s8-4..."/>'
  tone="brand"  // or "accent"
/>
```

### PostListItem
Single post row for writing sections.

```astro
import PostListItem from '@/components/molecules/PostListItem.astro'

<PostListItem post={postEntry} />
```

## Common Layout Patterns

### Two-Column Section
The standard layout used across home and about pages:

```astro
<section class="grid gap-8 pt-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-10" data-animate>
  <SectionHeader ... />
  <div class="space-y-6">
    {/* Content */}
  </div>
</section>
```

Grid ratio: **0.72fr : 1.28fr** (narrow header, wide content)

## Animation Attributes

- `data-animate` - Triggers scroll-based section animations
- `data-stagger="60"` - Staggers child animations by 60ms increments

Always include `motion-reduce:` variants for any custom animations.

## Adding New Components

1. **Start at the right level** - Single element = atom, composite = molecule
2. **Use TypeScript interfaces** for all props
3. **Accept `className?: string`** for style overrides
4. **Follow naming**: PascalCase files, match component name
5. **Add `motion-reduce:` fallbacks** for any animations
6. **Use `@/` aliases** for imports from `src/`
