---
name: Add New Content
description: Guidelines and steps for adding new blog posts or projects to the site.
---

# Add New Content Skill

Use this skill when you need to create a new content entry in the `src/content/` directory.

## Prerequisite

Check the collection schema defined in `src/content/config.ts` to ensure you provide all required fields.

## Steps

### 1. Create the File

- **Blog Posts**: Create a new `.md` or `.mdx` file in `src/content/post/`.
- **Projects**: Create a new `.md` or `.mdx` file in `src/content/project/`.
- Filename convention: `kebab-case-title.md`.

### 2. Define Frontmatter

Ensure the frontmatter matches the schema. Example for a post:

```markdown
---
title: "My New Post"
description: "Brief summary of the post"
publishDate: "18 Mar 2026"
tags: ["tag1", "tag2"]
---
```

### 3. Add Content

- Use standard Markdown or MDX elements.
- For images, place them in the same directory as the content file and reference them relatively (e.g., `./image.png`).
- Use custom components if needed (e.g., `<Icon name="..." />`).

### 4. Verify

- Run `npm run dev` to preview the new content.
- Check for accessibility and proper formatting.
- Ensure the build passes without errors.
