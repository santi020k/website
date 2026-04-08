export interface EditorialCalendarEntry {
  format: string
  headline: string
  month: string
  refreshTitle: string
  searchIntent: string
  seriesId?: string
}

export const publishingRhythm = {
  summary:
    'One flagship post each month, plus one refresh to an older evergreen article so the archive keeps compounding instead of aging in place.',
  updatedOn: 'April 8, 2026'
}

export const editorialCalendar: EditorialCalendarEntry[] = [
  {
    format: 'Case study',
    headline: 'OpenAPI-first frontends for headless commerce teams',
    month: 'April 2026',
    refreshTitle: 'Continuous Integration and Deployment for Next.js Projects',
    searchIntent: 'headless commerce frontend architecture',
    seriesId: 'building-a-production-nextjs-app'
  },
  {
    format: 'Guide',
    headline: 'Playwright accessibility checks that teams keep running',
    month: 'May 2026',
    refreshTitle: 'Testing React Components with Vitest and React Testing Library',
    searchIntent: 'playwright accessibility testing workflow',
    seriesId: 'building-a-production-nextjs-app'
  },
  {
    format: 'Opinion',
    headline: 'Why developer experience work should be measured like product work',
    month: 'June 2026',
    refreshTitle: 'Development Workflow with Husky for Next.js, ESLint, and Vitest Integration',
    searchIntent: 'developer experience metrics for engineering teams'
  },
  {
    format: 'Deep Dive',
    headline: 'Designing ESLint packages teams actually adopt',
    month: 'July 2026',
    refreshTitle: 'Migrate ESLint 8 or Less to ESLint 9',
    searchIntent: 'eslint package architecture for teams',
    seriesId: 'eslint-in-practice'
  },
  {
    format: 'Guide',
    headline: 'Astro and Alpine patterns for fast content-heavy sites',
    month: 'August 2026',
    refreshTitle: 'Storybook in Action with Next.js, Tailwind and TypeScript',
    searchIntent: 'astro alpine performance patterns'
  },
  {
    format: 'Case study',
    headline: 'What changed when I started writing architecture notes every month',
    month: 'September 2026',
    refreshTitle: 'Atomic Module Component Structure for React',
    searchIntent: 'architecture notes for developer seo'
  }
]
