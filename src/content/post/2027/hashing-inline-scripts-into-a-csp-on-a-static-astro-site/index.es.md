---
title: "Cómo incluir hashes de scripts en línea en una CSP para un sitio estático de Astro"
description: "Un paso posterior a la compilación que lee cada página generada, calcula el hash de sus scripts en línea y agrega una Content-Security-Policy más estricta sin 'unsafe-inline', con los límites que aún quedan."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

Durante mucho tiempo, la Content-Security-Policy de este sitio tuvo `'unsafe-inline'` en `script-src`. Es la debilidad más común de una CSP: la política enumera orígenes de confianza y luego permite cualquier script en línea de todos modos.

Quitarlo de un sitio estático suena sencillo. El sitio tiene pocos scripts en línea, y todos son míos.

Hizo falta un paso posterior a la compilación, un analizador de HTML y una concesión sobre la que quiero ser claro.

## Por qué no usar nonces

Un nonce es un valor aleatorio generado por respuesta. El servidor lo pone en el encabezado y en cada etiqueta de script.

Un sitio estático no tiene un paso de servidor por respuesta. Cada visitante recibe el mismo archivo HTML desde la CDN, así que un nonce sería una constante, y un nonce constante no protege nada.

Los hashes encajan con una salida estática. La política enumera el hash SHA-256 de cada script en línea permitido, y el navegador ejecuta un script en línea solo cuando su contenido coincide con alguno.

Astro tiene una función de CSP integrada. Cuando hice este trabajo no era compatible con el enrutador del lado del cliente que usa este sitio, así que escribí el paso yo mismo.

## Lee la página como lo hace un navegador

Después de `astro build`, un script recorre cada archivo HTML generado y reúne los scripts en línea.

La primera versión de una idea así suele ser una expresión regular. Eso falla con un `<script>` mencionado dentro de un comentario, dentro de un bloque de estilos o en marcado mal formado. Por eso el script analiza cada documento con `parse5`, que sigue las reglas de análisis de HTML, e inspecciona el árbol resultante.

Algunos detalles deciden si los hashes coinciden:

- **Saltos de línea.** El navegador calcula el hash del texto del script después de que el analizador normaliza los finales de línea, así que la compilación hace lo mismo.
- **Tipos de script.** Los scripts clásicos, los módulos, los import maps y las reglas de especulación se ejecutan y necesitan un hash. JSON-LD y otros bloques de datos no.
- **Scripts externos.** Un script con `src` queda cubierto por la lista de orígenes.
- **Plantillas.** El contenido de `<template>` se incluye, porque un script puede clonarlo en la página más adelante.

```js
export const hashScript = source => {
  const digest = createHash('sha256').update(source.replace(/\r\n?/gu, '\n')).digest('base64')

  return `'sha256-${digest}'`
}
```

## Lo que ningún hash puede permitir

Los manejadores de eventos en línea como `onclick="…"` y las URL `javascript:` no pueden permitirse mediante hash sin `'unsafe-hashes'`, que reabriría parte del agujero.

Por eso la compilación falla cuando encuentra uno. La comprobación normaliza las URL como lo hace un navegador, porque `java&#9;script:` con una tabulación codificada también se ejecuta.

Esto convirtió una convención en una regla. «No usamos manejadores en línea» es fácil de decir, y ahora la compilación lo exige.

## La concesión: dos políticas

Este sitio también sirve cuatro versiones archivadas bajo `/v1/` a `/v4/`. Esos diseños anteriores usan manejadores de eventos en línea, y conservo su marcado como estaba. Necesitan `'unsafe-inline'`. El sitio actual no.

Mi primera versión dejó intacto el encabezado de respuesta, con `'unsafe-inline'` para todos, y agregó la política estricta a las páginas actuales como etiqueta meta:

```html
<meta http-equiv="Content-Security-Policy"
  content="script-src 'self' 'wasm-unsafe-eval' https://giscus.app 'sha256-…' 'sha256-…'">
```

Los navegadores aplican todas las políticas que reciben, y un script debe cumplirlas todas. Así, en una página actual solo se ejecutaban los scripts en línea con hash, aunque el encabezado por sí solo habría permitido más.

Funcionaba, y tenía un punto débil. La parte estricta dependía de que la etiqueta meta estuviera presente en la página, y una política en meta no puede llevar todas las directivas que admite un encabezado.

La segunda versión lleva la política estricta también al encabezado. La compilación toma los orígenes de scripts del encabezado fuente, quita `'unsafe-inline'`, agrega los hashes y escribe ese `script-src` en dos lugares: la etiqueta meta y la regla de encabezado para todas las rutas. Después, cada archivo recibe una regla propia que retira la política estricta y restaura la original:

```text
/v4/*
  ! Content-Security-Policy
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' …
```

Eso trae dos límites. Cloudflare ignora una línea de `_headers` de más de 2000 caracteres, y cada hash suma unos cincuenta. La compilación falla antes de que la línea llegue a ese tamaño, lo cual es mejor que un despliegue sin ninguna política. Y los archivos siguen funcionando con la política más permisiva. Ese es el precio de no tocar su marcado.

La etiqueta meta se queda, porque el enrutador la usa, como explica la siguiente sección.

## La navegación del lado del cliente cambia el diseño

Con el enrutador del lado del cliente de Astro, una navegación inserta la página siguiente en el documento que ya está abierto. La política de la primera página sigue vigente durante el resto de la sesión.

Por eso todas las páginas actuales llevan la misma lista: los hashes de todos los scripts en línea de la compilación. Una lista por página bloquearía un script en cuanto navegaras a una página cuyos scripts la primera no conocía.

Eso plantea una segunda pregunta. ¿Qué pasa cuando la página siguiente tiene una política distinta, por ejemplo después de un nuevo despliegue o cuando el enlace lleva a un archivo? El sitio compara ambas antes del intercambio y, cuando difieren, carga el destino como un documento completo.

Queda un efecto secundario conocido. Después de un intercambio, el enrutador agrega un módulo `data:` vacío para esperar a los scripts de módulo en línea. Ninguna de las políticas permite scripts `data:`, así que la consola informa una carga bloqueada en algunas páginas. El módulo está vacío y el enrutador trata el error como una carga, así que nada se rompe. Es ruido, y prefiero documentarlo antes que debilitar la política.

## Strict-Transport-Security, agregado con cuidado

El mismo cambio agregó `Strict-Transport-Security` con un `max-age` de un año.

Al principio dejé fuera `includeSubDomains` y `preload`. Ambos son compromisos para todos los subdominios, y preload es difícil de deshacer.

Entraron después, cuando comprobé que cada host de proyecto bajo el dominio redirige de HTTP a HTTPS. El encabezado solo hace que el dominio sea elegible para las listas de precarga de los navegadores. Enviarlo es un paso aparte, y a partir de ahí cada subdominio nuevo tiene que servir HTTPS desde su primer día.

## Lo que sigue pendiente

- `style-src` todavía permite `'unsafe-inline'`.
- `img-src` permite cualquier origen HTTPS.
- No hay informes de infracciones, así que un script bloqueado en producción es invisible para mí.

Una CSP rara vez está terminada. Lo que cambió es el comportamiento predeterminado: un script en línea inyectado ya no se ejecuta en las páginas actuales, y un nuevo manejador en línea no puede llegar a producción sin que falle la compilación.

Si mantienes un sitio estático, empieza por contar. Enumera tus scripts en línea y tus manejadores en línea. Si son pocos, calcular sus hashes durante la compilación es trabajo de un fin de semana, y la mayor parte de ese tiempo se va en los detalles del analizador descritos arriba.
