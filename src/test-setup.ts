import '@testing-library/jest-dom/vitest'

import { vi } from 'vitest'

// Mock Astro virtual modules
vi.mock('astro:env/server', () => ({
  WEBMENTION_API_KEY: 'mock-api-key'
}))
