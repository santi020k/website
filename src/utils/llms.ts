/** Formatting helpers for the `/llms.txt` index (https://llmstxt.org/). */

const collapseWhitespace = (value: string) => value.replace(/\s+/gu, ' ').trim()
/** Link text cannot contain unescaped brackets or backslashes. */
const escapeLinkText = (value: string) => collapseWhitespace(value).replace(/[[\]\\]/gu, '\\$&')

/** Parentheses and spaces would end a Markdown link destination early. */
const escapeLinkDestination = (value: string) => value
  .replaceAll('(', '%28')
  .replaceAll(')', '%29')
  .replaceAll(' ', '%20')

/** Formats one list entry: `- [Title](url): description`. */
export const formatLlmsLink = (title: string, url: string, description?: string): string => {
  const summary = description ? collapseWhitespace(description) : ''

  return `- [${escapeLinkText(title)}](${escapeLinkDestination(url)})${summary ? `: ${summary}` : ''}`
}

/** Formats a level-two section, or nothing when it has no entries. */
export const formatLlmsSection = (heading: string, links: string[]): string => (
  links.length > 0 ? `## ${collapseWhitespace(heading)}\n\n${links.join('\n')}` : ''
)
