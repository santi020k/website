import type { MarkdownHeading } from 'astro'

interface ProjectChapter {
  heading: MarkdownHeading
  sections: MarkdownHeading[]
}

export const getProjectChapters = (headings: MarkdownHeading[]): ProjectChapter[] => {
  const chapters: ProjectChapter[] = []

  for (const heading of headings.filter(item => item.depth <= 3)) {
    const previous = chapters.at(-1)

    if (heading.depth === 3 && previous && previous.heading.depth <= 2) {
      previous.sections.push(heading)
    } else {
      chapters.push({ heading, sections: [] })
    }
  }

  return chapters
}
