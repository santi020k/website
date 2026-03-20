---
name: Adding Projects
description: Step-by-step guide for creating new portfolio project entries (work experience, personal, or experimental).
---

# Adding Projects Skill

Use this skill when you need to add a new portfolio project entry to the site. Projects represent work experiences, personal projects, or experimental initiatives.

## Prerequisite

- Review the project collection schema in `src/content.config.ts` (the `project` `defineCollection` block).
- Use `npm` as the package manager (not `yarn`).
- Run commands from the project root (`/Users/smith/Projects/santi020k/private-website`), not from subdirectories.

## Steps

### 1. Verify the Role Exists

The `rol` field uses a strict enum. Check `src/content.config.ts` for the current allowed values:

```any
rol: z.enum([
  'Technical Lead', 'Full Stack', 'Front-End Lead',
  'Front End Developer', 'CTO', 'Creator', 'Co-Organizer'
]).optional()
```

If the new project's role isn't listed, **add it to the enum before creating the entry**.

### 2. Create the Project Directory and File

Projects live in `src/content/project/<slug>/index.md` where `<slug>` is kebab-case.

```any
src/content/project/<project-slug>/
├── index.md        # Content file (required)
├── cover.webp      # Cover image (optional, recommended)
└── *.webp          # Additional images referenced in body (optional)
```

### 3. Define Frontmatter

All required and optional fields:

```markdown
---
title: "Company or Project Name"                     # Required, max 60 chars
description: "A compelling summary of the project."  # Required
rol: "Front End Developer"                           # Optional, must match enum
startingDate: "1 May 2025"                           # Required, format: "D Mon YYYY"
endingDate: "1 Dec 2025"                             # Optional, omit for "Present"
liveDemoUrl: "https://example.com"                   # Optional, must be valid URL
githubUrl: "https://github.com/user/repo"            # Optional, must be valid URL
typesId: "professional"                              # Optional: "professional", "personal", or "experimental"
orderInTypes: 1                                      # Optional, controls sort order within type
draft: false                                         # Optional, default false
seoTitle: "Custom SEO Title"                         # Optional
seoDescription: "Custom meta description for SEO"    # Optional
technologies: [
  "React", "TypeScript", "Next.js"                   # Array of strings, duplicates auto-removed
]
coverImage:                                          # Optional block
  src: "./cover.webp"                                # Relative path to image in same dir
  alt: "Description of the cover image"
  ogImage: "./cover.webp"                            # Optional OG image
---
```

### 4. Write the Content Body

Follow the established content patterns from existing entries (e.g., `void/index.md`, `datagran/index.md`):

- Start with `---` (horizontal rule) after frontmatter, then a `## Heading`.
- Write a concise **project overview** paragraph with context (timeframe, company, mission).
- Use `### Emoji Section Headings` (e.g., `### 🚀 Key Contributions`).
- Use bulleted lists with **emoji prefixes** and **bold lead-ins** for key results.
- Include a **Tech Stack** section with inline code grouped by category.
- End with a closing reflection and a LinkedIn CTA link.
- Reference images with `![alt](filename.webp)` (relative to the index.md file).

### 5. Available Project Types

| `typesId` | Tab Label | Description |
| :--- | :--- | :--- |
| `professional` | Professional Work | Client and company projects |
| `personal` | Personal Projects | Passion-driven initiatives |
| `experimental` | *(if defined)* | Experimental explorations |

Types are defined in `src/content/types/`. Add a new `.md` there if a new type is needed.

### 6. Verify

```bash
# From the project root
npm run build    # Must pass with 0 errors
npm run dev      # Preview at http://localhost:4321/portfolio/<project-slug>
```

- Confirm the entry appears under the correct tab on `/portfolio/`.
- Check that technologies appear in the sidebar tag cloud.
- Validate images load correctly and have proper alt text.
- Ensure the build completes without schema validation errors.

## Common Pitfalls

- **Wrong `rol` value**: Build will fail with a Zod validation error. Always check the enum first.
- **Wrong working directory**: Always run `npm` from the project root, not from content subdirectories.
- **Using `yarn`**: This project uses `npm`. Running `yarn` will fail with `command not found`.
- **Missing `startingDate`**: This field is required; the build will fail without it.
- **Title too long**: Max 60 characters enforced by schema.
- **Invalid URL format**: `liveDemoUrl` and `githubUrl` must be valid URLs (validated by Zod).
