/** A compact running label; the full title remains in the hero and source permalink. */
export const getArticlePrintLabel = (title: string): string => {
  const clean = title.replace(/\s+/gu, ' ').trim() || 'Article'
  const characters = Array.from(clean)
  const prefix = characters.slice(0, 96).join('')

  const shortened = characters.length > 96 ?
    `${(characters[96] === ' ' ? prefix : prefix.replace(/\s+\S*$/u, '')).trimEnd()}…` :
    clean

  return `santi020k · ${shortened}`
}

/** Escape both CSS strings and HTML style end tags before server rendering an inline rule. */
export const getArticlePageImprint = (title: string): string => {
  const label = Array.from(getArticlePrintLabel(title), character => {
    const code = character.charCodeAt(0)

    return code < 32 || code === 127 || '"\\<>'.includes(character) ? `\\${code.toString(16)} ` : character
  }).join('')

  return `@media print { @page article { @bottom-left { content: "${label}"; } } }`
}
