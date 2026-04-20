import { describe, expect, it } from 'vitest'

import {
  collaborationLanes,
  selectedOrganizations,
  selectedSessions,
  speakingFormats,
  speakingHighlights,
  speakingTopics,
  testimonials,
  usesHighlights,
  usesSections
} from '../profile'

describe('testimonials', () => {
  it('is a non-empty array', () => {
    expect(testimonials.length).toBeGreaterThan(0)
  })

  it('every testimonial has required fields', () => {
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
  it('is a non-empty array', () => {
    expect(selectedOrganizations.length).toBeGreaterThan(0)
  })

  it('every entry has a label and context', () => {
    for (const org of selectedOrganizations) {
      expect(org.label).toBeTruthy()
      expect(org.context).toBeTruthy()
    }
  })
})

describe('selectedSessions', () => {
  it('is a non-empty array', () => {
    expect(selectedSessions.length).toBeGreaterThan(0)
  })

  it('every session has required fields', () => {
    for (const session of selectedSessions) {
      expect(session.title).toBeTruthy()
      expect(session.event).toBeTruthy()
      expect(session.description).toBeTruthy()
      expect(session.year).toBeTruthy()
      expect(Array.isArray(session.tags)).toBe(true)
    }
  })

  it('every session has a links object', () => {
    for (const session of selectedSessions) {
      expect(session.links).toBeDefined()
      expect(typeof session.links).toBe('object')
    }
  })
})

describe('collaborationLanes', () => {
  it('is a non-empty array', () => {
    expect(collaborationLanes.length).toBeGreaterThan(0)
  })

  it('every lane has title, description, and fit', () => {
    for (const lane of collaborationLanes) {
      expect(lane.title).toBeTruthy()
      expect(lane.description).toBeTruthy()
      expect(lane.fit).toBeTruthy()
    }
  })
})

describe('speakingHighlights', () => {
  it('is a non-empty array', () => {
    expect(speakingHighlights.length).toBeGreaterThan(0)
  })

  it('every highlight has label, value, and description', () => {
    for (const h of speakingHighlights) {
      expect(h.label).toBeTruthy()
      expect(h.value).toBeTruthy()
      expect(h.description).toBeTruthy()
    }
  })
})

describe('speakingTopics', () => {
  it('is a non-empty array', () => {
    expect(speakingTopics.length).toBeGreaterThan(0)
  })

  it('every topic has title and description', () => {
    for (const topic of speakingTopics) {
      expect(topic.title).toBeTruthy()
      expect(topic.description).toBeTruthy()
    }
  })
})

describe('speakingFormats', () => {
  it('is a non-empty array', () => {
    expect(speakingFormats.length).toBeGreaterThan(0)
  })

  it('every format has title and description', () => {
    for (const fmt of speakingFormats) {
      expect(fmt.title).toBeTruthy()
      expect(fmt.description).toBeTruthy()
    }
  })
})

describe('usesHighlights', () => {
  it('is a non-empty array', () => {
    expect(usesHighlights.length).toBeGreaterThan(0)
  })

  it('every item has label and value', () => {
    for (const item of usesHighlights) {
      expect(item.label).toBeTruthy()
      expect(item.value).toBeTruthy()
    }
  })
})

describe('usesSections', () => {
  it('is a non-empty array', () => {
    expect(usesSections.length).toBeGreaterThan(0)
  })

  it('every section has title, description, and items', () => {
    for (const section of usesSections) {
      expect(section.title).toBeTruthy()
      expect(section.description).toBeTruthy()
      expect(Array.isArray(section.items)).toBe(true)
      expect(section.items.length).toBeGreaterThan(0)
    }
  })

  it('every section item has label and value', () => {
    for (const section of usesSections) {
      for (const item of section.items) {
        expect(item.label).toBeTruthy()
        expect(item.value).toBeTruthy()
      }
    }
  })
})
