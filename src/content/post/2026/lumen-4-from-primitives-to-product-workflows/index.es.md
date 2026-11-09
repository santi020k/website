---
title: "Lumen 4: de primitivas a flujos de producto"
description: "Dentro de la candidata de Lumen 4: gráficos más completos, espacios multimedia, movimiento, mejoras nativas y una migración deliberada desde v3."
coverImage:
  alt: "Un núcleo modular luminoso conecta un gráfico de escritorio, un marco móvil y una pieza multimedia translúcida"
---

Cuando abrí la solicitud de cambios de la versión Lumen 4, su tamaño era difícil de ignorar: más de 6.500 archivos modificados y unas 343.000 líneas añadidas.

Esas cifras necesitan contexto. Se trata de una versión coordinada de paquetes web y nativos, con fuentes generadas, documentación, pruebas, entornos interactivos e infraestructura de publicación dentro del mismo cambio. El diff es mucho mayor que el código de componentes escrito a mano.

Aun así, el alcance refleja un cambio real en lo que quiero que [Lumen](https://lumen.santi020k.com/) haga posible.

La primera versión estableció un lenguaje de interfaz compartido para Astro, React y Web Components. Los adaptadores nativos llevaron ese lenguaje a React Native, SwiftUI y Jetpack Compose. Con la versión 4, el trabajo profundiza en las interfaces que los productos realmente necesitan: paneles analíticos, formularios localizados, espacios multimedia e interacciones que siguen siendo utilizables cuando cambia el estado.

**Este es un adelanto de la candidata v4.** Al 6 de octubre de 2026, [la solicitud de cambios de la versión](https://github.com/santi020k/lumen/pull/95) está abierta. Las funciones descritas aquí pertenecen a esa candidata; la publicación de paquetes, el despliegue de documentación y las actualizaciones de las tiendas son pasos separados.

## Las aplicaciones reales dieron forma a la versión

El punto de partida más útil fue una auditoría de las aplicaciones que rodean a Lumen.

Las interfaces financieras necesitaban rangos de fechas, importes precisos y gráficos que siguieran siendo legibles en un teléfono. Los productos multimedia necesitaban vistas comparativas y acciones sobre archivos adjuntos. Los sitios de documentación revelaron fallos del portapapeles, comportamientos de navegación y soluciones temporales de espaciado. Las aplicaciones nativas necesitaban mejores distribuciones y una presentación de datos más clara.

Esa auditoría dio a la versión un propósito concreto: llevar la presentación y la interacción reutilizables a Lumen mientras las decisiones del producto permanecen en la aplicación.

Un control de importes puede conservar un valor decimal localizado mientras se escribe. No debería decidir una regla de crédito. Un gráfico puede exponer valores exactos y un evento de activación. No debería calcular las métricas de negocio del producto. Un espacio multimedia puede organizar vistas previas y controles. El almacenamiento, el procesamiento y la exportación siguen perteneciendo a su aplicación anfitriona.

Ese límite importa más a medida que crece el catálogo.

## Los gráficos se convierten en un lenguaje de producto más completo

V4 amplía el vocabulario de visualización con componentes como BulletChart, CalendarHeatmap, FunnelChart y BoxPlot, junto con vistas comparativas, histogramas y gráficos de cascada.

Cada uno responde una pregunta distinta. Un gráfico de viñetas compara una medida con un objetivo y rangos cualitativos. Un mapa de calor de calendario revela actividad a lo largo de las fechas. Un embudo conserva el orden de etapas suministrado. Un diagrama de caja muestra los cuartiles, bigotes y valores atípicos que entrega la aplicación.

La distinción es práctica. Lumen se encarga del contrato de renderizado; la aplicación, de la estadística y del significado de los datos.

La versión también mejora las partes menos visibles de los gráficos: identidades estables, detalle localizado, etiquetas adaptables, tablas de datos exactos, acciones de teclado y movimiento que mantiene disponibles los datos accesibles desde el primer momento.

Dos observaciones pueden compartir la etiqueta visible «Mon» sin compartir la misma identidad. Una medida ausente debe seguir ausente, en lugar de convertirse silenciosamente en cero. Un gráfico debería explicar sus datos incluso cuando su representación visual sea difícil de interpretar.

Esas reglas hacen que una visualización sea útil más allá de una captura de pantalla.

## Las interfaces multimedia reciben bloques reutilizables

ImageComparison añade una forma enfocada de inspeccionar dos imágenes. El trabajo multimedia más amplio incorpora áreas de visualización controladas, miniaturas, tiras de imágenes y modos persistentes de comparación, junto con recetas instalables de espacios de trabajo, ajustes y procesamiento de Studio.

En conjunto, estas piezas admiten una superficie de edición más completa: elegir un recurso, inspeccionarlo, comparar estados y mostrar la siguiente acción mediante controles consistentes.

Los archivos adjuntos también reciben una composición explícita para vistas previas, estados alternativos, identidad de reintentos y acciones independientes por archivo.

La aplicación anfitriona sigue aportando los servicios multimedia y el comportamiento de exportación. Mantener explícita esa responsabilidad hace que la misma interfaz sirva para una herramienta fotográfica, una pantalla de revisión de recursos o un flujo de procesamiento, sin convertir a Lumen en un backend multimedia.

## El movimiento se incorpora al contrato de interacción

V4 incluye transiciones de presencia, movimiento coordinado mediante claves, continuidad de gráficos y efectos visuales opcionales. También hay puntos de integración opcionales para Motion y Rive.

El objetivo es facilitar el seguimiento de los cambios: la entrada de un panel, la modificación de una lista, la actualización de un gráfico o la aparición de una respuesta después de una acción.

Eso requiere algo más que una animación fluida. Las transiciones interrumpidas, el foco del teclado, las preferencias de reducción de movimiento y la disponibilidad del contenido deben comportarse correctamente.

El nuevo entorno visual de pruebas facilita explorar esas decisiones. Los presets de apariencia Default, Studio y Glass ofrecen puntos de partida distintos, mientras la personalización del tema abarca radios, espaciado y bordes. Los adaptadores nativos exponen paletas correspondientes y opciones explícitas de materiales con alternativas opacas.

La apariencia es una decisión de base. No debería exigir reemplazar todos los componentes de un producto.

## Los mapas y marcos de dispositivos hacen más útiles los ejemplos

WorldMap lleva mapas de puntos y sólidos a los adaptadores web, con países destacados, marcadores con etiquetas, selección, controles de zoom y desplazamiento con ratón o lápiz. La geometría de los países se distribuye con la biblioteca en lugar de necesitar solicitudes de red durante la ejecución.

Esto abre composiciones útiles para seleccionar destinos, resumir regiones y contar historias geográficas. La aplicación aporta el significado del país o marcador seleccionado.

DeviceFrame da a las demostraciones un contexto más deliberado. Sus presets incluyen teléfonos, tabletas, portátiles y computadores de escritorio, con modelos como MacBook Air, MacBook Pro, iPad Pro, iMac y Pixel. Los marcos pueden presentar imágenes, HTML activo o un área de iframe de tamaño fijo.

Son herramientas de presentación, pero resuelven un problema real de documentación: mostrar cómo encaja una interfaz en un dispositivo sin reconstruir una maqueta para cada ejemplo.

## La consistencia nativa conserva las convenciones de cada plataforma

El trabajo nativo mantiene la misma arquitectura: bases semánticas compartidas y detalles de implementación bajo responsabilidad de cada adaptador.

V4 incluye mejoras de gráficos y distribución nativos, cambios de apariencia y entornos de prueba actualizados. El soporte sigue siendo deliberado; que un componente web aparezca en el catálogo no promete automáticamente una API nativa idéntica.

SwiftUI debe seguir sintiéndose como SwiftUI. Compose debe seguir usando las convenciones de Android. React Native debe seguir su propio modelo de interacción.

Los cambios nativos de la candidata también requieren que los consumidores vuelvan a compilar. Una llamada de código que sigue compilando no demuestra compatibilidad binaria, y una vista previa del repositorio no demuestra que la versión de la tienda contenga la misma revisión.

## Una versión mayor necesita una migración deliberada

Algunos de los cambios más relevantes de v4 son decisiones pequeñas de API y distribución.

Las separaciones de Stack y Grid en web ahora siguen la escala canónica de espaciado. Para conservar las distribuciones de v3, los valores explícitos `md`, `lg` y `xl` migran a `group`, `xl` y `2xl`, respectivamente. El valor predeterminado omitido sigue siendo 16 píxeles.

Select, PhoneInput y Segmented usan `visualSize` en Astro y React, y `visual-size` en Web Components. Esto separa el tamaño visual del tamaño nativo del control.

Card se encarga del espacio entre sus partes y ya no recorta todo lo que sobresale. Eso permite que los indicadores de foco y el contenido flotante se extiendan más allá de la tarjeta, mientras el marco de una imagen se ocupa del recorte multimedia. Las aplicaciones deberían revisar los márgenes compensatorios y las reglas de desbordamiento antiguas como parte de la actualización.

La selección controlada también necesita una responsabilidad explícita: aceptar los cambios en el estado de la aplicación o elegir un valor predeterminado no controlado cuando ese sea el comportamiento previsto.

La [guía de migración de v3 → v4](https://github.com/santi020k/lumen/blob/release/v4.0.0/docs/migrating-v3-to-v4.md) incluye una vista previa de CLI y ejemplos. Las reescrituras automáticas cubren patrones de código reconocidos; las props dinámicas, el CSS de la aplicación, las versiones nativas fijadas y las decisiones de comportamiento siguen necesitando revisión.

## Mejores herramientas para las personas y los agentes que usan Lumen

El trabajo en flujos de IA añade uso del catálogo según la versión, descubrimiento de migraciones y orientación dedicada a construcción, revisión y migración. El catálogo MCP expone los contratos vigentes para que los agentes puedan consultar los componentes compatibles en lugar de adivinar una API.

Tener en cuenta la versión es especialmente útil durante una versión mayor. Una aplicación con v3 instalada debería recibir orientación de v3 hasta que se actualice deliberadamente.

También mantengo separada la evidencia: las verificaciones deterministas del catálogo, los ejercicios con agentes autenticados, la publicación de paquetes y un plugin instalado que funciona responden preguntas distintas. Ninguna por sí sola demuestra que todas las interfaces generadas vayan a ser correctas.

## Qué quiero que permita esta versión

El tamaño de la solicitud de cambios llama la atención, pero el resultado que me importa es más sencillo: más trabajo repetido de interfaz en mis productos debería convertirse en bloques reutilizables, documentados y accesibles.

Lumen 4 acerca esos bloques a flujos completos de producto mientras mantiene las reglas de negocio, la responsabilidad sobre los datos y la estructura de plataforma en la aplicación.

Puedes [seguir la solicitud de cambios de la versión](https://github.com/santi020k/lumen/pull/95), [explorar Lumen](https://lumen.santi020k.com/) o leer la [auditoría de consumidores](https://github.com/santi020k/lumen/blob/release/v4.0.0/docs/lumen-4-consumer-audit.md) de la candidata. Cuando se publique la versión, empieza por la guía de migración y verifica las versiones reales de los paquetes antes de actualizar una aplicación de producción.
