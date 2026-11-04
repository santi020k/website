import type { MessageCatalog } from '../messages.ts'

import { sharedMessages } from './shared.ts'

/** Stable IDs; edit English wording without changing its key. */
export const articleMessages = {
  'article.anonymous': { en: 'Anonymous', es: 'Anónimo' },
  'article.codeCopiedToClipboard': { en: 'Code copied to clipboard', es: 'Código copiado al portapapeles' },
  'article.collapseExample': { en: 'Collapse example', es: 'Contraer ejemplo' },
  'article.copied': { en: 'Copied', es: 'Copiado' },
  'article.section.copied': { en: 'Copied link to section: {heading}', es: 'Enlace copiado a la sección: {heading}' },
  'article.copy': { en: 'Copy', es: 'Copiar' },
  'article.copyCodeToClipboard': { en: 'Copy code to clipboard', es: 'Copiar código al portapapeles' },
  'article.section.copy': { en: 'Copy link to section: {heading}', es: 'Copiar enlace a la sección: {heading}' },
  'article.copySectionLink': { en: 'Copy section link', es: 'Copiar enlace de la sección' },
  'article.couldNotCopyCodeSelectAnd': { en: 'Could not copy code. Select and copy it manually.', es: 'No se pudo copiar el código. Selecciónalo y cópialo manualmente.' },
  'article.couldNotCopyTheSectionLink': { en: 'Could not copy the section link. Open this section from the contents and copy the address.', es: 'No se pudo copiar el enlace de la sección. Ábrela desde el contenido y copia la dirección.' },
  'article.linkedSection': { en: 'Linked section', es: 'Sección enlazada' },
  'article.repliesAndMentions': { en: 'Replies & mentions', es: 'Respuestas y menciones' },
  'article.scrollHorizontallyToCompare': { en: 'Scroll horizontally to compare', es: 'Desplázate horizontalmente para comparar' },
  'article.scrollHorizontallyToReadMore': { en: 'Scroll horizontally to read more', es: 'Desplázate horizontalmente para leer más' },
  'article.selectAndCopyThisSectionS': { en: 'Select and copy this section’s address', es: 'Selecciona y copia la dirección de esta sección' },
  'article.showFullExample': { en: 'Show full example', es: 'Ver el ejemplo completo' },
  'article.skipToText': { en: 'Skip to article text', es: 'Saltar al texto del artículo' },
  'article.section.retry': { en: 'Try again to copy link to section: {heading}', es: 'Vuelve a intentar copiar el enlace a la sección: {heading}' },
  'article.viewOriginal': { en: 'View original', es: 'Ver original' },
  'mentions.heading': sharedMessages['mentions.heading'],
  'shared.copyFailed': sharedMessages['shared.copyFailed'],
  'shared.like': sharedMessages['shared.like'],
  'shared.likes': sharedMessages['shared.likes'],
  'shared.someone': sharedMessages['shared.someone']
} as const satisfies MessageCatalog
