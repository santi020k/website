---
title: "Astro Doctor: un diagnóstico para bases de código Astro"
description: "Por qué creé Astro Doctor: una CLI, un plugin de ESLint, una extensión de editor, una acción de GitHub y habilidades para agentes que detectan pronto los antipatrones de Astro."
coverImage:
  alt: "Una lente de diagnóstico examina módulos de código conectados e informa sobre rendimiento, accesibilidad y estado del flujo de trabajo"
---

Astro ofrece una buena base: primero HTML estático y JavaScript solo cuando lo pides.

Esa base es una de las razones por las que me gusta construir sitios con mucho contenido usando Astro. También es la razón por la que sus bases de código necesitan protecciones distintas a las de una aplicación de React, Next.js o Vue. Los errores que perjudican un proyecto de Astro no suelen ser errores de sintaxis. Son pequeñas decisiones que van silenciosamente en contra del framework.

Un `client:load` que debería haber sido `client:visible`. Un `<img>` directo donde el componente `<Image>` de Astro habría protegido la distribución y el tamaño de salida. Un bloque `set:html` que parecía inofensivo durante una implementación rápida. Un atributo `lang` ausente. Algunas variables de entorno públicas con nombres que parecen demasiado secretos.

Nada de eso necesariamente impide compilar.

Aun así, importa.

