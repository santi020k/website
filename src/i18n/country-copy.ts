import type { MessageCatalog } from './messages'
import { createTranslator } from './messages'

const countryMessages = {
  notebook: { en: 'Travel notebook', es: 'Cuaderno de viajes' },
  title: { en: '{country} — Travel notebook', es: '{country} — Cuaderno de viajes' },
  description: { en: 'My travel notebook for {country}: the places I have visited and space for the memories, highlights, and personal impressions behind each journey.', es: 'Mi cuaderno de viajes por {country}: los lugares que he visitado y un espacio para los recuerdos, lo más destacado y las impresiones de cada viaje.' },
  introduction: { en: 'The places I’ve been, and what stays with me.', es: 'Los lugares que he recorrido y lo que se queda conmigo.' },
  allCountries: { en: 'All countries', es: 'Todos los países' },
  places: { en: 'Places in my notebook', es: 'Lugares en mi cuaderno' },
  home: { en: 'Colombia is home. I’ll add the places and memories that belong here as I write.', es: 'Colombia es mi hogar. Iré añadiendo los lugares y recuerdos a medida que escriba.' },
  experience: { en: 'My experience', es: 'Mi experiencia' },
  perspective: { en: 'A personal reflection on my time here, shaped by the places I visited and the trips I took.', es: 'Una reflexión personal sobre mi tiempo aquí, marcada por los lugares que visité y los viajes que hice.' },
  score: { en: 'Overall score', es: 'Puntuación general' },
  notRated: { en: 'Not rated yet', es: 'Sin calificar' },
  scoreValue: { en: '{score} / 10', es: '{score} / 10' },
  return: { en: 'Would I return?', es: '¿Volvería?' },
  'return.yes': { en: 'Absolutely', es: 'Sin duda' },
  'return.maybe': { en: 'Maybe', es: 'Tal vez' },
  'return.no': { en: 'Once was enough', es: 'Una vez fue suficiente' },
  missing: { en: 'Not added yet', es: 'Por añadir' },
  when: { en: 'When I was here', es: 'Cuándo estuve aquí' },
  highlights: { en: 'What stood out', es: 'Lo que más me marcó' },
  notes: { en: 'Notes & memories', es: 'Notas y recuerdos' },
  coming: { en: 'Notes to come', es: 'Notas por escribir' },
  empty: { en: 'This page starts with the places in my notebook. Personal highlights and memories will follow as I write.', es: 'Esta página empieza con los lugares de mi cuaderno. Añadiré lo más destacado y mis recuerdos personales a medida que escriba.' },
  'written.en': { en: 'Personal notes written in English.', es: 'Notas personales escritas en inglés.' },
  'written.es': { en: 'Personal notes written in Spanish.', es: 'Notas personales escritas en español.' }
} as const satisfies MessageCatalog

export const countryTranslator = createTranslator(countryMessages)
