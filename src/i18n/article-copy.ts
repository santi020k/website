import type { Locale } from './index'

/** Page controls are translated; authored article content is deliberately untouched. */
const articleCopy: Readonly<Record<string, string>> = {
  'Copy code to clipboard': 'Copiar código al portapapeles',
  'Code copied to clipboard': 'Código copiado al portapapeles',
  'Could not copy code. Select and copy it manually.': 'No se pudo copiar el código. Selecciónalo y cópialo manualmente.',
  Copy: 'Copiar',
  Copied: 'Copiado',
  'Copy failed': 'No se pudo copiar',
  'Select and copy this section’s address': 'Selecciona y copia la dirección de esta sección',
  'Copy section link': 'Copiar enlace de la sección',
  'Could not copy the section link. Open this section from the contents and copy the address.': 'No se pudo copiar el enlace de la sección. Ábrela desde el contenido y copia la dirección.',
  'Show full example': 'Ver el ejemplo completo',
  'Collapse example': 'Contraer ejemplo',
  'Scroll horizontally to read more': 'Desplázate horizontalmente para leer más',
  'Scroll horizontally to compare': 'Desplázate horizontalmente para comparar',
  'Across the IndieWeb': 'En la IndieWeb',
  'Replies & mentions': 'Respuestas y menciones',
  'View original': 'Ver original',
  Someone: 'Alguien',
  Anonymous: 'Anónimo',
  like: 'me gusta',
  likes: 'me gusta'
}

export const translateArticle = (locale: Locale, text: string): string => {
  if (locale === 'en') return text

  return articleCopy[text] ?? text
    .replace(/^Copy link to section: /u, 'Copiar enlace a la sección: ')
    .replace(/^Try again to copy link to section: /u, 'Vuelve a intentar copiar el enlace a la sección: ')
    .replace(/^Copied link to section: /u, 'Enlace copiado a la sección: ')
    .replace(/^(\d+) lines · Copy includes the complete example$/u, '$1 líneas · Se copia el ejemplo completo')
    .replace(/^Code example (\d+): /u, 'Ejemplo de código $1: ')
    .replace(/^Table (\d+)(?=:|$)/u, 'Tabla $1')
    .replace(/^Preview, first (\d+) lines: Code example (\d+): /u, 'Vista previa, primeras $1 líneas: ejemplo de código $2: ')
    .replace(/^Preview, first (\d+) lines: /u, 'Vista previa, primeras $1 líneas: ')
}
