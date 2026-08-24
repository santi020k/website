import { defineAuditConfig } from '@santi020k/og/audit/config'
import { standardAuditRules } from '@santi020k/og/audit/rules'

export default defineAuditConfig({
  directory: 'dist',
  manifest: 'public/og/manifest.json',
  maxImageBytes: 512_000,
  requireUniqueTitles: true,
  siteUrl: 'https://santi020k.com',
  ...standardAuditRules({
    alternates: false,
    sitemap: {
      excludeRoutes: [
        '/blog/atomic-module-component-structure-for-react/',
        '/blog/boosting-code-quality-and-efficiency-with-my-eslint-configuration-library/',
        '/blog/building-the-best-next-js-typescript-standard-vitest-eslint-configuration/',
        '/blog/configuring-mongodb-with-homebrew-on-macos-converting-a-standalone-instance-to-a-replica-set/',
        '/blog/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration/',
        '/blog/storybook-in-action-with-next-js-tailwind-and-typescript/'
      ],
      reportOrphans: true
    }
  })
})
