---
title: "Un comando de calidad para repositorios con varios lenguajes"
description: "Cómo construí una CLI nativa que coordina analizadores de Rust, Swift, Android, Kotlin, JavaScript y Astro sin perder las fortalezas de cada ecosistema."
coverImage:
  alt: "Ecosistemas de lenguajes diferentes ejecutan verificaciones especializadas mediante un núcleo de coordinación"
---

<!-- cspell:words Clippy detekt ktlint SARIF -->

«Ejecuta las verificaciones de calidad» parece una sola tarea hasta que un repositorio contiene más de un ecosistema.

Un servicio Rust quiere Cargo fmt y Clippy. Una aplicación iOS tiene SwiftLint y SwiftFormat. Android trae Gradle, Android Lint, detekt y ktlint. Un paquete TypeScript puede necesitar ESLint, Prettier y Knip. Un sitio Astro añade su propia comprobación de tipos.

Ninguna de esas herramientas es el problema. La mayoría hace muy bien su trabajo.

El problema está en la capa que las rodea: detectar qué pretende usar un repositorio, resolver el ejecutable correcto, ejecutar eficientemente las verificaciones independientes, conservar la semántica del monorepo y presentar un resultado único que sirva tanto localmente como en CI.

Construí [`quality`](https://quality.santi020k.com/) para aportar esa capa.

## Coordinar es mejor que reemplazar

Reimplementar los analizadores de cada ecosistema haría que `quality` fuera más amplio y menos confiable a la vez.

Clippy entiende Rust. Android Lint entiende los proyectos Android. ESLint entiende el ecosistema de reglas de JavaScript y TypeScript. Sus resultados nativos y modelos de configuración contienen años de trabajo especializado.

`quality` coordina esas herramientas en lugar de competir con ellas.

Sus adaptadores integrados cubren Cargo fmt, Clippy, SwiftLint, SwiftFormat, Android Lint, detekt, ktlint, ESLint, Astro Check, Prettier, CSpell, Knip y Actionlint. Se usan ejecutables locales al repositorio donde esa es la convención. Las opciones explícitas cubren a los equipos con rutas o envolturas personalizadas.

La CLI normaliza después la ejecución y los diagnósticos en una presentación legible para terminal, JSON, SARIF o comandos de flujos de GitHub.

Un comando no significa un analizador. Significa un contrato confiable alrededor de los analizadores en los que el repositorio ya confía.

## La inicialización debe detectar intención, no adivinar políticas

La presencia de un archivo `.ts` no significa que un proyecto haya elegido ESLint. Un archivo Swift no demuestra que el equipo quiera SwiftFormat.

`quality init` activa un analizador solo cuando el repositorio muestra esa intención mediante configuración, dependencias o scripts de paquetes. Puede anticipar la política generada con `--dry-run` y escribe un `quality.yml` explícito, en lugar de esconder la decisión en un comportamiento automático.

Los controles compuestos del repositorio necesitan especial cuidado.

Si un proyecto ya define `verify`, `validate`, `check` u otro script canónico, la inicialización puede conservarlo como tarea del repositorio. Así evita ejecutar un analizador directamente junto a un proceso de monorepo que ya se ocupa de la caché, la selección del workspace o los pasos de código generado. Un script de comprobación de tipos en la raíz recibe un tratamiento similar cuando no existe un control más amplio.

La herramienta detecta lo suficiente para ayudar y luego registra el resultado en una configuración que un responsable puede revisar.

## Las verificaciones de archivos modificados necesitan entender el ecosistema

Pasar todas las rutas modificadas a todas las herramientas no es una optimización segura.

Algunos analizadores aceptan archivos individuales. Otros solo entienden un proyecto. Un cambio en un archivo de reglas puede afectar archivos fuente que no se editaron. Una ruta eliminada no se puede pasar a un comando, pero puede seguir requiriendo una comprobación completa.

`quality check --changed` clasifica esos casos.

Las herramientas que admiten archivos reciben las rutas modificadas pertinentes. Los analizadores de proyectos siguen ejecutándose a escala de proyecto cuando cambia su ecosistema. Añadir, editar o eliminar configuraciones promueve el analizador correspondiente a una ejecución completa. Los archivos eliminados pueden activar una comprobación del proyecto sin convertirse en argumentos de comando inválidos.

El objetivo no es hacer el mínimo trabajo posible. Es omitir trabajo solo cuando el resultado restante siga significando algo.

## Las líneas base permiten una adopción gradual

Un repositorio consolidado puede contener cientos de hallazgos. Exigir resolverlos todos antes de que una herramienta pueda entrar en CI convierte la adopción en un proyecto de reescritura.

`quality baseline create` registra los diagnósticos actuales para que las comprobaciones futuras puedan suprimir los hallazgos coincidentes y fallar ante regresiones nuevas. Las huellas excluyen números de línea y columna, lo que evita que mover código de forma habitual genere ruido. La cantidad de duplicados sigue siendo significativa: copiar un problema existente todavía introduce un fallo.

Algunos fallos no pueden incluirse en una línea base de forma deliberada. La ausencia de un analizador requerido, una caída o un error de ejecución sin estructura son evidencia de que la comprobación no se ejecutó correctamente. Tratarlos como deuda conocida produciría una compilación falsamente verde.

Las líneas base son un puente desde la realidad actual hacia una aplicación más exigente de las reglas, no una forma de esconder infraestructura rota.

## CI debe conservar la misma evidencia

La acción de GitHub de `quality` instala un binario nativo versionado, verifica su suma de comprobación y ejecuta la misma configuración usada localmente.

Puede emitir anotaciones en línea en las solicitudes de cambios, escribir un resumen de la tarea y producir SARIF para el análisis de código de GitHub. Los reportes y los umbrales de fallo están separados, de modo que un equipo puede decidir qué hallazgos se muestran y cuáles bloquean la integración.

La CLI también puede generar un flujo de GitHub Actions a partir de un comando explícito de instalación. Deduce la preparación pertinente del gestor de paquetes y las herramientas desde los archivos del repositorio, pero se niega a inventar una fuente de instalación.

Esa última restricción refleja el diseño general: la automatización debería reducir decisiones repetitivas sin tomar decisiones invisibles en nombre del equipo.

## Los comandos van más allá de un repositorio

El trabajo de calidad suele convertirse en un problema de una cartera de proyectos.

Los comandos `repositories audit` y `repositories apply` inspeccionan una carpeta de proyectos, informan dónde falta una política y configuran los repositorios que la necesitan. `doctor` explica qué herramientas están activadas, instaladas o ausentes. `instructions` produce orientación del repositorio para agentes de programación, y el autocompletado nativo de la shell facilita el uso interactivo de la CLI.

Los adaptadores personalizados cubren herramientas que no pertenecen al catálogo integrado. Un equipo puede definir el comando, las extensiones, los archivos de configuración, el directorio de trabajo, el modo de archivos y el analizador de resultados, conservando el filtrado de archivos modificados, las líneas base, la salida normalizada y la concurrencia.

## Una política, muchas herramientas nativas

La abstracción útil no es un analizador universal. Es una forma consistente de responder cuatro preguntas:

1. ¿Qué pretende ejecutar este repositorio?
2. ¿Se pueden resolver esas herramientas de forma reproducible?
3. ¿Qué verificaciones son necesarias para este cambio?
4. ¿Cómo deberían afectar sus resultados a una persona, un agente o CI?

`quality` responde esas preguntas y deja el análisis específico de cada lenguaje donde corresponde.

Puedes [leer la documentación](https://quality.santi020k.com/), [ver el código fuente](https://github.com/santi020k/quality) o consultar el [caso de estudio resumido del portafolio](/es/portfolio/quality/).
