/**
 * Counts tag occurrences across a list of posts and returns all tags
 * sorted by frequency (descending). Posts must expose a `data.tags` string array.
 */
export const getAllTags = (
  posts: { data: { tags: string[] } }[]
): [string, number][] => [...posts
  .flatMap(post => post.data.tags)
  .reduce((acc, tag) => acc.set(tag, (acc.get(tag) ?? 0) + 1), new Map<string, number>())]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

/** Keep personal interests discoverable alongside the most frequent software topics. */
export const getBlogBrowseTags = (tags: [string, number][]): [string, number][] => {
  const interests = ['reading', 'gaming']
  const featured = tags.filter(([tag]) => interests.includes(tag))
  const remaining = tags.filter(([tag]) => !interests.includes(tag))

  return [...featured, ...remaining].slice(0, 8)
}

const blogTopicNames = new Map([
  ['ai', 'AI'],
  ['ci-cd', 'CI/CD'],
  ['cloudflare-workers', 'Cloudflare Workers'],
  ['dxmt', 'DXMT'],
  ['e2e', 'E2E'],
  ['eslint', 'ESLint'],
  ['eslint-config', 'ESLint config'],
  ['github-actions', 'GitHub Actions'],
  ['ios', 'iOS'],
  ['javascript', 'JavaScript'],
  ['macos', 'macOS'],
  ['mongo', 'MongoDB'],
  ['nextjs', 'Next.js'],
  ['nodejs', 'Node.js'],
  ['on-device-ai', 'On-device AI'],
  ['open-graph', 'Open Graph'],
  ['pre-commit', 'Pre-commit'],
  ['qa', 'QA'],
  ['react-native', 'React Native'],
  ['roadscore', 'RoadScore'],
  ['swiftui', 'SwiftUI'],
  ['tailwind', 'Tailwind CSS'],
  ['testing-library', 'Testing Library'],
  ['typescript', 'TypeScript'],
  ['ui-engineering', 'UI engineering'],
  ['vscode', 'VS Code'],
  ['web-components', 'Web Components'],
  ['websockets', 'WebSockets']
])

/** Presentation labels only: the original tag remains the archive identifier. */
export const getBlogTopicLabel = (tag: string): string => blogTopicNames.get(tag) ??
  tag.replaceAll('-', ' ').replace(/^\p{L}/u, letter => letter.toUpperCase())
