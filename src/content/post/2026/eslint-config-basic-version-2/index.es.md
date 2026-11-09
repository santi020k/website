---
title: "Novedades de @santi020k/eslint-config-basic v2.0"
description: "Explora @santi020k/eslint-config-basic v2: ESLint 10, instalación con un paquete, frameworks bajo demanda, monorepos, modo lite y verificaciones de CLI."
seoTitle: "ESLint Config Basic v2: ESLint 10 y frameworks"
coverImage:
  alt: "Un conjunto modular de herramientas de lint conecta módulos de frameworks, documentación, monorepos y verificaciones"
---

La versión 2.0.0 de [`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic) ya está disponible en npm.

Esta versión va más allá de ordenar unas funciones auxiliares. Cambia la estructura pública del paquete, adopta ESLint 10 como base, amplía la compatibilidad con frameworks, mejora el comportamiento en monorepos y añade mejores herramientas para personas y asistentes de programación con IA.

El objetivo sigue siendo el que describí en [Por qué trasladé mi biblioteca de ESLint a @santi020k/eslint-config-basic](/es/blog/why-i-moved-my-eslint-library-to-eslint-config-basic/): quiero valores predeterminados de lint exigentes que sean más fáciles de adoptar que una pila de plugins conectados a mano.

## La versión corta

Para la mayoría de los proyectos de aplicaciones, el punto de partida sigue siendo pequeño a propósito:

```sh
pnpm add -D @santi020k/eslint-config-basic
```

Después, crea un `eslint.config.js`:

```js
import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig()
```

Esa es la dirección principal de v2: un único paquete público para aplicaciones, una detección más profunda y alternativas explícitas cuando un proyecto las necesita.

La advertencia importante al actualizar es que v2 está orientada a ESLint 10. Si un proyecto todavía necesita ESLint 9, debe permanecer en la línea v1.x hasta que esté listo para actualizar ESLint.

## ESLint 10 es la nueva base

V2 es una versión mayor porque lleva la familia de paquetes a ESLint 10.

Esto importa por varias razones:

- ESLint 10 ofrece una base más limpia para el comportamiento moderno de la configuración plana.
- La búsqueda de configuración por archivo da más flexibilidad a los monorepos, porque los paquetes del workspace pueden tener sus propios archivos `eslint.config.*` cuando esa estructura resulta más adecuada.
- El seguimiento de referencias JSX mejora el análisis de ámbitos sin depender de soluciones antiguas mediante plugins.
- El paquete puede alinearse con la base recomendada más reciente de `@eslint/js`.

La base de ejecución compatible es Node.js `^20.19.0 || >=22.18.0`, y TypeScript sigue siendo compatible cuando se activa su análisis de lint.

Para los equipos que migran desde configuraciones más antiguas, mi [guía de migración de ESLint 8 a ESLint 9](/es/blog/migrate-eslint-8-or-less-to-eslint-9/) sigue siendo un contexto útil, aunque v2 ya apunta deliberadamente a ESLint 10.

## Un paquete para la mayoría de los proyectos

El mayor cambio público es que los proyectos de aplicaciones ya no necesitan instalar ni importar un conjunto de paquetes separados de frameworks para el uso habitual.

El repositorio sigue siendo modular por dentro. Hay paquetes de frameworks, paquetes de integraciones, documentación, entornos de prueba y tests. Pero el uso en las aplicaciones se centra en `@santi020k/eslint-config-basic`.

Los frameworks se pueden activar con valores booleanos sencillos:

```js
import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  frameworks: {
    next: true,
    react: true
  }
})
```

También se pueden activar mediante detección automática cuando las dependencias y la estructura del proyecto dejan clara la intención.

La cobertura de frameworks también es mayor. El paquete incluye React, Next.js, Astro, Vue, Nuxt, Svelte, Solid, Angular, NestJS, Hono, Expo, Preact, Qwik, Remix, React Router, TanStack Start, Lit, Vite y Slidev.

Next.js, Expo y Remix también incluyen automáticamente las reglas de React cuando se activan esas capas de framework.

## Carga bajo demanda y un paquete lite

Incluir compatibilidad con más frameworks plantea una preocupación evidente: el peso de la instalación y el arranque.

V2 lo aborda de dos maneras.

Primero, las configuraciones de frameworks se cargan bajo demanda. Si un proyecto no activa Svelte, Angular, Storybook, GraphQL, Cypress u otra área opcional, la configuración no debería importar esas herramientas de forma anticipada al iniciar el lint.

Segundo, ahora existe un paquete más ligero para los proyectos que quieren controlar las dependencias manualmente:

```sh
pnpm add -D @santi020k/eslint-config-lite eslint
```

El paquete completo `@santi020k/eslint-config-basic` sigue siendo la opción predeterminada recomendada porque mantiene unido el conjunto de plugins que se ha probado. El paquete lite es la alternativa para proyectos sensibles a las dependencias que prefieren instalar por su cuenta los paquetes de frameworks e integraciones.

La CLI también ayuda a tomar esa decisión:

```sh
npx @santi020k/eslint-config-basic doctor --lite-install
```

Ese comando puede mostrar la orden de instalación detectada para pasar un proyecto del paquete completo al paquete lite.

## Funciones opcionales más claras

V2 conserva la API basada en enums, pero también añade un mapa compacto `features` para las configuraciones opcionales.

```js
import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  features: {
    boundaries: true,
    'github-actions': true,
    playwright: true,
    prettier: true,
    tailwind: true,
    unicorn: false,
    zod: true
  }
})
```

Esto ofrece a los equipos una capa sencilla para activar o desactivar funciones sin importar cada enum en configuraciones pequeñas.

También se ha precisado el comportamiento de combinación. Con el valor predeterminado `optionMergeStrategy: 'merge'`, las opciones explícitas se unen a las detectadas y a las de los presets. Si quieres que un proyecto ignore la detección y use solo lo que le pasas manualmente, utiliza `optionMergeStrategy: 'replace'`, `autoFrameworks: false` o controles específicos de `detection`.

## Mejores presets y modo estricto

Los presets siguen disponibles para las estructuras habituales de proyectos:

```js
import { defineConfig, Preset } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  preset: Preset.App
})
```

Los presets actuales incluyen `Basic`, `Node`, `Browser`, `Worker`, `Library`, `App`, `CI`, `Monorepo` y `All`.

V2 también formaliza el modo estricto:

```js
import { defineConfig } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  strict: 'ci'
})
```

`strict: true` o `strict: 'ci'` convierte las advertencias en errores. `strict: 'pedantic'` va más allá con reglas adicionales de buenas prácticas para aspectos como el uso de la consola, los diálogos del navegador, la complejidad y el anidamiento.

## Los monorepos son más prácticos

Los monorepos ya eran una de las principales razones por las que quería que existiera este paquete. V2 mejora ese recorrido.

Todavía puedes delimitar las opciones con `projects`:

```js
import { defineConfig, Preset, Runtime } from '@santi020k/eslint-config-basic'

