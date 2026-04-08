import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    {
      name: 'vitest-astro-env-mock',
      resolveId(id) {
        if (id === 'astro:env/server') {
          return '\0astro:env/server'
        }
        return null
      },
      load(id) {
        if (id === '\0astro:env/server') {
          return 'export const WEBMENTION_API_KEY = "mock-key";'
        }
        return null
      }
    }
  ],
  define: {
    'import.meta.env.SITE': JSON.stringify('https://santi020k.me')
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['**/node_modules/**', '**/tests/**', '**/dist/**'],
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/utils/**', 'src/plugins/**', 'src/data/**', 'src/site.config.ts'],
      exclude: [
        'src/utils/__tests__/**',
        'src/plugins/__tests__/**',
        'src/data/__tests__/**',
        'src/types.ts',
        'src/env.d.ts'
      ]
    }
  }
})
