import { describe, expect, test } from 'vitest'

import {
  collaborationLanes,
  selectedOrganizations,
  speakingFormats,
  speakingHighlights,
  speakingTopics,
  testimonials,
  usesHighlights,
  usesSections
} from '../profile'

describe('testimonials', () => {
  test('is a non-empty array', () => {
    expect(testimonials.length).toBeGreaterThan(0)
  })

  test('every testimonial has required fields', () => {
    for (const t of testimonials) {
      expect(t.name).toBeTruthy()
      expect(t.quote).toBeTruthy()
      expect(t.role).toBeTruthy()
      expect(t.relationship).toBeTruthy()
      expect(t.avatarInitials).toBeTruthy()
    }
  })
})

describe('selectedOrganizations', () => {
  test('is a non-empty array', () => {
    expect(selectedOrganizations.length).toBeGreaterThan(0)
  })

  test('every entry has a label, context, and project link', () => {
    for (const org of selectedOrganizations) {
      expect(org.label).toBeTruthy()
      expect(org.context).toBeTruthy()
      expect(org.projectId).toBeTruthy()
    }
  })

  test('includes every public professional engagement and the featured community', () => {
    const projectIds = selectedOrganizations.map(organization => organization.projectId)

    expect(new Set(projectIds).size).toBe(projectIds.length)
    expect(projectIds).toEqual([
      'void',
      'optic-power',
      'datagran',
      'xgames',
      'smith-commerce',
      'pads',
      'justbit',
      'nebular',
      'react-js-colombia'
    ])
  })
})

describe('collaborationLanes', () => {
  test('is a non-empty array', () => {
    expect(collaborationLanes.length).toBeGreaterThan(0)
  })

  test('every lane has title, description, and fit', () => {
    for (const lane of collaborationLanes) {
      expect(lane.title).toBeTruthy()
      expect(lane.description).toBeTruthy()
      expect(lane.fit).toBeTruthy()
    }
  })
})

describe('speakingHighlights', () => {
  test('is a non-empty array', () => {
    expect(speakingHighlights.length).toBeGreaterThan(0)
  })

  test('every highlight has label, value, and description', () => {
    for (const h of speakingHighlights) {
      expect(h.label).toBeTruthy()
      expect(h.value).toBeTruthy()
      expect(h.description).toBeTruthy()
    }
  })
})

describe('speakingTopics', () => {
  test('is a non-empty array', () => {
    expect(speakingTopics.length).toBeGreaterThan(0)
  })

  test('every topic has title and description', () => {
    for (const topic of speakingTopics) {
      expect(topic.title).toBeTruthy()
      expect(topic.description).toBeTruthy()
    }
  })
})

describe('speakingFormats', () => {
  test('is a non-empty array', () => {
    expect(speakingFormats.length).toBeGreaterThan(0)
  })

  test('every format has title and description', () => {
    for (const fmt of speakingFormats) {
      expect(fmt.title).toBeTruthy()
      expect(fmt.description).toBeTruthy()
    }
  })
})

describe('usesHighlights', () => {
  test('is a non-empty array', () => {
    expect(usesHighlights.length).toBeGreaterThan(0)
  })

  test('every item has label and value', () => {
    for (const item of usesHighlights) {
      expect(item.label).toBeTruthy()
      expect(item.value).toBeTruthy()
    }
  })
})

describe('usesSections', () => {
  test('is a non-empty array', () => {
    expect(usesSections.length).toBeGreaterThan(0)
  })

  test('every section has title, description, and items', () => {
    for (const section of usesSections) {
      expect(section.title).toBeTruthy()
      expect(section.description).toBeTruthy()
      expect(Array.isArray(section.items)).toBe(true)
      expect(section.items.length).toBeGreaterThan(0)
    }
  })

  test('every section item has label and value', () => {
    for (const section of usesSections) {
      for (const item of section.items) {
        expect(item.label).toBeTruthy()
        expect(item.value).toBeTruthy()
      }
    }
  })
})
