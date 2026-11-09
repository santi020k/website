---
title: "Diseñar paquetes de ESLint que los equipos sí adopten"
description: "Qué separa a las configuraciones de ESLint que se extienden por una base de código de las que se eliminan después del primer sprint."
coverImage:
  alt: "Un núcleo compacto de lint conectado a módulos opcionales de frameworks, documentación y comprobaciones"
---

La mayoría de las configuraciones compartidas de ESLint fracasan de la misma manera.

Se distribuyen como un monolito. Activan todas las reglas que parecieron razonables durante la configuración. El primer equipo que las adopta dedica un sprint a corregir miles de infracciones antes de poder hacer cualquier otra cosa. Alguien desactiva una regla. Otra persona desactiva dos más. Al cabo de unos meses, la configuración es un cementerio de anulaciones en línea y el paquete termina en un fork o se abandona sin hacer ruido.

Ese modo de fallar no es un problema de ESLint. Es un problema de diseño del paquete.

## Las restricciones de diseño que realmente importan

Un paquete compartido de ESLint es una API pública. Las reglas que activa se convierten en un contrato con cada base de código que lo instala. Eso significa que aquí se aplican los mismos principios que hacen buena a una biblioteca: la estabilidad importa, la capacidad de composición importa y el costo de adoptarla tiene que ser menor que el de seguir usando lo que la gente ya tiene.

Estas son las restricciones a las que siempre vuelvo:

**Una base sin infracciones al instalar.** Adoptar el paquete no debería requerir un sprint de limpieza. Si un equipo ejecuta el linter por primera vez y ve cinco mil advertencias, lo más probable es que alguien agregue `// eslint-disable-next-line` hasta que todo quede en silencio y nunca vuelva a tocar la configuración. Una incorporación gradual —que empiece por las reglas que detectan errores reales y deje la aplicación del estilo como algo opcional— consigue una adopción real más rápido.

**Categorías de reglas explícitas.** Agrupar las reglas por propósito (corrección, estilo, importaciones, accesibilidad, específicas de cada framework) facilita que quienes las adoptan entiendan qué reciben y puedan desactivar categorías concretas cuando entren en conflicto con las convenciones de la base de código. Una lista plana de cuatrocientas reglas es opaca. Un conjunto de capas con nombre se puede explorar.

**Valores predeterminados sensatos, no maximalistas.** Cada regla que se distribuya activada debería tener una respuesta clara a «¿por qué querría esto un equipo competente?». Si la respuesta es «porque técnicamente es posible exigirlo», no es una razón suficiente. Las reglas adecuadas para algunos equipos, pero inadecuadas para otros, pertenecen a extensiones opcionales, no a la base.

## Capacidad de composición antes que exhaustividad

El cambio más útil que hice al construir [`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic) fue pasar de una sola configuración que intentaba hacerlo todo a un sistema de capas.

El paquete base se encarga de las reglas que se aplican en todas partes: corrección, seguridad básica de TypeScript y orden en las importaciones. Las reglas específicas de cada framework viven en paquetes separados que extienden la base. Las personalizaciones de cada equipo viven en el repositorio consumidor.

Esa estructura permite que un equipo de React y uno de API con Node compartan las mismas garantías fundamentales sin pelear por las reglas de un framework. También significa que actualizar una sola capa —por ejemplo, las reglas de TypeScript— no requiere volver a publicar toda la configuración y obligar a cada consumidor a probarlo todo de nuevo al mismo tiempo.

El formato de configuración plana introducido en ESLint 9 facilita mucho esto. Componer objetos de configuración con nombre es más claro que la antigua cadena de `extends`, y la estructura explícita reduce el comportamiento implícito que antes hacía difícil depurar las configuraciones compartidas.

## La severidad de una regla es una herramienta de comunicación

La mayoría de los equipos usa `error` y `warn` indistintamente, pero significan cosas distintas para las personas que reciben los resultados.

`error` debería significar: esto no debe llegar a producción. Algo está mal.

`warn` debería significar: esto merece atención, pero no bloquea.

Cuando una configuración compartida marca todo como `error`, los equipos terminan ignorándola: desactivan reglas en bloque o ejecutan el linter sin la opción `--max-warnings`, de modo que las advertencias se acumulan silenciosamente. Cuando solo los problemas reales de corrección son errores y las orientaciones de estilo son advertencias, la señal sigue siendo útil.

Esto es especialmente importante con las reglas nuevas. Agregar una comprobación primero como `warn`, observar la tasa de infracciones en bases de código reales y promoverla a `error` después de verificar que la tasa de falsos positivos sea baja es un proceso de lanzamiento mucho mejor que distribuirla como error bloqueante desde el primer día.

## Documentación al nivel de cada regla

La pregunta más común que genera una configuración compartida es: «¿por qué está activada esta regla?».

Si responderla requiere abrir una incidencia en GitHub o revisar un registro de cambios, la adopción se vuelve más lenta. Si la respuesta está en la propia configuración —mediante un comentario breve sobre las reglas que podrían sorprender—, los equipos pueden evaluar la decisión sin preguntar.

No todas las reglas necesitan justificación. Las que sí la necesitan son las que exigen decisiones poco evidentes: reglas que entran en conflicto con un patrón común, reglas que están desactivadas de forma predeterminada en ESLint por razones históricas o reglas que cubren casos límite que casi nadie conoce hasta encontrarse con ellos.

## Versionado y retirada gradual

Una configuración compartida que rompe los repositorios dependientes con aumentos de versión menor terminará fijada en una versión antigua que nunca se actualizará. Eso anula su propósito.

Este es el contrato de versionado que mantengo:

- **Parche**: correcciones de errores, actualizaciones de documentación y ajustes menores de configuración que no cambian la cantidad de infracciones.
- **Menor**: reglas nuevas agregadas como `warn` y extensiones opcionales nuevas.
- **Mayor**: reglas nuevas promovidas a `error`, cambios del comportamiento predeterminado y eliminación de reglas.

Comunicar con anticipación que algo dejará de estar soportado —agregando un `warn` antes de eliminar una regla o publicando una guía de migración antes de una versión mayor— mantiene claro el contrato y les da tiempo a los equipos para adaptarse.

## El círculo de adopción

Un paquete de ESLint bien diseñado genera su propio impulso de adopción. Los equipos que pueden instalarlo, obtener resultados sin errores en el código existente y activar reglas más estrictas de forma gradual sí lo usarán. Los que se encuentran con un muro de infracciones el primer día no lo harán.

Vale la pena diseñar explícitamente para ese círculo. El objetivo no es una configuración que imponga todas las reglas en las que crees desde la primera instalación. El objetivo es una configuración que se gane la confianza con una adopción sin fricciones y que acumule valor con el tiempo a medida que los equipos agregan más capas.

Si mantienes una configuración compartida para un equipo o una comunidad de código abierto, la [guía de migración que escribí para pasar de ESLint 8](/es/blog/migrate-eslint-8-or-less-to-eslint-9/) es un punto de partida útil para la nueva estructura de configuración plana, que facilita mucho la construcción de paquetes componibles.
