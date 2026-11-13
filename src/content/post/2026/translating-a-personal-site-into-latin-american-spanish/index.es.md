---
title: "Cómo traduje un sitio personal al español latinoamericano"
description: "Cómo agregué español a un sitio estático en Astro: archivos de traducción adyacentes, un solo dueño del estado de publicación y un respaldo seguro para las páginas que aún no están traducidas."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

Escribo en inglés y vivo en Medellín. Durante años este sitio solo habló uno de esos idiomas.

Agregar español parecía una tarea de traducción. La mayor parte del trabajo resultó ser decidir qué puede cambiar una traducción.

## Cuál español

El «español» no es una sola cosa. Elegí un español latinoamericano neutro y le hablo de «tú» a quien lee. Eso descarta la jerga regional de Colombia tanto como descarta el «vosotros».

Los nombres de productos, los ejemplos de código y las recomendaciones citadas conservan su redacción original. Un tutorial traducido con nombres de variables traducidos no le sirve a nadie.

## Una traducción vive junto a su original

Cada artículo o caso de estudio vive en su propia carpeta como `index.md`. Su versión en español es un segundo archivo en la misma carpeta:

```text
src/content/post/2026/why-i-moved-to-zed/
  cover.webp
  index.md
  index.es.md
```

El archivo en español es pequeño a propósito. Su frontmatter lleva el título, la descripción y el texto alternativo de la imagen traducidos, y nada más:

<!-- eslint-skip -->
```yaml
---
title: "Cómo detectar y corregir la falta de texto alternativo en Astro"
description: "Detecta imágenes sin texto alternativo en Astro…"
coverImage:
  alt: "Una lente de diagnóstico de vidrio revela una pieza ámbar…"
---
```

No hay fecha, ni marca de borrador, ni etiquetas, ni ruta de imagen. Un esquema estricto las rechaza.

## Un solo dueño del estado de publicación

Esta es la decisión que repetiría en cualquier sitio multilingüe: la entrada original es dueña de todo lo que no es prosa.

La fecha de publicación, la programación, el estado de borrador, las etiquetas, las rutas de los recursos y la identidad del contenido provienen del archivo en inglés. Una traducción no puede publicar un artículo oculto, cambiar una fecha ni mover una entrada a otro tema.

Sin esa regla, dos archivos pueden contradecirse. Uno dice borrador y el otro dice publicado. Uno tiene cinco etiquetas y el otro tiene cuatro. Cada contradicción se convierte en un error que solo aparece en un idioma.

Los comentarios siguen la misma regla. Una conversación pertenece al artículo, así que las dos versiones comparten un mismo hilo.

## Las páginas sin traducir tienen un respaldo seguro

Un sitio rara vez está traducido por completo. El mío no lo está: algunos borradores aún no tienen archivo en español.

Cuando una ruta en español no tiene traducción, muestra el cuerpo en inglés, marca ese contenido como inglés con `lang="en"` y presenta un aviso breve. La página también lleva `noindex, follow`, queda fuera del sitemap y no anuncia alternativas de idioma.

Esa última parte importa para la búsqueda. Una página en una URL en español con contenido en inglés es un duplicado, y antes de esta protección el sitemap las incluía todas.

Cuando existe una traducción, el par se comporta como dos páginas reales. Cada una tiene su propia URL canónica, las dos se enlazan entre sí como alternativas `en` y `es`, y ambas entran al sitemap.

Hay una excepción. Un artículo publicado primero en otro lugar conserva su URL canónica externa. Su traducción al español es original de este sitio, así que recibe una canónica local y puede indexarse, y el par omite las alternativas de idioma porque el original externo no puede enlazar de vuelta.

## Los encabezados conservan sus ID

Los enlaces a secciones deberían sobrevivir a un cambio de idioma. Si estás leyendo una sección y cambias de idioma, deberías llegar a la misma sección.

Por eso los ID de los encabezados son idénticos en ambos idiomas, y solo se traduce el texto visible. El selector de idioma conserva la página, la cadena de consulta y el fragmento. También implica que quien traduce debe preservar la jerarquía original de encabezados, lo cual es una restricción útil por sí misma.

## El texto de la interfaz usa claves tipadas

La prosa vive en Markdown. El texto de la interfaz vive en catálogos: una clave estable, una fuente en inglés y un mensaje en español.

```ts
const t = sharedTranslator(locale)
const aboutLabel = t('nav.about')
```

TypeScript verifica las claves y los campos de interpolación. Un catálogo debe ofrecer ambos idiomas, y las pruebas unitarias rechazan los mensajes vacíos y los marcadores que no coinciden. En tiempo de ejecución, un mensaje en español ausente recurre al inglés, de modo que un error produce una etiqueta en inglés y nunca una vacía.

## Sin redirecciones por idioma del navegador

El inglés se queda en las URL originales. El español vive bajo `/es/`. El sitio nunca redirige según el idioma del navegador ni según una visita anterior.

He estado demasiadas veces del lado equivocado de esa redirección: sigues un enlace que alguien te envió y llegas a un idioma distinto del que esa persona vio. Un selector visible en el encabezado es suficiente.

## Lo que todavía necesita trabajo

Traducir los artículos fue la parte visible. El resto toma más tiempo:

- La búsqueda necesitó un índice separado por idioma, que se vuelve a cargar cuando cambia el idioma.
- Las tarjetas sociales tuvieron que generarse por idioma.
- Los feeds necesitaron una edición en español que solo incluye los artículos traducidos.
- Las notas de viaje se escriben en un solo idioma y no se duplican.

La revisión ortográfica se ejecuta con un diccionario de español junto al de inglés, y detectó más errores míos de los que esperaba.

## Por dónde empezar

Si vas a agregar un segundo idioma a un sitio de contenido, resuelve esto antes de traducir un solo párrafo:

1. Qué variedad del idioma usarás y cómo te diriges a quien lee.
2. Qué archivo es dueño de las fechas, los borradores y la taxonomía.
3. Qué hace una página sin traducir y si los buscadores pueden indexarla.
4. Si los enlaces a secciones sobreviven a un cambio de idioma.

La traducción en sí es la parte que puedes cambiar después. Esas cuatro decisiones son mucho más difíciles de deshacer.
