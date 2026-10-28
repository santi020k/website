import { describe, expect, test } from 'vitest'

import { topicNoteMessages } from '../catalogs/topic-notes'
import { getBlogTopicNote } from '../topic-copy'

describe('Topic notes', () => {
  test('keeps English primary and resolves Spanish from the same archive identifier', () => {
    expect(getBlogTopicNote('wine')).toBe('Running Windows games on Apple silicon with Wine, Silo, and DXMT.')
    expect(getBlogTopicNote('wine', 'en')).toBe(getBlogTopicNote('wine'))
    expect(getBlogTopicNote('wine', 'es')).toBe('Cómo ejecutar juegos de Windows en Apple silicon con Wine, Silo y DXMT.')
  })

  test.each(['future-topic', '', 'constructor', '__proto__', 'toString'])('leaves %s to the page fallback', tag => {
    expect(getBlogTopicNote(tag)).toBeUndefined()
    expect(getBlogTopicNote(tag, 'es')).toBeUndefined()
  })

  test.each(Object.entries(topicNoteMessages))('%s has complete localized prose for its canonical tag', (tag, note) => {
    expect(tag).toMatch(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u)
    expect(note.en.trim()).not.toBe('')
    expect(note.es.trim()).not.toBe('')
    expect(note.es).not.toBe(note.en)
    expect(note.en).not.toMatch(/[{}<>]/u)
    expect(note.es).not.toMatch(/[{}<>]/u)
    expect(getBlogTopicNote(tag)).toBe(note.en)
    expect(getBlogTopicNote(tag, 'es')).toBe(note.es)
  })
})
