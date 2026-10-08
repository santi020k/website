import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig({ root: import.meta.dirname, preset: 'browser', detection: { projects: false }, testingFiles: { playwright: ['tests/**/*.spec.ts'] } })
