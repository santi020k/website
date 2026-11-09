---
title: "Imágenes Open Graph deterministas sin quedar atado a un diseño"
description: "Por qué separé los mecanismos de generación de imágenes sociales del diseño de cada proyecto y construí caché, limpieza segura, concurrencia con workers y comprobaciones de CI alrededor de ese límite."
coverImage:
  alt: "Un motor de generación determinista produce varias plantillas de tarjetas sociales propias de cada proyecto"
---

Las imágenes Open Graph ocupan un lugar incómodo en un proyecto web.

Son recursos visuales, pero normalmente se generan con código. Dependen del contenido, pero no deberían hacer que la compilación de cada página pague el costo de renderizarlas. Pertenecen a una marca, pero los mecanismos que las escriben, almacenan en caché y verifican son casi los mismos de un producto a otro.

Yo seguía reconstruyendo esos mecanismos.

Cada proyecto tenía su propio script para encontrar contenido, componer SVG, cargar fuentes, llamar a una biblioteca de imágenes, elegir rutas de salida y decidir si un archivo existente estaba al día. Los diseños de las tarjetas eran diferentes a propósito. Los errores del proceso se repetían.

Por eso construí [`@santi020k/og`](https://og.santi020k.com/), un generador de imágenes Open Graph independiente del renderizador para Astro, Next.js, Node.js sin framework, monorepos, datos de CMS, colecciones de Markdown y arreglos estáticos.

El paquete se encarga de los mecanismos de generación. El proyecto conserva su diseño.

## El límite importa más que la plantilla

Muchas herramientas de imágenes sociales empiezan por ofrecer una buena tarjeta predeterminada. Eso puede ser útil, pero acopla la capa reutilizable a suposiciones sobre títulos, descripciones, logotipos, espaciado e identidad visual.

Yo quería que el contrato reutilizable terminara antes.

Un proyecto le entrega a `@santi020k/og` una lista de tarjetas y un renderizador. Los datos pueden tener cualquier estructura serializable. El renderizador puede devolver SVG, usar la integración incluida con Sharp o Satori, o encargarse de todo el proceso de renderizado. Las fuentes, los logotipos, las plantillas, el descubrimiento de contenido y las reglas de marca permanecen en la aplicación.

El generador se encarga de todo lo que rodea a ese renderizador:

- validar y resolver las rutas de salida
- elegir un codificador según la extensión del archivo
- limitar el trabajo concurrente
- calcular huellas digitales del contenido y los archivos fuente
- omitir las tarjetas sin cambios
- eliminar los archivos de salida obsoletos que tiene registrados
- comprobar las imágenes versionadas en CI

Esto convierte al paquete en infraestructura, en lugar de una configuración visual predeterminada.

## El determinismo requiere más que calcular el hash del título

Una tarjeta puede cambiar aunque el título de su página no cambie.

La descripción puede cambiar. El renderizador puede usar otra fuente. Se puede reemplazar un logotipo. La plantilla puede mover un elemento o cambiar un color. Las dimensiones o el formato de salida pueden cambiar. Un módulo de worker puede contener nueva lógica de renderizado.

La huella digital predeterminada de la caché tiene en cuenta los datos de la tarjeta, las dimensiones, el nombre de salida, el contenido de la configuración y los archivos fuente declarados. El módulo de un renderizador que usa workers se incluye automáticamente. Los proyectos pueden declarar una sola vez fuentes compartidas, como plantillas, tipografías o logotipos, y cada tarjeta puede agregar sus propias dependencias.

Eso hace que el manifiesto sea útil para dos flujos de trabajo.

Cuando las imágenes sociales son artefactos de compilación, `santi-og generate` omite los archivos de salida cuya huella digital está al día. Cuando las imágenes están versionadas en el repositorio, `santi-og check` falla si falta un archivo de salida o está desactualizado, sin modificar archivos.

El segundo flujo es especialmente importante en los pull requests. CI puede verificar los artefactos generados sin dejar cambios pendientes en el checkout ni reparar silenciosamente la rama de un colaborador.

## La limpieza debe saber qué le pertenece

Los scripts de generación suelen implementar la limpieza revisando un directorio de salida y eliminando los archivos que no están en el conjunto actual de entradas.

Eso es arriesgado si el directorio contiene recursos que pertenecen a otro proceso o si un error de configuración apunta al lugar equivocado.

Con `clean: true`, `@santi020k/og` elimina únicamente las salidas obsoletas registradas en el manifiesto anterior. No se atribuye la propiedad de todos los archivos que puede ver. Las rutas de salida y el manifiesto quedan restringidos a la raíz del proyecto, lo que también impide recorrer rutas fuera del repositorio.

La regla es simple: la limpieza solo puede eliminar un artefacto cuando el generador tiene evidencia de que lo creó y lo registró.

## Las colecciones grandes necesitan paralelismo limitado

Renderizar una imagen a la vez deja capacidad de CPU sin usar. Renderizar todas las imágenes a la vez puede agotar la memoria, especialmente cuando intervienen bibliotecas nativas de imágenes y fuentes grandes.

El paquete admite concurrencia limitada para renderizadores comunes y un modelo de módulos worker para colecciones más grandes. Un proyecto exporta un renderizador desde un módulo separado y la CLI crea un grupo controlado de workers. Los datos de las tarjetas cruzan ese límite mediante clonación estructurada, por lo que el contrato permanece explícito.

La concurrencia automática es un valor predeterminado útil. Sigue siendo posible fijar un límite para entornos de CI con recursos restringidos.

Lo importante no es el rendimiento máximo. Es un rendimiento predecible que no vuelva poco confiable una compilación.

## El formato de salida forma parte de la ruta

La extensión de salida selecciona la codificación SVG, PNG, WebP, JPEG o AVIF.

Eso mantiene directa la definición de la tarjeta: `docs/getting-started.webp` describe tanto dónde debe ir el artefacto como la forma de codificarlo. El adaptador de Sharp puede recibir una función que produzca SVG y encargarse de los formatos ráster. El punto de entrada de Satori agrega Satori, salida compatible con Resvg, configuración de fuentes y una utilidad de plantillas similar a HTML.

Los proyectos que necesiten otro proceso pueden proporcionarlo mediante el mismo contrato de renderizador.

## Reutilizar el proceso, conservar la identidad

Las herramientas de desarrollo reutilizables más sólidas tienen una postura clara sobre lo que les corresponde.

`@santi020k/og` define criterios firmes para las huellas digitales deterministas, las rutas seguras, la limpieza de archivos registrados, el trabajo limitado y las comprobaciones de CI que no modifican archivos. Deliberadamente no impone cómo debe verse una tarjeta ni qué campos debe incluir un proyecto en ella.

Esa separación significa que puedo usar un proceso confiable en productos cuyas marcas nunca deberían parecer intercambiables.

Puedes [leer la documentación](https://og.santi020k.com/), [ver el código fuente](https://github.com/santi020k/og) o consultar el [caso de estudio breve del portafolio](/es/portfolio/og/).
