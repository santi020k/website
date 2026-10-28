import { describe, expect, test } from 'vitest'

import { translateCollection } from '../collection-copy'

describe('Spanish collection UI', () => {
  test('translates controls without changing authored entry names', () => {
    expect(translateCollection('Next page')).toBe('Página siguiente')
    expect(translateCollection('Read the case study: Lumen UI')).toBe('Leer el caso de estudio: Lumen UI')
    expect(translateCollection('Posts about TypeScript')).toBe('Artículos sobre TypeScript')
    expect(translateCollection('My authored English article title')).toBe('My authored English article title')
  })

  test('translates page metadata and numbered labels', () => {
    expect(translateCollection('Page 2 of 8')).toBe('Página 2 de 8')
    expect(translateCollection('Blog · Page 2 of 8 — Santiago Molina')).toBe('Blog · Página 2 de 8 — Santiago Molina')
    expect(translateCollection('Older writing from page 2 of 8, ordered newest first.')).toBe('Artículos anteriores de la página 2 de 8, de los más recientes a los más antiguos.')
    expect(translateCollection('12 min read')).toBe('12 min de lectura')
    expect(translateCollection('Part 03')).toBe('Parte 03')
  })

  test('keeps names intact in technology descriptions', () => {
    expect(translateCollection('Explore where Node.js shaped the work.')).toBe('Explora dónde Node.js dio forma al trabajo.')
    expect(translateCollection('Node.js · Technology')).toBe('Node.js · Tecnología')
    expect(translateCollection('Articles, guides, and personal notes about CI/CD.')).toBe('Artículos, guías y notas personales sobre CI/CD.')
  })
})
