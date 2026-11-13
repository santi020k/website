---
title: "Cómo repartí 2973 pruebas de Playwright detrás de una sola puerta de calidad"
description: "Cómo reestructuré el CI de un sitio estático en Astro: una compilación de producción, seis fragmentos de pruebas de navegador, Lighthouse desde el mismo artefacto y una única comprobación que los resume."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

El CI de este sitio solía ser un solo job. Instalaba dependencias, ejecutaba las comprobaciones, compilaba el sitio y ejecutaba Playwright en un solo worker con un límite de 30 minutos.

Eso aguantó con 41 archivos de pruebas. El rediseño de la v5 llevó la suite a 239 archivos y 2973 pruebas, y un worker dentro de un solo límite de tiempo dejó de ser una opción.

Esta es la estructura a la que pasé y por qué está cada pieza.

## Compila una vez, prueba el artefacto

La compilación de producción es la parte lenta. Ensambla el sitio actual y cuatro versiones archivadas, y una ejecución completa tarda unos 22 minutos.

Por eso la compilación se ejecuta una vez y su resultado se convierte en un artefacto:

```yaml
- name: Upload the production build
  uses: actions/upload-artifact@v7
  with:
    name: production-build
    path: dist/
    if-no-files-found: error
    include-hidden-files: true
    retention-days: 1
```

Cada job posterior descarga `dist/` y prueba exactamente esos archivos. Ningún fragmento vuelve a compilar el sitio, y dos jobs no pueden probar resultados ligeramente distintos.

Las comprobaciones estáticas se ejecutan junto a la compilación, no antes. El lint, la comprobación de tipos, las pruebas unitarias y la auditoría de dependencias no necesitan `dist/`, así que no hay razón para que la compilación las espere.

## Seis fragmentos de la misma suite

El job de navegador es una matriz de seis, y cada uno ejecuta una porción de la suite:

```yaml
browser:
  name: Browser tests (${{ matrix.shard }}/6)
  needs: build
  strategy:
    fail-fast: false
    matrix:
      shard: [1, 2, 3, 4, 5, 6]
  steps:
    # check out, install, download the build
    - name: Run stable browser tests
      run: pnpm run test:e2e:ci:stable --shard=${{ matrix.shard }}/6
```

Aquí importan dos ajustes.

`fail-fast: false` deja que todos los fragmentos terminen. Con el valor predeterminado, el primer fallo cancela los otros cinco y corriges un problema por push. Prefiero verlos todos a la vez.

Cada fragmento sube su informe de Playwright y sus trazas solo cuando falla. Una ejecución en verde no guarda nada.

El navegador de Playwright se guarda en caché según el hash del lockfile. Cuando hay acierto de caché, el job instala solo las dependencias del sistema, lo cual es mucho más rápido que descargar Chromium seis veces.

## Los pull requests ejecutan Chromium, el calendario ejecuta el resto

Ejecutar cinco proyectos de navegador en cada pull request multiplicaría la matriz por cinco. La mayoría de los pull requests no lo necesitan.

Los pull requests ejecutan Chromium. Un workflow aparte ejecuta Firefox, WebKit y los dos proyectos móviles cada lunes y bajo demanda, también en seis fragmentos por proyecto. Antes de este cambio, esa matriz no tenía ninguna programación, lo que significaba que Firefox y WebKit se ejecutaban solo cuando me acordaba.

La ejecución semanal sigue encontrando cosas. Las diferencias entre motores son una clase de error distinta de las que introduce un pull request, y una cadencia semanal se ajusta a la frecuencia con que aparecen.

## Un job que responde «¿esto se puede fusionar?»

Dividir el CI crea un problema nuevo. Ahora un pull request informa muchas comprobaciones, y la lista cambia cada vez que renombro un job o cambio la cantidad de fragmentos.

El último job existe solo para resumir los demás:

```yaml
quality:
  name: Quality gate
  needs: [static, build, browser, lighthouse]
  if: always()
```

Lee cada resultado y falla a menos que todos los jobs hayan terminado bien o se hayan omitido a propósito. Las comprobaciones estáticas y la compilación siempre deben terminar bien. `if: always()` es la línea importante: sin ella, una dependencia fallida omite la puerta, y una comprobación omitida puede leerse como «no requerida».

Con este job, la protección de ramas necesita una sola comprobación, y su nombre nunca cambia.

## No todos los cambios necesitan la compilación

Corregir una errata en el README no debería gastar 22 minutos compilando archivos.

Un script pequeño clasifica las rutas modificadas antes de que empiece algo costoso. Un cambio que solo toca documentación ejecuta las comprobaciones de documentación. Todo lo demás, y cada rama de versión, recibe el pipeline completo. Los jobs de compilación y de navegador leen ese resultado y se omiten cuando así lo indica.

El script falla hacia lo seguro. Si no puede calcular la diferencia, elige la ejecución completa.

## Cosas pequeñas que sumaron

- **Clon parcial.** El repositorio carga mucho historial binario. `filter: blob:none` trae los commits sin descargar cada captura antigua.
- **Cancelar ejecuciones reemplazadas.** Un nuevo push al mismo pull request cancela la ejecución en curso.
- **Las ramas de versión cuentan.** Los pull requests hacia `release/**` ejecutan el mismo pipeline que los que van hacia `main`. El disparador anterior solo nombraba `main`, así que una rama de versión de larga vida no tenía CI propio.
- **Otra zona horaria en la compilación.** El job de compilación se ejecuta con `TZ: Asia/Tokyo` y las pruebas unitarias con mi zona local. Los errores de fechas aparecen cuando las dos no coinciden.

## Lo que quedó al descubierto al sacar las pruebas de un solo worker

Repartir las pruebas no hizo que la suite pasara. La hizo honesta.

Cuando la v5 se ejecutó por primera vez en este pipeline, 60 comprobaciones de navegador en 15 archivos de pruebas todavía describían iteraciones anteriores del diseño, y otras dos tenían condiciones de carrera. Hubo que alinearlas todas con lo que realmente se publicó antes de que la puerta quedara en verde.

## Lo que cambiaría después

Cada pull request sigue ejecutando las 2973 pruebas. Es exhaustivo y lento.

El siguiente paso es un nivel de pruebas de humo: un conjunto pequeño seleccionado según las rutas modificadas para los pull requests comunes, con la suite completa reservada para las ramas de versión y la ejecución semanal. La estructura anterior convierte eso en un cambio a un solo job.

Si partes de un único job de CI, hazlo en este orden: compila una vez y comparte el artefacto, reparte las pruebas de navegador y luego agrega la puerta. Cada paso es útil por sí solo, y la puerta es lo que te permite seguir cambiando los otros dos.
