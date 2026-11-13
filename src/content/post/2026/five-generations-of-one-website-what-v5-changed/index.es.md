---
title: "Cinco generaciones de un mismo sitio web: qué cambió en la v5"
description: "Cómo se publicó el rediseño editorial de la v5 mientras cuatro versiones anteriores del sitio seguían en línea como archivos mantenidos y sin indexar."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

La mayoría de los rediseños eliminan el sitio anterior. El nuevo lo reemplaza, las capturas viejas terminan en una carpeta y un año después nadie recuerda cómo funcionaba la navegación.

Con la v5 hice lo contrario. El sitio actual vive en la raíz, y los cuatro diseños que lo precedieron siguen en línea desde `/v1/` hasta `/v4/`. Puedes abrir la [historia del sitio](/es/history/) y recorrer los cinco.

Esto es lo que cambió en la v5 y lo que cuesta mantener en marcha las generaciones anteriores.

## Qué es la v5

La v5 es un rediseño editorial. La composición toma ideas del medio impreso: aperturas de capítulo, listas con filetes, pies de figura y superficies más sobrias. El modelo de contenido se mantuvo igual, así que todas las rutas públicas siguieron funcionando y quienes visitan el sitio no necesitaron ninguna migración.

Llegó con tres novedades:

- **Español.** El sitio actual está disponible en español latinoamericano bajo `/es/`, con artículos y casos de estudio traducidos.
- **Búsqueda de texto completo.** La búsqueda sigue priorizando títulos y etiquetas. Cuando hay espacio para más resultados, carga un índice del cuerpo de los artículos y casos de estudio publicados.
- **Una página de contacto.** [Trabajemos juntos](/es/work-with-me/) reúne en un solo lugar las formas de iniciar una conversación.

La v4.0.0 se publicó el 8 de octubre de 2026. Tenía preparada una versión 4.1 y, en lugar de publicarla por separado, integré ese trabajo en la v5.0.0. Dos versiones seguidas con direcciones visuales distintas habrían sido ruido.

## La regla del archivo: congelar el diseño, mantener el software

Los sitios archivados no son capturas de pantalla. Cada uno es una aplicación de Astro funcional en `apps/`, que se compila junto con el sitio actual y se ensambla en un único despliegue estático.

La regla que adopté tiene dos mitades.

**El diseño y el contenido quedan congelados.** Un archivo conserva su composición, sus textos y sus recursos de la fecha de la instantánea. No traslado artículos nuevos ni el lenguaje visual actual a una época anterior.

**El software se mantiene.** Cada archivo usa el mismo catálogo de dependencias y el mismo lockfile que el sitio actual. No restauro un lockfile viejo para conservar el aspecto de algo. Si una actualización del framework cambia el resultado, corrijo el archivo para que mantenga su apariencia original con las dependencias actuales.

Esa segunda mitad importa más de lo que parece. Un lockfile congelado es una lista creciente de dependencias sin parches. Mantener los archivos en versiones actuales significa que una sola auditoría cubre todo lo que despliego.

Las etiquetas de versión están curadas. La v3, la v4 y la v5 corresponden a versiones publicadas reales. La v1 y la v2 son etiquetas de época que asigné después a dos instantáneas estables, y la página de historia lo dice.

## Lo que un archivo no puede hacer

Un sitio preservado puede causar problemas reales si se comporta como uno activo. Por eso cada archivo tiene límites:

- Sin analítica, sin service worker, sin comentarios en vivo y sin formulario de boletín funcional.
- Cada página archivada lleva `noindex, follow`, y los archivos nunca entran al sitemap. No los bloqueo en `robots.txt`, porque un rastreador tiene que leer la página para ver la exclusión.
- Un aviso sobre la navegación indica qué versión estás viendo y enlaza a la página de inicio actual, a la página de historia y al equivalente actual de la página cuando existe.
- Un enlace que sale de un archivo provoca una carga completa del documento, de modo que una aplicación nunca hereda el estado de los scripts de otra.
- El almacenamiento del tema y del historial de búsqueda usa claves separadas por versión.

Las reparaciones de accesibilidad están permitidas y siguen la misma idea que la regla del software. La navegación con teclado, la restauración del foco y el reajuste del texto se corrigieron en los sitios antiguos sin aplicarles el diseño actual.

## El costo

Mantener cinco sitios no es gratis, y prefiero ser específico al respecto.

La compilación completa de producción tarda unos 22 minutos, y la mayor parte de ese tiempo se va en los archivos. El resultado de cada archivo se guarda en caché, así que una recompilación que no toca una época la reproduce en menos de un segundo. Una compilación en frío sigue pagando la cuenta completa.

El despliegue también es grande. Los formatos de imagen antiguos y los recursos duplicados entre generaciones se acumulan, y reducirlos está en mi lista.

Las pruebas también crecieron. La infraestructura de los archivos necesita su propia cobertura: reescritura de URL, límites de almacenamiento, formularios deshabilitados y comportamiento del teclado en menús de diseños anteriores.

## Las capturas son reales

La página de historia muestra capturas de escritorio y móvil de cada época. Un script las toma de la compilación de producción ensamblada, con tamaños fijos, en modo claro y con movimiento reducido. Antes de guardar una captura, comprueba que la página respondió y que el aviso del archivo muestra la versión y la fecha esperadas.

No quería maquetas de mi propia historia. Si una captura se ve anticuada, de eso se trata.

## ¿Lo volvería a hacer?

Sí, con una condición: decide la regla antes de empezar. «Diseño congelado, software mantenido» respondió casi todas las preguntas que surgieron, desde si corregir un error de foco en la v1 hasta si una página antigua del boletín debía mostrar números nuevos.

Si estás por reemplazar un sitio que te importa, considera mantener accesible el anterior. Ponle una etiqueta clara, mantenlo fuera de los resultados de búsqueda y conserva sus dependencias al día. Es un mejor registro que una carpeta de capturas.
