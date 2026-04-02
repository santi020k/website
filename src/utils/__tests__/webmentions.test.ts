import { describe, expect, it } from 'vitest'

import type { WebmentionsChildren } from '../../types'
import { filterWebmentions } from '../webmentions'

describe('filterWebmentions', () => {
  it('should filter out unsupported types', () => {
    const input = [
      { 'wm-property': 'like-of' },
      { 'wm-property': 'unsupported-type' }
    ] as WebmentionsChildren[]

    const result = filterWebmentions(input)
    expect(result).toHaveLength(1)
    expect(result[0]?.['wm-property']).toBe('like-of')
  })

  it('should filter out mention-of without content', () => {
    const input = [
      { 'wm-property': 'mention-of', content: { text: '' } },
      { 'wm-property': 'mention-of', content: { text: 'Hello' } }
    ] as WebmentionsChildren[]

    const result = filterWebmentions(input)
    expect(result).toHaveLength(1)
    expect(result[0]?.content?.text).toBe('Hello')
  })

  it('should filter out in-reply-to without content', () => {
    const input = [
      { 'wm-property': 'in-reply-to', content: undefined },
      { 'wm-property': 'in-reply-to', content: { text: 'Replying' } }
    ] as WebmentionsChildren[]

    const result = filterWebmentions(input)
    expect(result).toHaveLength(1)
    expect(result[0]?.content?.text).toBe('Replying')
  })

  it('should keep valid likes even without content', () => {
    const input = [
      { 'wm-property': 'like-of' }
    ] as WebmentionsChildren[]

    const result = filterWebmentions(input)
    expect(result).toHaveLength(1)
  })
})
