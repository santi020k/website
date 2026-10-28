import { describe, expect, test } from 'vitest'

import { localizeCollectionSource } from '../collection-copy'

describe('Spanish collection UI', () => {
  test('translates archive reading captions and actual page ranges', () => {
    expect(localizeCollectionSource('es', 'Latest writing')).toBe('Artículos recientes')
    expect(localizeCollectionSource('es', 'Earlier writing')).toBe('Artículos anteriores')
    expect(localizeCollectionSource('es', 'Posts 1–12 of 16')).toBe('Artículos 1–12 de 16')
    expect(localizeCollectionSource('es', 'Posts 13–16 of 16')).toBe('Artículos 13–16 de 16')
    expect(localizeCollectionSource('es', 'post')).toBe('artículo')
  })

  test('translates topic evidence captions while retaining authored topic names', () => {
    expect(localizeCollectionSource('es', 'Topics to explore')).toBe('Temas para explorar')
    expect(localizeCollectionSource('es', 'Posts in the archive')).toBe('Artículos en el archivo')
    expect(localizeCollectionSource('es', 'Most written about')).toBe('El tema más explorado')
    expect(localizeCollectionSource('es', 'Return to topic search')).toBe('Volver a buscar temas')
    expect(localizeCollectionSource('es', 'Browse all writing')).toBe('Ver todos los artículos')
    expect(localizeCollectionSource('es', 'CI/CD is the most explored topic.')).toBe('CI/CD es el tema más explorado.')
  })

  test('translates controls without changing authored entry names', () => {
    expect(localizeCollectionSource('es', 'Next page')).toBe('Página siguiente')
    expect(localizeCollectionSource('es', 'Read the case study: Lumen UI')).toBe('Leer el caso de estudio: Lumen UI')
    expect(localizeCollectionSource('es', 'Posts about TypeScript')).toBe('Artículos sobre TypeScript')
    expect(localizeCollectionSource('es', 'My authored English article title')).toBe('My authored English article title')
  })

  test('translates page metadata and numbered labels', () => {
    expect(localizeCollectionSource('es', 'Page 2 of 8')).toBe('Página 2 de 8')
    expect(localizeCollectionSource('es', 'Blog · Page 2 of 8 — Santiago Molina')).toBe('Blog · Página 2 de 8 — Santiago Molina')
    expect(localizeCollectionSource('es', 'Older writing from page 2 of 8, ordered newest first.')).toBe('Artículos anteriores de la página 2 de 8, de los más recientes a los más antiguos.')
    expect(localizeCollectionSource('es', '12 min read')).toBe('12 min de lectura')
    expect(localizeCollectionSource('es', 'Part 03')).toBe('Parte 03')
  })

  test('localizes destination actions while retaining product names', () => {
    expect(localizeCollectionSource('es', 'Visit Lumen UI')).toBe('Visitar Lumen UI')
    expect(localizeCollectionSource('es', 'View santi020k archive')).toBe('Ver el archivo de santi020k')
    expect(localizeCollectionSource('es', 'Explore the source')).toBe('Explora el código fuente')
    expect(localizeCollectionSource('es', 'More technologies')).toBe('Más tecnologías')
    expect(localizeCollectionSource('es', 'Case Study')).toBe('Caso de estudio')
  })

  test('keeps names intact in technology descriptions', () => {
    expect(localizeCollectionSource('es', 'Explore where Node.js shaped the work.')).toBe('Explora dónde Node.js dio forma al trabajo.')
    expect(localizeCollectionSource('es', 'Node.js · Technology')).toBe('Node.js · Tecnología')
    expect(localizeCollectionSource('es', 'Articles, guides, and personal notes about CI/CD.')).toBe('Artículos, guías y notas personales sobre CI/CD.')
  })
})