export default await defineConfig({
  preset: Preset.Monorepo,
  projects: {
    'apps/api': {
      preset: Preset.Node,
      runtime: Runtime.Node
    },
    'apps/web': {
      frameworks: { next: true },
      preset: Preset.App
    },
    'packages/core': {
      preset: Preset.Library,
      runtime: Runtime.Universal
    }
  }
})
```

Con ESLint 10 también hay otra alternativa válida: los paquetes pueden incluir sus propios archivos `eslint.config.*`, y ESLint puede resolverlos desde el directorio del archivo analizado. Eso permite a los equipos elegir entre una configuración central en la raíz con `projects` o configuraciones propias de cada paquete.

La opción `Preset.Monorepo` también puede detectar paquetes del workspace, lo que reduce el trabajo manual inicial.

## Mejores verificaciones de CLI

La CLI se ha vuelto más útil para explicar y auditar una configuración.

```sh
npx @santi020k/eslint-config-basic explain
npx @santi020k/eslint-config-basic inspect
npx @santi020k/eslint-config-basic doctor
```

`explain` muestra rápidamente lo que encontró la detección automática. `inspect` ofrece una vista más completa, incluidos detalles del gestor de paquetes, los proyectos del workspace y las funciones activas cuando se puede cargar la configuración. `doctor` comprueba la adopción: archivos de configuración ausentes, imports antiguos de frameworks de v1, versiones mayores duplicadas de ESLint, scripts de lint ausentes, paquetes del workspace que deberían usar `projects` y dependencias faltantes del paquete lite.

Las herramientas de migración y documentación siguen formando parte de la versión:

```sh
npx @santi020k/eslint-config-basic migrate
npx @santi020k/eslint-config-basic docs
```

`migrate` informa sobre los cambios de v1 a v2. `docs` genera un resumen `ESLINT_STANDARDS.md` dentro del proyecto para que el equipo pueda revisar los estándares sin leer toda la configuración.

## Estándares para agentes de IA

El generador de skills para agentes comenzó como un experimento, pero encaja con la dirección de esta versión.

```sh
npx @santi020k/eslint-config-basic generate-skill
```

Puede generar o actualizar archivos de estándares de ESLint para asistentes de programación con IA, incluidos Cursor, Claude Code, Copilot, Windsurf, Aider, Gemini, Cline, Roo Code, Kiro y flujos basados en `AGENTS.md`.

V2 añade opciones más útiles para el flujo de trabajo:

```sh
npx @santi020k/eslint-config-basic generate-skill --check
npx @santi020k/eslint-config-basic generate-skill --create
```

`--check` es el modo adecuado para CI que detecta estándares generados desactualizados. `--create` puede crear un `AGENTS.md` en la raíz cuando el proyecto todavía no tiene uno.

La configuración predeterminada ignora las carpetas de artefactos generados para IA, de modo que estos archivos de asistentes no se conviertan por accidente en código fuente que el linter intente controlar.

## Cambió la composición manual de frameworks

La mayoría de los proyectos deberían usar booleanos o detección automática, pero v2 también cambia las exportaciones manuales de frameworks.

Las exportaciones de frameworks ahora usan nombres simples y funciones de creación asíncronas:

```js
import { react } from '@santi020k/eslint-config-basic'

