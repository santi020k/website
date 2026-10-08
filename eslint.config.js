import { createWebsiteConfig } from './eslint.shared.js'

export default [
  { ignores: ['apps/**'] },
  ...await createWebsiteConfig(import.meta.dirname)
]
