export const projectPurposeIds = ['developer-tools', 'apps', 'experiments'] as const

export type ProjectPurpose = typeof projectPurposeIds[number]

export const projectPurposes = {
  'developer-tools': {
    title: 'Developer tools',
    description: 'Shared foundations and practical tools for building, checking, and shipping software.'
  },
  apps: {
    title: 'Apps',
    description: 'Products for everyday life, creative work, and the devices we use.'
  },
  experiments: {
    title: 'Experiments',
    description: 'Early projects where I test an idea and refine its direction in public.'
  }
} as const satisfies Record<ProjectPurpose, { title: string, description: string }>
