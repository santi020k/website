/* global module */

const DEFAULT_URLS = [
  '/',
  '/about/',
  '/blog/',
  '/portfolio/',
  '/blog/atomic-module-component-structure-for-react/'
]

const parsedRuns = Number.parseInt(process.env.LHCI_NUMBER_OF_RUNS ?? '1', 10)
const numberOfRuns = Number.isFinite(parsedRuns) && parsedRuns > 0 ? parsedRuns : 1
const auditUrl = process.env.LHCI_AUDIT_URL

module.exports = {
  ci: {
    collect: {
      numberOfRuns,
      staticDistDir: './dist',
      url: auditUrl ? [auditUrl] : DEFAULT_URLS,
      settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      }
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'errors-in-console': ['warn', { minScore: 0.9 }],
        'uses-responsive-images': ['warn', { maxLength: 1 }],
        'network-dependency-tree-insight': 'off',
        'forced-reflow-insight': 'off',
        'link-name': ['error', { minScore: 0.9 }]
      }
    }
  }
}
