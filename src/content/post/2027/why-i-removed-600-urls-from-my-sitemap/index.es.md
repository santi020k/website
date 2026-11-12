---
title: "Por qué quité 600 URL de mi sitemap"
description: "Un sitemap debería incluir páginas que tengan algo propio que decir. Cómo encontré archivos escasos y copias sin traducir, los marqué con noindex y los mantuve disponibles para quienes leen."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

El sitemap de este sitio incluía 886 URL. Después de un cambio incluía 285.

No se eliminó ninguna página. Cada una de esas 600 páginas sigue existiendo y sigue enlazada. Dejaron de pedir que las indexaran, porque ninguna tenía algo propio que decir.

## Cómo un sitio pequeño termina con un sitemap grande

Los archivos generados son baratos de construir, así que un sitio los acumula.

Cada etiqueta recibe una página de archivo. Cada tecnología mencionada en un proyecto también. Luego agregué un segundo idioma, y cada una de esas páginas ganó un gemelo en español.

Cuando conté:

- 154 de 240 páginas de tecnologías incluían exactamente una entrada.
- Unas 70 de 112 páginas de etiquetas incluían exactamente un artículo.
- Existían rutas en español de artículos y casos de estudio para cada entrada, incluidas aquellas cuyo contenido seguía en inglés.

Un archivo con una sola entrada es un título, una tarjeta y un enlace a la entrada. Repite lo que la entrada ya dice. Una URL en español que muestra un artículo en inglés es una copia de la página en inglés.

Las páginas que salieron eran cerca de dos tercios del sitemap.

## Por qué importa

Un sitemap es una lista de páginas que le pides considerar a un buscador. Llenarlo de casi duplicados hace que esa petición sea menos útil.

Las páginas escasas y duplicadas también pueden competir con las reales. Cuando un archivo con una sola tarjeta y el artículo al que apunta tratan el mismo tema, no hay razón para preferir el archivo.

No tengo una gráfica de tráfico de antes y después para mostrar, y no voy a inventar una. El argumento es más simple: no valía la pena indexar estas páginas, así que dejé de enviarlas.

## Un umbral, en un solo lugar

La regla es una sola constante:

<!-- eslint-skip -->
```ts
export const MIN_INDEXED_ARCHIVE_ENTRIES = 3

export const isIndexedArchive = (entryCount: number): boolean =>
  entryCount >= MIN_INDEXED_ARCHIVE_ENTRIES
```

Un archivo de tema o de tecnología con menos de tres entradas publicadas lleva `noindex, follow`. Permanece en la navegación, y sus enlaces siguen contando. Cuando se publica una tercera entrada, el archivo pasa a ser indexable sin que nadie tenga que acordarse de activar nada.

Tres es una decisión de criterio. Uno es claramente un duplicado. Dos es una lista corta. Con tres, un archivo empieza a servir como forma de explorar.

Las páginas de archivo, el sitemap y el generador de tarjetas sociales leen la misma constante, así que no pueden contradecirse sobre qué páginas importan.

## El sitemap lee las páginas compiladas

Un filtro de sitemap puede repetir las reglas: omitir los archivos escasos, omitir las rutas sin traducir. Entonces cada regla nueva hay que escribirla dos veces, una en la página y otra en el filtro.

Este lee cada archivo HTML compilado y descarta toda página marcada con `noindex`. La página es la fuente de verdad. Si una página dice que no debe indexarse, no puede enviarse, sea cual sea la razón.

Eso eliminó toda una clase de errores. Un sitemap que incluye una página con `noindex` envía dos señales opuestas, y es una inconsistencia fácil de publicar.

## Páginas sin traducir

Una ruta en español sin traducción recurre al cuerpo en inglés. Esa página lleva `noindex, follow`, queda fuera del sitemap y no declara alternativas de idioma.

Cuando se escribe la traducción, la página se convierte en un documento real en español con su propia URL canónica, y entra al sitemap como una mitad de un par `en` y `es`.

Conservar ese respaldo importa. Significa que un artículo nuevo puede publicarse primero en inglés sin crear un duplicado en la dirección en español.

## Deja de marcar tus propios enlaces con nofollow

Mientras revisaba los archivos encontré un problema relacionado en la dirección opuesta.

El pipeline de Markdown agregaba `nofollow` a cada enlace externo. Es un valor predeterminado razonable para enlaces por los que no respondes. Pero 90 de los 153 enlaces afectados en mis artículos apuntaban a mis propios subdominios, repositorios, paquetes y perfiles.

Les estaba diciendo a los buscadores que no confiaran en los enlaces a mi propio trabajo.

La opción `rel` del plugin acepta una función, así que ahora la regla es específica: los enlaces de terceros conservan `nofollow`, y mis propiedades no. Todos los enlaces externos se siguen abriendo con `noopener noreferrer`.

## No bloquees lo que quieres que se ignore

Hay un detalle que es fácil entender al revés. Una página marcada con `noindex` debe seguir siendo rastreable.

Si la bloqueas en `robots.txt`, el rastreador nunca obtiene la página y nunca ve el `noindex`. La URL aún puede aparecer en los resultados, sin descripción. La exclusión tiene que poder leerse para funcionar.

## Cómo revisar tu propio sitio

Puedes hacer esta auditoría en una tarde:

1. Cuenta las entradas de cada archivo generado. Ordena por cantidad y mira el final de la lista.
2. Abre tu sitemap y busca cualquier URL que lleve `noindex` en su HTML.
3. Para cada idioma, comprueba si el contenido de la página está en ese idioma.
4. Enumera los enlaces externos marcados con `nofollow` y mira cuántos son tuyos.

La mayor parte de lo que encuentres serán páginas que nadie echaría de menos en un resultado de búsqueda. Consérvalas para quienes exploran, y deja de enviarlas.

Una nota sobre las cifras. Las 285 son las páginas propias de este sitio. El archivo que envío también incluye los sitios de documentación de mis otros proyectos, lo cual es una decisión aparte y un archivo mucho más largo.
