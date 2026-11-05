import type { MarkdownHeading } from 'astro'

interface ReadingChapter {
  heading: MarkdownHeading
  sections: MarkdownHeading[]
}

export const getReadingChapters = (headings: MarkdownHeading[]): ReadingChapter[] => {
  const chapters: ReadingChapter[] = []

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
