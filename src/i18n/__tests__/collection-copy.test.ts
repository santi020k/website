import { describe, expect, test } from 'vitest'

import { translateCollection } from '../collection-copy'

describe('Spanish collection UI', () => {
  test('translates related topic navigation and destination totals', () => {
    expect(translateCollection('Related topics')).toBe('Temas relacionados')
    expect(translateCollection('All 112 topics')).toBe('Los 112 temas')
    expect(translateCollection('All 1 topic')).toBe('El 1 tema')
  })
  test('translates archive reading captions and actual page ranges', () => {
    expect(translateCollection('Latest writing')).toBe('Artículos recientes')
    expect(translateCollection('Earlier writing')).toBe('Artículos anteriores')
    expect(translateCollection('Posts 1–12 of 16')).toBe('Artículos 1–12 de 16')
    expect(translateCollection('Posts 13–16 of 16')).toBe('Artículos 13–16 de 16')
    expect(translateCollection('post')).toBe('artículo')
  })

  test('translates topic evidence captions while retaining authored topic names', () => {
    expect(translateCollection('Topics to explore')).toBe('Temas para explorar')
    expect(translateCollection('Posts in the archive')).toBe('Artículos en el archivo')
    expect(translateCollection('Most written about')).toBe('El tema más explorado')
    expect(translateCollection('Return to topic search')).toBe('Volver a buscar temas')
    expect(translateCollection('Browse all writing')).toBe('Ver todos los artículos')
    expect(translateCollection('CI/CD is the most explored topic.')).toBe('CI/CD es el tema más explorado.')
  })

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

  test('localizes destination actions while retaining product names', () => {
    expect(translateCollection('Visit Lumen UI')).toBe('Visitar Lumen UI')
    expect(translateCollection('View santi020k archive')).toBe('Ver el archivo de santi020k')
    expect(translateCollection('Explore the source')).toBe('Explora el código fuente')
    expect(translateCollection('More technologies')).toBe('Más tecnologías')
    expect(translateCollection('Case Study')).toBe('Caso de estudio')
  })

  test('keeps names intact in technology descriptions', () => {
    expect(translateCollection('Explore where Node.js shaped the work.')).toBe('Explora dónde Node.js dio forma al trabajo.')
    expect(translateCollection('Node.js · Technology')).toBe('Node.js · Tecnología')
    expect(translateCollection('Articles, guides, and personal notes about CI/CD.')).toBe('Artículos, guías y notas personales sobre CI/CD.')
  })
})
