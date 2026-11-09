---
title: "Patrones de Astro y Alpine para sitios rápidos con mucho contenido"
description: "Los patrones de Astro y Alpine.js que mantienen rápidos los sitios con mucho contenido sin renunciar a los detalles interactivos que les dan un acabado cuidado."
coverImage:
  alt: "Un plano de contenido estático conectado a islas ligeras de medios, controles y rendimiento"
---

Astro no envía JavaScript de forma predeterminada. Alpine añade interactividad con un tamaño pequeño y un propósito definido. Juntos encajan muy bien en sitios con mucho contenido, siempre que los patrones se mantengan bajo control.

El error que veo con más frecuencia es tratar Astro como un proyecto de React: recurrir al estado del cliente para cosas que no lo necesitan, hidratar componentes cuando una salida estática habría bastado y terminar con un paquete que perjudica el rendimiento por el que elegiste Astro en primer lugar.

Los siguientes patrones son los que han mantenido rápido este sitio sin dejar de admitir los detalles interactivos que importan.

## Parte de cero JavaScript y añade solo lo necesario

Cada componente de Astro se convierte en HTML estático, a menos que pidas explícitamente comportamiento del lado del cliente. Vale la pena proteger esa base.

Antes de añadir `x-data` o una directiva `client:`, me pregunto: ¿esta interacción necesita estado en el cliente o solo parece necesitarlo?

Una cantidad sorprendente de interfaces que parecen interactivas solo contiene lógica de presentación: mostrar u ocultar elementos según una condición conocida al atender la solicitud, aplicar una clase cuando un valor alcanza un umbral o renderizar una variante de un componente en lugar de otra. Esa lógica pertenece a la plantilla, no a JavaScript.

Cuando sí hace falta comportamiento del cliente, Alpine es la herramienta adecuada para lo que no requiere un árbol de componentes. Las directivas `x-data`, `x-show` y `x-on` cubren la mayoría de los patrones interactivos sin enviar un framework completo.

## Mantén x-data cerca del elemento que lo utiliza

Alpine limita el estado reactivo al elemento donde se declara `x-data`. Es una ventaja, no una limitación.

La tentación es llevar el estado compartido a un contenedor ubicado muy arriba en el árbol para que varios componentes puedan acceder a él. Funciona en casos pequeños, pero dificulta entender la página a medida que crece: terminas con estado invisible que afecta el comportamiento visible de grandes partes de la distribución.

El patrón que prefiero es que cada unidad interactiva sea dueña de su estado. Un menú desplegable controla si está abierto o cerrado. Un campo de formulario controla su estado de error. Un elemento de acordeón controla si está expandido. Si dos elementos realmente necesitan compartir estado, primero reviso si debería vivir en un parámetro de la URL, una cookie o una prop renderizada en el servidor, antes de elevarlo a un ámbito compartido de Alpine.

## Usa las transiciones de Astro como mejora progresiva

Las View Transitions de Astro pueden hacer que navegar se sienta mucho más cuidado, pero añaden JavaScript a cada transición entre páginas. En sitios de contenido, conviene pensarlo con atención.

Este es el patrón que uso:

- Activar `<ViewTransitions />` globalmente para las páginas donde la transición aporta un valor perceptible real, como al moverse entre un artículo y su listado
- Usar `transition:name` en los elementos concretos que deberían animarse: la cabecera, la imagen principal o un elemento compartido de la interfaz
- Probar siempre con `prefers-reduced-motion` en el navegador para confirmar que las transiciones se adaptan correctamente

La alternativa con movimiento reducido importa porque las transiciones que ignoran las preferencias del usuario perjudican la accesibilidad sin parecer defectuosas en una auditoría estándar.

## Arquitectura de islas: hidrata el comportamiento, no el contenido

El modelo de islas de Astro permite hidratar componentes concretos sin enviar JavaScript para el resto de la página. La cuestión es qué directiva usar.

Estas son las decisiones que tomo con más frecuencia:

- `client:idle` para elementos interactivos secundarios: un formulario de suscripción fuera del área inicial o un carrusel de artículos relacionados
- `client:visible` para cualquier elemento al que el usuario deba desplazarse antes de interactuar
- `client:only` cuando un componente realmente no puede renderizarse en el servidor, como widgets de terceros o API exclusivas del navegador
- Ninguna directiva para componentes que producen contenido estático, aunque parezcan interactivos en Figma

`client:load` debería ser poco frecuente en un sitio de contenido. Si algo está en el área visible inicial y debe ser interactivo al cargar la página, probablemente justifica `client:load`. En la mayoría de los demás casos, las opciones diferidas sirven igual de bien al usuario con un costo de rendimiento menor.

## Carga diferida de imágenes con el componente Image de Astro

Los sitios de contenido suelen tener muchas imágenes. Cada imagen cargada de inmediato compite por recursos con el contenido que el usuario intenta leer.

El componente `<Image>` integrado en Astro gestiona la conversión de formato, la optimización del tamaño y la carga diferida de forma predeterminada. Sigo este patrón:

- Usar `<Image>` para todas las imágenes de contenido, portadas y capturas de proyectos
- Añadir `loading="eager"` y `fetchpriority="high"` solo a la imagen de contenido más grande del área visible, la que afecta al LCP
- Definir `width` y `height` explícitamente en cada imagen para evitar desplazamientos de la distribución

La combinación de salida WebP, dimensiones correctas y carga diferida para las imágenes fuera del área inicial suele mejorar considerablemente las puntuaciones de rendimiento de Lighthouse sin cambiar la arquitectura.

## Reduce el CSS global y aprovecha la salida de Tailwind

Tailwind analiza las plantillas durante la compilación y genera solo las clases utilizadas. Esa salida suele ser muy pequeña. El riesgo está en acumular utilidades personalizadas, estilos base y reglas globales que sobrescriben o duplican lo que Tailwind ya ofrece.

En sitios con mucho contenido, intento limitar la hoja de estilos global a:

- Definiciones de tokens de diseño en `@theme`
- Estilos tipográficos base para el contenido en prosa cuando la clase `prose` de Tailwind no basta
- Utilidades personalizadas que, de otro modo, tendrían que repetirse en cada componente

Todo lo demás debería ser una clase de Tailwind directamente en la plantilla. Conviene revisar de nuevo el CSS global que no esté en `@theme` o en un bloque `@utility` antes de publicarlo.

## Las metas de rendimiento que vale la pena seguir

Astro y Alpine permiten alcanzar de forma consistente una puntuación de Lighthouse ≥ 90 en móvil, pero las cifras específicas que conviene vigilar son:

- **LCP (Largest Contentful Paint)** por debajo de 2,5 segundos en un dispositivo móvil de gama media simulado
- **CLS (Cumulative Layout Shift)** por debajo de 0,1; depende en gran medida de definir las dimensiones de las imágenes y de la estrategia de carga de fuentes
- **TBT (Total Blocking Time)** lo más cercano posible a cero; el principal riesgo son los scripts de terceros y una hidratación demasiado temprana

Comprobar estas métricas después de añadir una sección interactiva o cambiar la estrategia de hidratación de un componente importante permite detectar regresiones antes de que se acumulen.

Para la parte de accesibilidad que necesitan las páginas de Astro, el artículo sobre [controles de accesibilidad con Playwright](/es/blog/playwright-accessibility-checks-that-teams-keep-running/) explica cómo automatizar esa verificación junto con el trabajo de rendimiento.
