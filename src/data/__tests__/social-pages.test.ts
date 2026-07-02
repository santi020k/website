import { describe, expect, test } from 'vitest'

import {
  getTechnologySocialPage,
  homeSocialPage,
  staticSocialPages
} from '../social-pages'

describe('homeSocialPage', () => {
  test('has pathname set to root', () => {
    expect(homeSocialPage.pathname).toBe('/')
  })

  test('has all required fields', () => {
    expect(homeSocialPage.title).toBeTruthy()
    expect(homeSocialPage.description).toBeTruthy()
    expect(homeSocialPage.type).toBeTruthy()
  })
})

describe('staticSocialPages', () => {
  test('includes entries for the main site sections', () => {
    const pathnames = staticSocialPages.map(p => p.pathname)
    expect(pathnames).toContain('/about/')
    expect(pathnames).toContain('/blog/')
    expect(pathnames).toContain('/portfolio/')
    expect(pathnames).toContain('/speaking/')
  })

  test('every page has a title, description, and type', () => {
    for (const page of staticSocialPages) {
      expect(page.title, `${page.pathname} is missing a title`).toBeTruthy()
      expect(page.description, `${page.pathname} is missing a description`).toBeTruthy()
      expect(page.type, `${page.pathname} is missing a type`).toBeTruthy()
    }
  })

  test('all pathnames use trailing slashes', () => {
    for (const page of staticSocialPages) {
      expect(page.pathname, `${page.pathname} must end with /`).toMatch(/\/$/)
    }
  })
})

describe('getTechnologySocialPage', () => {
  test('includes the technology name in the title', () => {
    const page = getTechnologySocialPage('React.js')
    expect(page.title).toContain('React.js')
  })

  test('includes the technology name in the description', () => {
    const page = getTechnologySocialPage('TypeScript')
    expect(page.description).toContain('TypeScript')
  })

  test('generates a pathname with the technology name URL-encoded', () => {
    const page = getTechnologySocialPage('C++')
    expect(page.pathname).toBe('/technologies/C%2B%2B/')
  })

  test('sets type to Technology', () => {
    const page = getTechnologySocialPage('Node.js')
    expect(page.type).toBe('Technology')
  })

  test('produces unique pathnames for different technologies', () => {
    const react = getTechnologySocialPage('React.js')
    const vue = getTechnologySocialPage('Vue.js')
    expect(react.pathname).not.toBe(vue.pathname)
  })
})
