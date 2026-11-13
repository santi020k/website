---
title: "Cómo publicar un llms.txt generado a partir de tu contenido"
description: "Cómo genero /llms.txt en Astro a partir de las mismas colecciones publicadas que usan los feeds, y las dos comprobaciones que evitan que quede desactualizado."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

Este repositorio tuvo durante un tiempo un archivo llamado `llms.txt`. Describía el código, y nunca se desplegó. La dirección pública devolvía un 404.

La versión que lo reemplazó se genera durante la compilación a partir del contenido del sitio. Vive en [`/llms.txt`](/llms.txt), y nadie tiene que acordarse de actualizarla.

## Qué es llms.txt

La [propuesta llms.txt](https://llmstxt.org/) describe un archivo Markdown en la raíz de un sitio. Ofrece un resumen breve y una lista curada de enlaces, cada uno con una descripción de una línea, para que un asistente de IA encuentre las páginas importantes sin rastrear el marcado de navegación y de composición.

El formato es pequeño:

```markdown
# Site name

> One-sentence summary.

A short paragraph of context.

## Section

- [Page title](https://example.com/page/): What the page covers.
```

Es una propuesta. No puedo decirte qué herramientas lo leen hoy, y no tengo mediciones propias que ofrecer. Publico uno porque es barato cuando se genera, y porque un índice sencillo de un sitio también les sirve a las personas.

## Genéralo a partir del contenido que ya tienes

Un sitio estático con colecciones de contenido ya conoce todo lo que este archivo necesita: títulos, URL y descripciones.

En Astro, lo produce un archivo de endpoint. Esta es una versión abreviada del mío:

```ts
// src/pages/llms.txt.ts
export const GET = async ({ site }: APIContext) => {
  const [posts, projects, seriesSummaries] = await Promise.all([
    getCachedPosts(),
    getCachedProjects(),
    getSeriesSummaries()
  ])

  const body = [
    `# ${siteConfig.author}`,
    `> ${siteConfig.description}`,
    formatLlmsSection('Pages', pages.map(toLink)),
    formatLlmsSection('Case studies', caseStudies.map(toLink)),
    formatLlmsSection('Articles', posts.map(toLink))
  ].filter(Boolean).join('\n\n')

  return new Response(`${body}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
```

La decisión importante es la fuente de datos. El endpoint llama a las mismas funciones que los feeds RSS y JSON. Esas funciones ya excluyen los borradores y los artículos programados, así que el archivo no puede filtrar un título sin publicar, y un artículo nuevo aparece en él en la siguiente compilación.

## Ordena las secciones para alguien con atención limitada

El archivo sigue el orden que usaría para presentarle el sitio a una persona:

1. **Páginas.** Los destinos principales en el orden de la navegación, cada uno con una descripción escrita para este archivo.
2. **Casos de estudio.** Trabajo profesional, del más reciente al más antiguo.
3. **Proyectos.** Herramientas y aplicaciones personales, ordenadas por relevancia.
4. **Series.** Solo las series que tienen artículos publicados.
5. **Artículos.** Cada artículo publicado con su descripción.
6. **Opcional.** Enlaces secundarios como la declaración de accesibilidad y el sitemap.

La propuesta le da a «Optional» un significado específico: enlaces que se pueden omitir cuando el espacio es escaso. Lo uso exactamente para eso.

Las descripciones de las páginas principales están escritas a mano. Todo lo demás reutiliza la descripción que cada entrada ya tiene para la búsqueda y las tarjetas sociales. Si esas descripciones son vagas, el archivo será vago, y también lo serán tus fragmentos en los buscadores.

## Escapa el Markdown que generas

Los títulos son contenido de usuario, y la sintaxis de enlaces de Markdown es frágil.

Un título con un corchete termina el texto del enlace antes de tiempo. Una URL con un paréntesis termina el destino antes de tiempo. El formateador escapa los corchetes y las barras invertidas en los títulos, codifica con porcentaje los paréntesis y los espacios en las URL, y colapsa los espacios en blanco de las descripciones para que cada entrada quede en una sola línea.

```ts
export const formatLlmsLink = (title: string, url: string, description?: string): string => {
  const summary = description ? collapseWhitespace(description) : ''

  return `- [${escapeLinkText(title)}](${escapeLinkDestination(url)})${summary ? `: ${summary}` : ''}`
}
```

Una sección sin entradas se omite, así que el archivo nunca tiene un encabezado vacío.

## Dos comprobaciones lo mantienen honesto

Un archivo generado también puede estar mal. Dos comprobaciones lo protegen:

- La auditoría de SEO falla cuando falta el `llms.txt` compilado.
- Una prueba de navegador solicita cada URL que aparece en el archivo y espera que todas respondan 200.

La segunda comprobación hace más que proteger el archivo. Un enlace en un índice es una promesa de que la página existe, y solicitarlos todos es una verificación barata de enlaces para las páginas que más me importan.

## Lo que dejé fuera

**Copias en Markdown de cada página.** Algunos sitios publican un gemelo `.md` por cada ruta. Decidí no hacerlo: duplica la cantidad de URL y crea una segunda versión de cada artículo que hay que mantener correcta. Las páginas HTML son estáticas y se pueden leer tal como están.

**Versiones archivadas.** Los diseños anteriores de este sitio se conservan y no se indexan. Quedan fuera de este archivo por la misma razón por la que quedan fuera del sitemap.

**Una descripción del código.** Eso pertenece a las instrucciones del repositorio para agentes de programación, que son otra audiencia. Un `llms.txt` público trata sobre el contenido del sitio.

## Una lista de verificación breve

Si quieres agregar uno:

1. Genéralo con las mismas consultas que tu feed.
2. Escribe descripciones reales para tus cinco a diez páginas principales.
3. Escapa los títulos y las URL.
4. Haz que una comprobación falle cuando el archivo falte.
5. Prueba que todos los enlaces respondan.

El código es pequeño. Lo que requiere pensar es decidir de qué trata el sitio, en una oración, al inicio del archivo.
