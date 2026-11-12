---
title: "El fondo de página que costó un segundo de tiempo de bloqueo"
description: "Un artículo largo obtenía cerca de 0,7 en Lighthouse casi sin JavaScript. La causa era una declaración de CSS que faltaba en el fondo de la página."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

Un artículo de este sitio seguía fallando su comprobación de rendimiento.

Es un tutorial largo con muchos ejemplos de código. En CI, Lighthouse le daba entre 0,67 y 0,77, con un tiempo total de bloqueo de entre 0,8 y 1,5 segundos. Todas las demás rutas superaban 0,90.

La página es HTML estático con muy poco JavaScript. Tenía su propio umbral más bajo en la configuración de Lighthouse, 0,85, y ni siquiera lo alcanzaba.

## Los sospechosos de siempre

El tiempo total de bloqueo mide cuánto tiempo el hilo principal estuvo demasiado ocupado para responder. La causa habitual son los scripts, y un artículo cargado de código ofrece muchos sospechosos creíbles.

Algunos eran reales. Los indicadores de desplazamiento de los ejemplos de código forzaban un cálculo de layout por ejemplo, y ahora comparten una sola medición. Un respaldo para copiar enlaces forzaba un cálculo de estilos en cada página, y ya no lo hace. El documento mismo era grande: más de cuatro mil elementos, con un estilo en línea en cada token resaltado.

Valía la pena corregir todo eso. Nada de eso explicaba un segundo de bloqueo en una página que casi no hace nada.

## Lo que mostró la traza

Una traza grabada en el runner de CI lo respondió. El tiempo se iba en pintar, y la cantidad de trabajo crecía con la altura de la página.

Eso apuntaba a algo dibujado detrás de todo lo demás.

## El telón de fondo

El fondo de página de este sitio no es un color plano. Son unos cuantos degradados radiales suaves sobre el color base, que le dan al lienzo un brillo tenue cerca de la parte superior.

Cada capa de degradado ya cubre todo el body. Nada en el diseño se repite.

Pero los fondos de CSS se repiten de forma predeterminada. La hoja de estilos no definía `background-repeat`, porque una capa que lo cubre todo se ve idéntica se repita o no.

No era idéntica en costo. Con el valor predeterminado, Chromium rasterizaba un mosaico de repetición tan alto como la página. En una página corta, eso no es nada. En un artículo muy largo, detenía la página durante cientos de milisegundos.

## La solución

Una declaración:

```css
body {
  /* Each layer already covers the whole body, so repeating paints the same pixels. */
  background-repeat: no-repeat;
}
```

Los píxeles en pantalla no cambiaron. Ahora el fondo se pinta una sola vez.

En CI, el mismo artículo pasó de 0,67–0,77 a 0,93–0,94. El tiempo total de bloqueo pasó de 0,8–1,5 segundos a 10–25 milisegundos.

Eliminé la excepción de la configuración de Lighthouse. Ahora todas las rutas medidas deben alcanzar 0,90.

## Por qué era fácil pasarlo por alto

Tres cosas lo ocultaron.

**Solo afectaba a las páginas largas.** La página de inicio y la mayoría de los artículos estaban bien, así que las cifras generales se veían saludables. Una ruta lenta se interpreta como «esa página es pesada».

**La página sí era pesada.** Había una explicación obvia y creíble. Reducir el DOM valía la pena. No era la causa.

**La excepción quitó la presión.** Un presupuesto con una excepción informa menos sobre aquello que exceptuaste. Un listón más bajo para una ruta hace que su lentitud parezca esperada.

## Lo que hago distinto ahora

Leo una traza antes de cambiar código. Las correcciones basadas en lo que suele causar tiempo de bloqueo son suposiciones razonables. Una grabación muestra adónde se va realmente el tiempo.

Trato una excepción como una deuda con fecha. Si una ruta necesita un umbral más bajo, la configuración debería decir por qué y cuándo se eliminará.

Reviso el CSS decorativo en la página más larga, no en la de inicio. Los degradados, los filtros, los desenfoques, los fondos fijos y las sombras grandes cuestan en proporción al área que cubren. Una revisión de diseño ocurre en la parte superior de una página corta. El costo aparece al final de una larga.

Y escribo `background-repeat: no-repeat` en los fondos por capas, incluso cuando repetirlos se vería igual.

## Revisa tu propio sitio

Toma unos minutos:

1. Encuentra tu página más alta. Un artículo largo o un listado grande sirve.
2. Graba una traza de rendimiento mientras carga.
3. Compara el tiempo de pintado y rasterizado con el de una página corta que comparta la misma composición.

Si la página alta dedica mucho más tiempo a pintar de lo que su contenido explica, mira lo que hay detrás del contenido antes de mirar el contenido.
