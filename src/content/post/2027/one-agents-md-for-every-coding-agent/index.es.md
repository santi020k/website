---
title: "Un solo AGENTS.md para todos los agentes de programación"
description: "Dos archivos de instrucciones para dos agentes de programación se fueron separando en mi repositorio. Qué unifiqué, qué archivé y cómo mantengo las instrucciones lo bastante cortas para que se lean."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

Trabajo en este sitio con más de un agente de programación. Durante un tiempo el repositorio tuvo un archivo de instrucciones para cada uno.

Se suponía que decían lo mismo. No era así.

## Cómo se separan dos archivos

Nadie decide dejar que las instrucciones diverjan. Ocurre con una edición razonable a la vez.

Cuando comparé los dos archivos, a uno le faltaban la sección de la versión activa, la regla para los enlaces externos, la política de lint y las instrucciones de commits. Al otro le faltaban ocho skills. Un mismo commit había editado ambos archivos y aun así los dejó distintos.

Las skills tenían el mismo problema a mayor escala. Vivían en dos directorios con nombres casi iguales. Dos skills existían en disco y no aparecían en ninguna lista. Una describía patrones para un framework que este sitio no usa.

El efecto es sutil. Cada agente sigue correctamente su propio archivo. El trabajo cambia según la herramienta que abriste ese día, y le echas la culpa a la herramienta.

## Un archivo, un directorio de skills

Ahora el repositorio tiene un único `AGENTS.md` en la raíz y un único directorio `.agents/skills/`.

El archivo raíz es corto a propósito. Cubre:

- qué rama de versión está activa y sobre cuál debe basarse el trabajo
- el stack, en una línea por capa
- una tabla de archivos y directorios clave
- reglas de código y de estilos específicas de este proyecto
- los comandos que deben pasar antes de dar el trabajo por terminado
- una tabla de skills, cada una con una línea sobre cuándo usarla

Todo lo que necesita más de un párrafo vive en una skill o en `docs/`, y el archivo raíz lo enlaza.

## Instrucciones más cerca del trabajo

No todas las reglas pertenecen a la raíz. El directorio de artículos del blog tiene su propio `AGENTS.md` con reglas que solo importan ahí: dónde vive un artículo, cómo se ubican las traducciones junto al original y los requisitos de las ilustraciones de portada.

Un agente que edita un componente nunca necesita las reglas de las portadas. Un agente que agrega un artículo las necesita siempre. Poner las instrucciones junto a los archivos que gobiernan mantiene pequeño el archivo raíz y completas las reglas locales.

## Di qué fuente gana

La tabla de skills tiene dos partes.

La primera enumera las skills del proyecto: componentes, colecciones de contenido, pruebas, accesibilidad y demás. La segunda enumera referencias generales de diseño y auditoría que vinieron de otros lugares.

Una oración sobre la tabla fija el orden: las instrucciones del proyecto, su guía de estilo y los contratos públicos de la biblioteca de componentes tienen prioridad sobre las referencias generales.

Esa oración hace mucho. Los consejos de diseño de uso general están escritos para todos los proyectos, así que partes de ellos contradirán el tuyo. Sin un orden declarado, un agente elige lo último que leyó.

## Bloques que pertenecen a las herramientas

Dos secciones del archivo las escriben herramientas: la política de lint y de comprobación de tipos, y el flujo de commits. Cada una está entre comentarios marcadores.

```markdown
<!-- commitprompt:start -->
## Commit generation
…
<!-- commitprompt:end -->
```

La herramienta puede actualizar su bloque sin tocar el resto, y yo sé que no debo editar a mano dentro de los marcadores. Las skills instaladas desde otro repositorio se fijan en un archivo de bloqueo, así que una actualización es un cambio visible y no uno silencioso.

## Los documentos más cortos sí se leen

La misma auditoría cubrió los documentos que se les pide leer a los agentes.

La carpeta `docs/` había superado las 11 000 líneas. Solo un registro de preparación de una versión tenía 2663 líneas de evidencia fechada. Era valioso como registro y costoso como lectura obligatoria.

Moví los registros a una carpeta de archivo y escribí una lista de verificación de una página para reemplazarlos. El README bajó de 25,6 KB a 10,8 KB al separar la introducción para visitantes de los detalles internos para quienes contribuyen.

El contexto es un presupuesto. Cada línea que un agente lee antes de empezar es una línea que sopesa frente a tu solicitud real. Un archivo de historial largo hace que sus reglas sean más difíciles de encontrar, para las personas y para los modelos.

## Escribe las reglas como comprobaciones cuando puedas

Las instrucciones más confiables del archivo son las que un comando hace cumplir.

«Nunca uses manejadores de eventos en línea» está en el archivo. También es un fallo de compilación. «Ejecuta lint y la comprobación de tipos antes de terminar» está en el archivo, y los hooks los ejecutan de todos modos.

Cuando una regla puede ser una comprobación, la convierto en comprobación y dejo una línea en las instrucciones para explicar por qué. La instrucción ahorra un intento fallido. La comprobación atrapa las veces en que se ignora.

## Una revisión que puedes hacer hoy

Si tu repositorio tiene instrucciones para agentes de programación, prueba esto:

1. Enumera cada archivo de instrucciones y cada directorio de skills. Cuéntalos.
2. Compara los archivos que se supone que coinciden.
3. Busca skills que existen en disco y no están en la lista, y skills de la lista que ya no existen.
4. Mide los documentos que tus instrucciones les piden leer a los agentes.
5. Para cada regla, pregúntate si un comando podría hacerla cumplir.

La mayor parte de lo que encuentres será deriva, no desacuerdo. Elige un archivo como fuente, mueve las reglas locales junto al código que gobiernan y archiva lo que es historia.

El objetivo es modesto: el mismo repositorio debería producir el mismo tipo de trabajo, sin importar qué herramienta esté abierta.
