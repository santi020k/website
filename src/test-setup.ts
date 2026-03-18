import { vi } from 'vitest'

import '@testing-library/jest-dom'

// Mock Astro virtual modules
vi.mock('astro:env/server', () => ({
  WEBMENTION_API_KEY: 'mock-api-key'
}))
