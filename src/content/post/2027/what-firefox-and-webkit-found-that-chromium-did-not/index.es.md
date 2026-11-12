---
title: "Lo que Firefox y WebKit encontraron y Chromium no"
description: "Defectos reales y supuestos erróneos en las pruebas que aparecieron cuando una suite de Playwright que solo usaba Chromium se ejecutó por primera vez en Firefox, WebKit y navegadores móviles."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

Durante la mayor parte del rediseño de la v5, las pruebas de navegador de este sitio se ejecutaron en Chromium. La configuración incluía Firefox, WebKit y dos proyectos móviles, y nada los ejecutaba de forma programada.

Antes de la publicación ejecuté toda la matriz: 2973 pruebas en cada uno de los cinco proyectos de navegador.

No pasó. Los fallos se dividieron en dos grupos, y esa división es la parte útil.

## Grupo uno: defectos reales

Estos eran errores del sitio. Alguien que lo visitara podía encontrarlos.

### Firefox descargaba imágenes que debían esperar

El visor de imágenes mantiene su imagen grande dentro de un `<template>` hasta que alguien lo abre. Una plantilla es inerte, así que su contenido no debería cargarse.

Firefox puede descargar de forma especulativa el `src` de una imagen incluso ahí, de modo que una página con una galería podía descargar imágenes grandes que nadie había pedido.

La solución fue dejar de poner un `src` real en la plantilla. Ahora el visor guarda la dirección en un atributo de datos y crea el elemento de imagen cuando se abre.

### Safari dibujaba un fotograma sin su composición

Algunas rutas tienen su propia hoja de estilos. Durante una navegación del lado del cliente, el enrutador agrega a la página el enlace de esa hoja de estilos junto con el contenido nuevo.

Safari aplica una hoja de estilos enlazada durante el intercambio solo después de que la nueva página se ha pintado. Durante un fotograma, las páginas Sobre mí, Trabajo e Historia aparecían sin su composición.

Ahora, antes del intercambio, el enrutador copia cada hoja de estilos que agrega la siguiente página en un elemento `<style>` del documento entrante. Los estilos en línea se aplican junto con el intercambio. Los archivos ya estaban precargados, así que esto no cuesta ninguna solicitud adicional.

### Una redirección del service worker detenía a Firefox

El service worker obtiene las páginas y le entrega la respuesta al navegador. Cuando una solicitud redirige, por ejemplo desde una ruta sin barra final, el worker recibe una respuesta que ya siguió la redirección.

Firefox puede quedarse detenido cuando un worker responde a una navegación de página con ese tipo de respuesta. En ese caso, ahora el worker se hace a un lado y deja que el navegador siga por su cuenta la redirección del mismo origen.

### Menús y títulos estrechos

También aparecieron dos problemas menores: filas de menú que solo se veían en parte cuando recibían el foco del teclado, y títulos largos y nombres de código que no cabían en pantallas estrechas. Ambos eran reales, y ninguno se manifestaba en un viewport de escritorio en Chromium.

## Grupo dos: pruebas que asumían Chromium de escritorio

El segundo grupo fue más grande. El sitio estaba bien y la prueba estaba mal.

- **Tab no llega a los enlaces en Safari de forma predeterminada.** En macOS, Safari usa Opción-Tab para incluir enlaces y botones en la navegación con teclado. Una prueba que presiona Tab y espera el foco en un enlace falla por una razón que no tiene nada que ver con la página.
- **WebKit no enfoca un botón cuando haces clic en él.** Una prueba que hace clic y luego presiona una tecla necesita un punto de partida explícito para el recorrido con teclado.
- **Las unidades de layout son fraccionarias.** Los motores redondean de forma distinta los tamaños calculados. Afirmar que dos cajas se alinean al píxel exacto pasa en un motor y falla por 1/64 de píxel en otro.
- **Desplazarse con una tecla requiere mantenerla presionada de verdad.** Una pulsación instantánea puede no mover en absoluto una página en WebKit.
- **Las pantallas táctiles no tienen hover ni rueda del mouse.** Una prueba que se desplaza con la rueda necesita un contexto de escritorio.
- **Las opciones de lanzamiento son específicas de cada motor.** WebKit se niega a iniciar cuando recibe una opción que no conoce, así que ahora las opciones de Chromium van solo a los proyectos de Chromium. Antes de esa corrección, el proyecto de WebKit ni siquiera podía iniciar.

Ninguno de estos es un error del navegador. Son comportamientos documentados de la plataforma que una suite de un solo motor nunca tiene que aprender.

## Cómo distinguí los dos grupos

Para cada fallo hice una pregunta: ¿lo notaría una persona que usa este navegador?

Si la respuesta es sí, cambia el sitio. Si es no, cambia la prueba, y la nueva versión describe el comportamiento que percibe el usuario y no el mecanismo. «El enlace es accesible con el teclado» sobrevive entre motores. «El foco llega a este elemento después de presionar Tab una vez» no.

Cambiar una prueba para que pase es incómodo. El comentario junto a cada cambio indica qué comportamiento de la plataforma contempla, para que quien lo lea después pueda distinguir una adaptación de una afirmación debilitada.

## El resultado

Después de las correcciones, Chromium, Firefox y Mobile Chrome pasaron las 2973 pruebas. WebKit y Mobile Safari pasaron con dos comprobaciones reintentadas cada uno, ambas en la misma navegación de lectura compartida, en un viewport ancho con texto ampliado. Las trato como inestables y siguen en mi lista.

Ahora la matriz se ejecuta cada semana. Es demasiado lenta para cada pull request, y las diferencias entre motores no aparecen con tanta frecuencia.

## Lo que me llevo

Una ejecución en varios navegadores es dos auditorías a la vez. Una audita el sitio. La otra audita cuánto de tu suite de pruebas describe tu navegador y no tu producto.

Si tu suite solo se ha ejecutado en Chromium, ejecútala una vez en otro motor antes de necesitarlo. Espera que la primera ejecución falle, clasifica los fallos con la pregunta anterior y programa la matriz para que nunca pase tanto tiempo sin ejecutarse.
