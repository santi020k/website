export interface NewsletterIssue {
  description: string
  link: string
  pubDate: Date | undefined
  title: string
}

// No feed snapshot was stored at this revision; do not import today's issues.
export const fetchNewsletterIssues = (): Promise<NewsletterIssue[]> => Promise.resolve([])