Por eso construí [`@santi020k/astro-doctor`](https://github.com/santi020k/astro-doctor): un diagnóstico determinista para proyectos de Astro que detecta problemas de rendimiento, accesibilidad, seguridad y buenas prácticas antes de que lleguen a producción.

## El problema no es si el código compila

El compilador de Astro sabe decirte si tu proyecto puede compilar. Eso no equivale a decirte si todavía cumple las promesas arquitectónicas por las que elegiste Astro.

Astro facilita mantener el contenido estático. También facilita activar comportamiento del cliente cuando un componente lo necesita. Esa flexibilidad es parte de su propósito, pero permite que una base de código se desvíe de maneras válidas y, aun así, costosas.

El mayor riesgo no es un error espectacular. Es la acumulación.

- Unas pocas islas que se cargan de inmediato hacen más pesado el inicio.
- Unas pocas imágenes sin optimizar provocan desplazamientos de contenido y páginas más lentas.
- Unas pocas omisiones de accesibilidad se convierten en patrones que el equipo sigue repitiendo.
- Unas pocas salidas de emergencia arriesgadas se vuelven normales en lugar de excepcionales.

Quería una herramienta que hiciera visible ese deterioro mientras el cambio todavía fuera pequeño.

## Qué revisa Astro Doctor

Astro Doctor se basa en reglas específicas de Astro y auditorías del proyecto. La primera versión se concentra en las categorías que más me importan al revisar trabajo hecho con Astro.

Los controles de rendimiento buscan patrones como el uso excesivo de `client:load`, omitir el procesamiento de imágenes de Astro, no definir dimensiones para imágenes públicas o remotas y añadir scripts que bloquean la carga.

Los controles de accesibilidad detectan atributos `alt` y `lang` ausentes e islas exclusivas del cliente que no ofrecen contenido alternativo.

Para ver un caso práctico, consulta [cómo detectar y corregir la falta de texto alternativo en Astro](/es/blog/a-successful-astro-build-can-still-miss-alt-text/).

Las comprobaciones del código fuente cubren solo una parte de la experiencia. Mi [guía de accesibilidad con Playwright](/es/blog/playwright-accessibility-checks-that-teams-keep-running/) añade análisis de axe sobre páginas renderizadas, aserciones del foco de los diálogos y una lista de pruebas con teclado para comportamientos que necesitan un navegador.

Los controles de seguridad advierten sobre usos de `set:html` que parecen inseguros y nombres de variables de entorno `PUBLIC_` que podrían exponer secretos.

Los controles de buenas prácticas mantienen el código alineado con Astro: `class:list` en lugar de nombres de clase construidos como cadenas, `import.meta.env` en lugar de `process.env` y Content Collections en lugar de cargar contenido mediante glob sin tipos.

El objetivo no es sustituir la revisión de código. Es quitarle la parte repetitiva para que las personas dediquen más tiempo al comportamiento, la arquitectura y las decisiones de producto.

Esa es la misma razón por la que sigo invirtiendo en linting y controles de entrega en mis otras herramientas. Escribí más sobre esa filosofía en [Programar con IA es probabilístico. Tu proceso de entrega no debería serlo.](/es/blog/ai-coding-is-probabilistic-your-delivery-process-should-not-be/).

## La CLI ofrece la retroalimentación más rápida

La forma más sencilla de usar Astro Doctor es ejecutarlo directamente en un proyecto de Astro:

```bash
pnpm dlx @santi020k/astro-doctor@latest
```

Analiza el proyecto, muestra diagnósticos y devuelve una puntuación de salud de 0 a 100 acompañada de una calificación con letras.

La puntuación tiene una intención práctica. No pretende convertir la calidad del software en una cifra absoluta ficticia. Es una forma rápida de ver si el proyecto está limpio, se está deteriorando o necesita atención. En CI, la misma puntuación puede convertirse en un umbral cuando un equipo quiere proteger una referencia mínima.

La CLI también admite flujos específicos:

```bash
pnpm dlx @santi020k/astro-doctor@latest --preset ci
pnpm dlx @santi020k/astro-doctor@latest --category performance
pnpm dlx @santi020k/astro-doctor@latest --json ./astro-doctor-report.json
pnpm dlx @santi020k/astro-doctor@latest why src/pages/index.astro:12
```

El último comando importa más de lo que parece. Si una herramienta solo dice «está mal», las personas terminan buscando cómo evitarla. Quiero que Astro Doctor explique por qué importa cada hallazgo para que la regla enseñe buenas prácticas dentro de la base de código, además de bloquear errores.

## Los avisos del editor acercan la solución al error

También creé una extensión oficial para VS Code y Cursor.

La extensión lleva los mismos diagnósticos al editor, con avisos en vivo, explicaciones al pasar el cursor, correcciones rápidas, actualizaciones de estado y un panel lateral de salud. La meta es sencilla: detectar el problema antes de que se convierta en un commit, un pull request o un fallo de CI.

También hay un plugin de ESLint, [`@santi020k/eslint-plugin-astro-doctor`](https://www.npmjs.com/package/@santi020k/eslint-plugin-astro-doctor), para los equipos que ya usan ESLint como punto principal de integración con el editor y CI.

Esa separación es deliberada:

- Usa la extensión cuando quieras la mejor experiencia de edición local.
- Usa el plugin de ESLint cuando tu equipo ya estandarice sus controles mediante ESLint.
- Usa la CLI cuando quieras un análisis directo, un informe o un punto de entrada para automatizar.

Cada equipo tiene un flujo distinto. El motor de reglas debería seguir siendo el mismo.

## CI debe informar del problema nuevo, no de toda la deuda acumulada

La adopción es algo que me importa mucho en las herramientas nuevas de calidad.

Si una herramienta llega a una base de código madura y vuelca de inmediato todos los problemas históricos en un pull request, el equipo suele ignorarla. Es comprensible. Nadie quiere que un PR de una funcionalidad pequeña se convierta, por sorpresa, en un proyecto de limpieza.

La acción de GitHub de Astro Doctor parte de esa realidad. En los pull requests, puede analizar solo los archivos modificados relevantes y publicar un comentario de resumen persistente con los problemas introducidos por el cambio.

La configuración mínima es así:

```yaml
- uses: santi020k/astro-doctor@v1
```

A partir de ahí, los equipos pueden elegir si fallar por errores, advertencias o umbrales de puntuación.

Ese enfoque centrado primero en el diff hace útil la herramienta incluso cuando el proyecto arrastra deuda. Puedes empezar protegiendo el nivel actual y elevar el estándar con el tiempo.

## Las habilidades para agentes son parte del producto

Astro Doctor también incluye habilidades instalables para agentes de programación.

Puede sonar como una función secundaria, pero es una de las razones por las que quería que existiera esta herramienta.

Los asistentes de programación con IA ya forman parte del flujo de muchos equipos. Pueden escribir código útil rápidamente, pero también repiten patrones comunes de la web pública. En proyectos de Astro, eso puede significar tratarlo como un framework genérico de componentes, hidratar demasiado pronto, omitir las colecciones de contenido o pasar por alto pequeños detalles de accesibilidad.

Después de ejecutar un análisis, puedes instalar las instrucciones para agentes en el repositorio:

```bash
pnpm dlx @santi020k/astro-doctor@latest install
```

Las habilidades instaladas enseñan a los agentes los mismos estándares que Astro Doctor verifica. Eso cierra el ciclo: el analizador detecta problemas después de que aparecen y las habilidades reducen la frecuencia con que se generan desde el principio.

Para mí, ese es el rumbo de las herramientas de desarrollo. Además de analizar después, enseñar el flujo antes de hacer el cambio.

## Lo que tomé de react-doctor

Astro Doctor está inspirado directamente en [react-doctor](https://github.com/millionco/react-doctor), de Million Software.

La forma de ese proyecto me gustó desde el principio: diagnósticos deterministas específicos del framework, un flujo centrado en la CLI, una puntuación de salud, comentarios en CI y habilidades para agentes que convierten los hallazgos en orientación reutilizable.

Astro necesitaba una versión de esa idea con criterio específico de Astro.

Los errores son distintos. El modelo de rendimiento es distinto. Las fortalezas del framework son distintas. Por eso las reglas debían tratar los fallos reales de Astro, en lugar de una lista genérica de «buenas prácticas de frontend».

## En qué quiero convertirlo

La primera versión tiene un alcance deliberadamente acotado. Cubre los patrones de Astro que más quiero detectar en proyectos reales: decisiones de hidratación, gestión de imágenes, fundamentos de accesibilidad, uso de variables de entorno, HTML directo, carga de contenido y composición de clases propia del framework.

La siguiente versión útil no consiste simplemente en «más reglas». Consiste en mejores explicaciones, correcciones rápidas más completas, documentación más clara y caminos de adopción adecuados tanto para sitios personales pequeños como para equipos grandes.

Quiero que Astro Doctor sea la herramienta que ejecutes antes de preguntarte: «¿Hice, sin querer, que este sitio de Astro se pareciera menos a Astro?».

Esa es toda la idea.

Puedes probarlo hoy:

```bash
pnpm dlx @santi020k/astro-doctor@latest
```

El código fuente y la documentación están en el [repositorio de Astro Doctor en GitHub](https://github.com/santi020k/astro-doctor), y el sitio de documentación está en [doctor.santi020k.com](https://doctor.santi020k.com/).
