const technologyInterestWeights = new Map<string, number>([
  ['react.js', 140],
  ['react', 140],
  ['next.js', 138],
  ['astro', 136],
  ['typescript', 134],
  ['react native', 132],
  ['expo', 130],
  ['node.js', 128],
  ['node', 128],
  ['graphql', 126],
  ['nest.js', 124],
  ['apollo client', 122],
  ['tanstack query', 120],
  ['openapi', 118],
  ['storybook', 116],
  ['tailwind css', 114],
  ['tailwindcss', 114],
  ['radix ui', 112],
  ['mantine ui', 110],
  ['zustand', 108],
  ['redux toolkit', 106],
  ['redux sagas', 104],
  ['redux', 102],
  ['docker', 100],
  ['aws', 98],
  ['gcp', 96],
  ['postgresql', 94],
  ['mongodb', 92],
  ['mysql', 90],
  ['elixir', 88],
  ['phoenix', 86],
  ['ruby on rails', 84],
  ['wordpress', 82],
  ['woocommerce', 80],
  ['builder.io', 78],
  ['playwright', 76],
  ['vitest', 74],
  ['jest', 72],
  ['cypress', 70],
  ['eslint', 68],
  ['prettier', 66],
  ['husky', 64],
  ['github actions', 62],
  ['ci/cd', 60],
  ['turborepo', 58],
  ['nx', 58],
  ['monorepo', 56],
  ['npm', 54],
  ['figma', 52],
  ['sentry', 50],
  ['performance optimization', 24],
  ['web vitals', 22],
  ['lighthouse', 22],
  ['software architecture', 20],
  ['system design', 20],
  ['headless commerce', 18],
  ['devops automation', 18],
  ['3rd party apis', 18],
  ['testing', 16],
  ['code quality', 14],
  ['developer experience (dx)', 12],
  ['accessibility', 10],
  ['seo', 8],
  ['team leadership', 6],
  ['scrum', 4],
  ['community building', 4],
  ['public speaking', 3],
  ['workshops', 3],
  ['mentorship', 3],
  ['event organization', 3],
  ['developer documentation', 2]
])

const technologyInterestPatterns = [
  {
    pattern: new RegExp([
      'react',
      'next\\.js',
      'astro',
      'typescript',
      'node(?:\\.js)?',
      'graphql',
      'nest\\.js',
      'expo',
      'elixir',
      'phoenix',
      'ruby',
      'java',
      'angular',
      'wordpress',
      'woocommerce',
      'postgresql',
      'mongodb',
      'mysql',
      'docker',
      'aws',
      'gcp',
      'openapi',
      'apollo',
      'tanstack',
      'tailwind',
      'storybook',
      'zustand',
      'redux',
      'radix',
      'mantine',
      'unity',
      'c#',
      'builder\\.io',
      'react native'
    ].join('|')),
    score: 48
  },
  {
    pattern: new RegExp([
      'playwright',
      'vitest',
      'jest',
      'cypress',
      'eslint',
      'prettier',
      'husky',
      'github actions',
      'sentry',
      'figma',
      'i18next',
      'yup',
      'formik',
      'zod',
      'react hook form',
      'oauth',
      'mapbox',
      'google maps api',
      'lighthouse',
      'web vitals',
      'vercel',
      'cordova',
      'linux',
      'android',
      'ios',
      'pwa',
      'microservices',
      'micro frontend',
      'socket\\.io'
    ].join('|')),
    score: 28
  },
  {
    pattern: new RegExp([
      'testing',
      'quality',
      'developer experience',
      'performance',
      'accessibility',
      'seo',
      'leadership',
      'scrum',
      'community',
      'speaking',
      'workshops',
      'mentorship',
      'organization',
      'documentation',
      'architecture',
      'design'
    ].join('|')),
    score: 10
  }
] as const

const normalizeTechnology = (technology: string) => technology.trim().toLowerCase().replace(/\s+/g, ' ')

export const getTechnologyInterestScore = (technology: string): number => {
  const normalizedTechnology = normalizeTechnology(technology)
  const explicitWeight = technologyInterestWeights.get(normalizedTechnology)

  if (typeof explicitWeight === 'number') {
    return explicitWeight
  }

  const matchedPattern = technologyInterestPatterns.find(({ pattern }) => pattern.test(normalizedTechnology))

  if (matchedPattern) {
    return matchedPattern.score
  }

  return 18
}

export const sortTechnologiesByInterest = (technologies: string[]): string[] => [...technologies].sort((leftTechnology, rightTechnology) => {
  const scoreDifference =
    getTechnologyInterestScore(rightTechnology) - getTechnologyInterestScore(leftTechnology)

  if (scoreDifference !== 0) {
    return scoreDifference
  }

  return leftTechnology.localeCompare(rightTechnology, undefined, { sensitivity: 'base' })
})

export const sortTechnologyCountsByInterest = (
  technologies: [string, number][]
): [string, number][] => [...technologies].sort((leftTechnology, rightTechnology) => {
  const scoreDifference =
    getTechnologyInterestScore(rightTechnology[0]) - getTechnologyInterestScore(leftTechnology[0])

  if (scoreDifference !== 0) {
    return scoreDifference
  }

  const usageDifference = rightTechnology[1] - leftTechnology[1]

  if (usageDifference !== 0) {
    return usageDifference
  }

  return leftTechnology[0].localeCompare(rightTechnology[0], undefined, { sensitivity: 'base' })
})