export default [
  ...(await react())
]
```

Los nombres anteriores, como `reactConfig`, `nextConfig`, `vueConfig` y `svelteConfig`, siguen como alias obsoletos, pero ya no son arrays de configuración. Si compones configuraciones de frameworks manualmente, debes llamarlas y usar `await`.

Ese es el tipo de cambio incompatible que corresponde a una versión mayor.

## Por qué importa esta versión

Para mí, v2 busca que sea más fácil convivir con un lint más exigente.

Los puntos más destacados de esta versión son:

- Un único paquete principal para la mayoría de los proyectos de aplicaciones
- ESLint 10 como base orientada al futuro
- Carga bajo demanda de frameworks e integraciones
- Un paquete lite para controlar las dependencias manualmente
- Mayor cobertura de frameworks, incluidos Nuxt, Lit, Preact, React Router, TanStack Start, Vite y Slidev
- Un mapa `features` más sencillo para configuraciones opcionales
- Mejores controles de combinación y detección
- Compatibilidad más práctica con monorepos
- Comandos de CLI para explicar, migrar, generar documentación y verificar la adopción
- Generación de estándares para agentes de IA con comprobaciones de desactualización adecuadas para CI
- Documentación actualizada en [`eslint.santi020k.com`](https://eslint.santi020k.com/)

No quiero una configuración de ESLint que solo se sienta potente después de un largo proceso de instalación. Quiero una que empiece de forma sencilla, explique lo que hace y siga dando a los equipos suficiente control cuando su repositorio se vuelva más complejo.

Para eso está diseñada v2.

Si quieres probar la versión estable, el paquete está disponible en npm:

[`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic)

La página del proyecto está aquí:

[Caso de estudio de `@santi020k/eslint-config-basic`](/es/portfolio/eslint-config-basic/)

Y la documentación completa está aquí:

[`eslint.santi020k.com`](https://eslint.santi020k.com/)
