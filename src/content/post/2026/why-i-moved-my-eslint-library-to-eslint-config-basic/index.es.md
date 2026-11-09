---
title: "Por qué migré mi biblioteca de ESLint a @santi020k/eslint-config-basic"
description: "Por qué dejé obsoleto @santi020k/eslint-config-santi020k en favor de un monorepo componible, con paquetes más claros, mejor documentación y una DX más sólida."
coverImage:
  alt: "Una configuración monolítica envejecida se descompone en un sistema modular de paquetes acompañado de documentación"
---

La versión 1.0 de [`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic) ya está disponible y, con ella, dejo oficialmente atrás [`@santi020k/eslint-config-santi020k`](https://www.npmjs.com/package/@santi020k/eslint-config-santi020k).

No es un cambio de nombre cosmético.

Es un cambio estructural en cómo quiero que crezca la biblioteca, cómo quiero que los equipos la consuman y cómo quiero que la documentación respalde una adopción real.

El paquete anterior me ayudó a validar la idea central: unas buenas reglas de análisis estático por defecto reducen el ruido de las revisiones, detectan malos patrones pronto y hacen que la calidad sea más repetible entre proyectos. Sigo creyendo en eso. Pero la arquitectura del paquete ya no era la mejor forma para la dirección que estaba tomando el trabajo.

## Qué hizo bien el paquete anterior

[`@santi020k/eslint-config-santi020k`](https://www.npmjs.com/package/@santi020k/eslint-config-santi020k) nació de una necesidad práctica. Quería una configuración plana reutilizable que pudiera llevar entre proyectos JavaScript y TypeScript sin reconstruir las mismas reglas cada vez.

Ese paquete fue útil para mí y para los equipos a su alrededor:

- Convirtió una base personal de análisis estático en un paquete reutilizable
- Facilitó adoptar la configuración plana de ESLint 9
- Creó un lugar común para reglas, opciones y valores predeterminados pensados para automatizar
- Ayudó a estandarizar los comentarios de revisión que repetía manualmente

También me dio una señal clara de que el problema era real. Los equipos no solo necesitan más reglas. Necesitan una configuración más fácil de adoptar, entender y evolucionar sin complejidad accidental.

El paquete anterior fue un paso importante en esa dirección. Simplemente no era la forma definitiva.

Si quieres el contexto anterior de esa biblioteca, [Mejorar la calidad y la eficiencia del código con mi biblioteca de configuración de ESLint](/es/blog/boosting-code-quality-and-efficiency-with-my-eslint-configuration-library/) recoge la motivación detrás de la primera versión de la idea.

## Por qué no quería seguir estirando el paquete anterior

Llega un punto en el que un paquete puede seguir incorporando funciones y, al mismo tiempo, volverse más difícil de comprender.

Esa era la tensión que quería resolver.

La biblioteca anterior giraba alrededor de un solo paquete y una sola exportación principal. Podía servir para más de un escenario, pero la arquitectura todavía concentraba demasiadas responsabilidades en un lugar:

- Comportamiento específico de cada framework
- Integraciones opcionales
- Decisiones sobre la API pública
- Composición de la configuración
- Carga de documentación

Eso funciona durante un tiempo. Luego el paquete empieza a acumular más acoplamiento implícito del que quiero.

No quería que la biblioteca siguiera creciendo como un monolito más grande, con más opciones, más casos especiales y más comportamientos del tipo «confía en que esta opción hace lo correcto».

Quería límites más claros.

Quería un paquete base que los equipos de aplicaciones pudieran instalar rápido, pero también quería que la estructura interna reflejara el espacio real del problema:

- Reglas centrales y comportamiento de ejecución
- Paquetes específicos de cada framework
- Herramientas opcionales
- Documentación
- Entornos de prueba
- Pruebas

En ese punto, seguir evolucionando el paquete anterior se sentía menos honesto que reemplazarlo por una estructura mejor.

## Qué cambió en `@santi020k/eslint-config-basic`

La nueva biblioteca está construida como un monorepo, y eso importa.

En lugar de pedirle a un paquete que pretenda hacerlo todo, el repositorio separa las responsabilidades de forma deliberada:

- `@santi020k/eslint-config-basic` es el punto de entrada público principal
- `core` se ocupa de la configuración base consciente del entorno de ejecución y de los elementos internos compartidos
- `optionals` se ocupa de las integraciones de pruebas, formatos, herramientas y extensiones
- Los paquetes de framework son explícitos para React, Next.js, Astro, Vue, Svelte, Solid, Angular, NestJS, Expo, Qwik y Remix
- El repositorio también incluye documentación, entornos de prueba y pruebas para que los ejemplos se mantengan cerca del código que funciona

Esa estructura facilita mantener la biblioteca, pero lo más importante es que mejora el modelo mental de quienes la usan.

El mensaje público se vuelve más claro:

- Empieza con el paquete base
- Añade paquetes de framework solo cuando el proyecto los necesite
- Activa las herramientas opcionales de forma deliberada
- Mantén explícita la configuración final, incluso cuando la biblioteca pueda detectar automáticamente señales comunes

Esa es la claridad que quiero de las herramientas.

## Ahora la API es más deliberada

El paquete anterior usaba arreglos de configuración como `ConfigOption.React` y `ConfigOption.Ts`, con opciones adicionales encima.

Eso funcionaba, pero quería que la nueva API se correspondiera más directamente con cómo los equipos piensan realmente en su conjunto de tecnologías.

El nuevo paquete favorece un modelo más componible:

- Configuración base mediante `eslintConfig()`
- `typescript: true` cuando hay TypeScript
- Importaciones explícitas de frameworks cuando el proyecto las necesita
- Opciones agrupadas para bibliotecas, pruebas, formatos, herramientas y extensiones
- Modo estricto cuando el equipo quiere convertir las advertencias en errores

Este es el tipo de antes y después que tenía en mente.

Paquete anterior:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```js title="eslint.config.js"
import {
  ConfigOption,
  OptionalOption,
  eslintConfig
} from '@santi020k/eslint-config-santi020k'

export default [
  ...eslintConfig({
    config: [ConfigOption.React, ConfigOption.Ts],
    optionals: [OptionalOption.Tailwind, OptionalOption.Vitest]
  })
]
```

Paquete nuevo:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```js title="eslint.config.js"
import { eslintConfig, Library, Testing } from '@santi020k/eslint-config-basic'
import react from '@santi020k/eslint-config-react'

export default eslintConfig({
  typescript: true,
  frameworks: {
    react
  },
  libraries: [Library.Tailwind],
  testing: [Testing.Vitest]
})
```

Prefiero esta segunda forma porque las piezas son más evidentes. La organización de los paquetes y el modelo de configuración ahora se refuerzan entre sí, en vez de oponerse.

## La documentación ahora es parte del producto

Otra gran razón para el cambio es la documentación.

No quería que siguiera siendo algo secundario que las personas tuvieran que deducir del código fuente, de ejemplos en el README de npm o de suposiciones.

Por eso la nueva biblioteca incluye un sitio de documentación dedicado en [eslint.santi020k.com](https://eslint.santi020k.com/).

Quería que la documentación respondiera las preguntas reales de adopción:

- ¿Qué debo instalar primero?
- ¿Cuándo necesito un paquete de framework?
- ¿Cómo se combinan las integraciones opcionales?
- ¿Qué pertenece al paquete base y qué a `core` u `optionals`?
- ¿Cómo migro sin convertir la configuración del análisis estático en un proyecto aparte?

Poner la documentación en primer plano es parte del cambio de la biblioteca, no un extra independiente.

Si el objetivo es mejorar la experiencia de desarrollo, la documentación no es decoración. Es parte de la experiencia práctica de adopción.

## La DX y la estabilidad importan más que el ingenio

Una de las ideas del nuevo paquete es que un análisis estático sólido debería ser más fácil de adoptar, no más difícil.

Por eso `@santi020k/eslint-config-basic` se centra en decisiones prácticas de DX:

- Una API componible de configuración plana
- Mejor separación entre paquetes de framework y herramientas opcionales
- Detección automática de señales comunes del proyecto
- Una CLI integrada para generar configuraciones y actualizarlas
- Documentación, entornos de prueba y pruebas más ligados a la implementación

También quería que el posicionamiento del paquete reflejara lo que está llegando a ser: un conjunto de herramientas para equipos reales de JavaScript y TypeScript, no solo una configuración personal con una lista creciente de excepciones.

Si has leído [Migrar de ESLint 8 o anterior a ESLint 9](/es/blog/migrate-eslint-8-or-less-to-eslint-9/), esta es la misma filosofía llevada más lejos. No quiero que los equipos hereden comportamientos de análisis estático por accidente. Quiero que los compongan a propósito.

## Por qué el paquete anterior está obsoleto

Prefiero decirlo directamente en lugar de dejar a la gente silenciosamente en un camino antiguo.

El paquete anterior está obsoleto porque no quiero que nuevas adopciones se construyan sobre una arquitectura de biblioteca de la que me estoy alejando de forma intencional.

Declararlo obsoleto no rechaza el trabajo anterior. Es una forma de proteger a quienes lo usan de la ambigüedad.

Si creo que el mejor camino es:

- Límites de paquetes más claros
- Una experiencia de documentación más sólida
- Mejor composición
- Más espacio para crecer en frameworks
- Una API pública más fácil de mantener

entonces debo decirlo con claridad y hacer evidente la ruta de migración.

Eso es lo que estoy haciendo con `@santi020k/eslint-config-basic`.

## Quién debería migrar ahora

Si ya usas `@santi020k/eslint-config-santi020k`, recomiendo planificar la migración.

Debería interesarte especialmente si:

- Quieres una API más limpia a largo plazo
- Tu equipo trabaja con más de un framework o tipo de aplicación
- Quieres documentación y ejemplos más fáciles de seguir
- Prefieres paquetes explícitos de framework frente a un solo paquete que se expande internamente
- Estás estandarizando flujos modernos de configuración plana en varios repositorios

Si empiezas desde cero, no comenzaría con el paquete obsoleto. Iría directamente a [`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic) y usaría la documentación de [eslint.santi020k.com](https://eslint.santi020k.com/) como guía canónica.

## En qué quiero que se convierta esta biblioteca

El objetivo no es simplemente «más funciones».

El objetivo es un ecosistema de ESLint más confiable alrededor de un paquete base claro.

Quiero que esta biblioteca sea el tipo de herramienta que me gusta adoptar:

- Explícita
- Componible
- Documentada
- Capaz de crecer con conjuntos de tecnologías reales
- Con criterios lo bastante definidos para reducir el ruido
- Lo bastante flexible para seguir siendo útil fuera de un solo tipo de proyecto

Por eso ocurrió este cambio.

El paquete anterior demostró la idea. El nuevo le da la arquitectura que necesitaba.

## Conclusión

Migré de `@santi020k/eslint-config-santi020k` a `@santi020k/eslint-config-basic` porque quería que la biblioteca creciera con más honestidad.

No solo más reglas. No solo más frameworks. Una estructura mejor.

La versión 1.0 marca el punto en el que quiero que la propuesta de los paquetes sea más sencilla para las personas usuarias y más sólida para el mantenimiento a largo plazo. Si ya usas el paquete anterior, migra cuando puedas. Si estás evaluando la biblioteca hoy, empieza con el nuevo.

Las mejores herramientas no solo hacen cumplir estándares. Hacen que la configuración correcta sea más fácil de entender y conservar.
