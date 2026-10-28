import type { Locale } from '@/i18n'

/** Compose only the supplied draft; this helper never stores or sends its values. */
export const createIntakeIntroduction = (locale: Locale, name: string, company: string): string => {
  if (locale === 'es') {
    if (name) return `Hola Santiago, soy ${name}${company ? ` de ${company}` : ''}.`

    return `Hola Santiago${company ? `, te escribo desde ${company}` : ''}.`
  }

  if (name) return `Hi Santiago, I’m ${name}${company ? ` from ${company}` : ''}.`

  return `Hi Santiago${company ? `, I’m reaching out from ${company}` : ''}.`
}

export const getIntakeStatus = (locale: Locale): string => locale === 'es' ?
  'Tu mensaje está listo. Revísalo en WhatsApp y pulsa enviar.' :
  'Your message is ready. Review it in WhatsApp, then press send.'

export const getDirectContactMessage = (locale: Locale): string => locale === 'es' ?
  'Hola Santiago, vi tu sitio web y me gustaría hablar sobre' :
  'Hi Santiago, I found your website and I’d like to talk about'
