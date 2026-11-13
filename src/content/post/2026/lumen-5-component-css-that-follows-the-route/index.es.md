---
title: "Lumen 5: CSS de componentes que sigue a la ruta"
description: "Qué cambió cuando este sitio pasó a Lumen 5: estilos por componente, un runtime asíncrono, puntos de estilo públicos y las comprobaciones que hice antes de quitar la hoja de estilos completa."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

Una biblioteca de componentes suele distribuir una sola hoja de estilos. La importas una vez y cada página recibe los estilos de todos los componentes, incluidos los que nunca muestra.

Ese era el mayor costo individual de este sitio. Cuando medí la hoja de estilos compartida en octubre, cerca del 43 % correspondía al catálogo completo de [Lumen](/es/portfolio/lumen-ui/).

Lumen 5 cambia ese comportamiento predeterminado. Esto es lo que implicó la actualización en un sitio real, incluidas las partes que exigieron cuidado.

## Los estilos viajan con el componente

En Lumen 5, un componente de Astro importa sus propios estilos. Una página que muestra un `Card` y un `Link` recibe el CSS de esos dos, y una página que nunca muestra un diálogo no carga las reglas del diálogo.

La hoja de estilos compartida se reduce a la base, el tema y el movimiento:

```css
@import "@santi020k/lumen-astro/layers.css";
@import "tailwindcss";
@import "@santi020k/lumen-astro/styles/foundation.css";
@import "@santi020k/lumen-astro/styles/themes/santi020k.css";
@import "@santi020k/lumen-core/styles/motion.css";
@import "@santi020k/lumen-astro/tailwind.css";
```

El archivo `styles.css` completo sigue teniendo soporte. El CSS selectivo es algo que adoptas, y las notas de migración indican que solo debes quitar la hoja de estilos completa después de revisar cada ruta.

## Las rutas de importación deciden qué páginas pagan

Un detalle me sorprendió. La raíz del paquete reexporta todos los componentes, y Astro puede seguir esa importación compartida cuando asigna los estilos de los componentes a las páginas. El resultado son estilos ajenos enlazados en rutas que nunca los usan.

Importar cada componente desde su propia entrada pública lo evita:

<!-- eslint-skip -->
```ts
import Button from '@santi020k/lumen-astro/components/Button'
```

Es una importación más larga. También mantiene los estilos junto a las rutas que los usan, que es la razón de ser del cambio.

## Marcado que ningún componente genera

Los estilos automáticos funcionan cuando un componente se monta. Parte del marcado de este sitio nunca se monta así.

Las pestañas de código y las tablas de los artículos se generan desde Markdown con un plugin de rehype. No se ejecuta ningún componente de Astro, así que nada importa sus estilos. La hoja de estilos de los artículos importa esas dos entradas públicas de forma explícita:

```css
@import "@santi020k/lumen-astro/styles/components/code-tabs.css";
@import "@santi020k/lumen-astro/styles/components/table.css";
```

Todo lo que un script crea en tiempo de ejecución tiene el mismo problema. Una auditoría del código fuente no puede demostrar que una ruta recibe el CSS que necesita. Tienes que cargar la página.

## El runtime ahora es asíncrono

En Lumen 4, montar el runtime cargaba el catálogo interactivo. En Lumen 5, los controladores se cargan bajo demanda y la función de inicialización devuelve una promesa.

Para la mayoría de las páginas nada cambia: monta `UIPrimitives` una vez en el layout compartido y déjalo ahí. Importa cuando tu propio código crea marcado y espera que se mejore de inmediato. Espera la función con `await` o escucha `ui:ready`. Una inicialización automática fallida informa `ui:runtime-error`, de modo que el fallo queda visible.

## Los puntos públicos reemplazan a los selectores privados

Dar estilo al marcado interno de una biblioteca funciona hasta que la biblioteca cambia un contenedor.

Lumen 5 documenta partes `data-slot` para la línea de tiempo, el selector de tema y el mapa del mundo, además de una variable para el tamaño del ícono del selector de tema. El mapa de viajes de este sitio ahora da estilo al mapa mediante esos puntos públicos.

La regla general que sigo: las props públicas, las variables semánticas, las partes `data-slot` y los roles ARIA son un contrato. Un nombre de clase que aparece por casualidad en el resultado no lo es.

## Lo que revisé antes de quitar la hoja de estilos completa

La lista es corta, y omitir cualquier punto habría publicado un error visible:

- Cada ruta, en ambos temas.
- La navegación del lado del cliente entre rutas con estilos distintos.
- Los controles generados desde Markdown y el marcado creado en tiempo de ejecución.
- Las preferencias de tema guardadas, los comentarios y las revelaciones al desplazarse.

Las revelaciones necesitaron una revisión propia. Lumen 5 respeta la proporción de visibilidad solicitada y mantiene el contenido visible cuando el movimiento reducido, la geometría o el foco del teclado hacen que ocultarlo sea un error, así que vale la pena volver a revisar las secciones altas.

## El resultado, con su salvedad

La hoja de estilos compartida de este sitio pasó de unos 62 KB comprimidos tras mi propia limpieza a unos 30 KB después de adoptar el CSS por componente.

La salvedad es que ahora una página carga varias hojas de estilos más pequeñas. La página de inicio enlaza siete, y un artículo largo con código enlaza doce. El total que alguien descarga en una página bajó menos que el archivo compartido. Lo que más mejoró es que una ruta ya no paga por componentes que no muestra.

## Los archivos se quedaron donde estaban

Las cuatro versiones archivadas de este sitio siguen usando Lumen 4 con su paleta original. Lumen 5 renovó las paletas predeterminadas, y un archivo no debería cambiar de color porque el sitio actual se actualizó.

El workspace fija ambas versiones una junto a la otra, de modo que el sitio actual y los archivos resuelven versiones mayores distintas de los mismos paquetes.

## Si vas a actualizar

Primero revisa la migración en tu proyecto:

```bash
lumen migrate v5 --dry-run --json
```

Después trata el CSS por componente como un paso aparte del cambio de versión. Actualiza, confirma que nada cambió y solo entonces empieza a quitar la hoja de estilos completa, un grupo de rutas a la vez. La actualización se puede hacer rápido sin riesgo. Quitar la hoja de estilos es la parte que merece una tarde tranquila.
