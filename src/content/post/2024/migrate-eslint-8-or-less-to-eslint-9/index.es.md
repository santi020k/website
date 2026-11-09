---
title: "Migrar de ESLint 8 o anterior a ESLint 9"
description: "Guía práctica para pasar de ESLint 8 a flat config en ESLint 9, con una configuración más clara para proyectos React, Next.js y TypeScript."
seoTitle: "Migración de ESLint 8 a 9: guía de flat config"
coverImage:
  alt: "Capas de configuración enredadas atraviesan controles de migración y se convierten en una configuración plana y ordenada"
---

Para migrar de ESLint 8 a 9, traslada los ajustes de `.eslintrc` a una configuración plana en `eslint.config.js`.
Importa los complementos y analizadores, mueve las exclusiones a la configuración y compara las reglas efectivas
en varios archivos representativos antes de retirar la configuración anterior.

Consulta las [notas de migración de ESLint 9](https://eslint.org/docs/latest/use/migrate-to-9.0.0) para revisar
la versión de Node y la compatibilidad de los complementos. Si ESLint no encuentra `eslint.config.js`, comprueba
que el comando se ejecute desde el proyecto con la nueva configuración y que CI use esa misma configuración.

[Lee el artículo anterior: autenticación y autorización en aplicaciones Next.js con Supabase](/es/blog/authentication-and-authorization-in-next-js-applications-with-supabase/)

En [Una configuración de Next.js con TypeScript, Standard, Vitest y ESLint](https://medium.com/@santi020k/building-the-best-next-js-typescript-standard-vitest-eslint-configuration-f6d91d6346e7) compartí la base de ESLint que me gustaba usar en proyectos frontend. Funcionaba bien en ESLint 8, pero ESLint 9 cambió algo importante: flat config dejó de ser «la forma nueva» y se convirtió en la predeterminada.

Si todavía usas `.eslintrc`, esta migración es una buena oportunidad para simplificar la configuración en lugar de arrastrar lo antiguo. No me gusta dejar decisiones importantes de calidad escondidas en valores predeterminados del editor, convenciones débiles o configuraciones de complementos a medio mantener. Cuanto más grande es el equipo, más costosas se vuelven esas decisiones invisibles.

[Artículo relacionado: una configuración de Next.js con TypeScript, Standard, Vitest y ESLint](https://medium.com/@santi020k/building-the-best-next-js-typescript-standard-vitest-eslint-configuration-f6d91d6346e7)

[Repositorio de GitHub](https://github.com/santi020k/eslint-config-basic)

## Por qué importa esta migración

ESLint 9 no es solo un cambio de número de versión.

- Flat config pasa a ser el sistema de configuración predeterminado.
- Las configuraciones compartidas se importan como módulos en lugar de referenciarse con cadenas.
- Los patrones de exclusión pasan a la configuración en lugar de vivir en `.eslintignore`.
- Se eliminaron algunos formateadores del núcleo.
- Se dejó de admitir versiones antiguas de Node.

Creo que es una buena dirección. En proyectos frontend, demasiados valores predeterminados generan confusión. Una regla viene de un complemento, otra del editor y otra de una configuración oculta; después de unos meses, nadie recuerda por qué el código se comporta así.

Con flat config, la configuración se vuelve más explícita. Eso es exactamente lo que quiero en un proyecto serio.

![Diagrama que compara una configuración eslintrc por capas con una configuración plana más explícita](./fig-1.webp "De las capas a flat config.")

## 1. Confirma el entorno de ejecución antes de tocar la configuración

Antes de cambiar una regla o un nombre de archivo, verifica la versión de Node utilizada por:

- Tu terminal local
- CI
- La integración de ESLint de tu editor

ESLint 9 deja de admitir entornos antiguos, así que esto es lo primero que compruebo. Si el equipo sigue atado a una versión vieja de Node en CI o dentro de VS Code, la CLI puede funcionar en un equipo y fallar en otro.

Como mínimo, actualiza primero el paquete:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```json title="package.json"
{
  "devDependencies": {
    "eslint": "^9.0.0"
  }
}
```

Después vuelve a instalar:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```bash title="terminal"
pnpm install
```

Si haces la migración hoy, esta misma estructura de flat config también facilita mucho el paso posterior a ESLint 10.

## 2. Genera la primera versión, pero no te quedes ahí

El migrador oficial de ESLint es la forma más rápida de poner en marcha un proyecto existente:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```bash title="terminal"
npx @eslint/migrate-config .eslintrc.cjs
```

Si tu configuración anterior está en JSON o YAML, usa ese archivo. Lo útil de este comando no es que produzca un resultado perfecto, sino que elimina el trabajo repetitivo de conversión para que puedas concentrarte en lo que realmente requiere criterio.

Esto ayuda especialmente cuando el proyecto tiene:

- Varias sobrescrituras de configuración
- Configuraciones compartidas antiguas
- Un archivo `.eslintignore`
- Complementos que todavía no se han actualizado por completo

El archivo generado suele ser un puente, no la versión definitiva. Conviene tenerlo claro desde el principio.

## 3. Reemplaza las cadenas antiguas por configuraciones importadas

Uno de los mayores cambios de perspectiva en ESLint 9 es que la configuración consiste simplemente en módulos JavaScript. Eso significa que ya no quiero esto:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title=".eslintrc.cjs"
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended'
  ],
  env: {
    browser: true,
    node: true
  },
  ignorePatterns: ['dist', 'coverage']
}
```

Prefiero algo más parecido a esto:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.mjs"
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['dist/**', 'coverage/**', '**/.*']
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  }
])
```

Aquí hay varias diferencias importantes:

- `eslint:recommended` ahora se importa desde `@eslint/js`.
- La configuración de TypeScript se importa directamente en lugar de referenciarse mediante `extends`.
- `env` se convierte en variables globales explícitas dentro de `languageOptions`.
- Los patrones de `.eslintignore` pasan a `ignores`.

Sí, es más extenso. También es mucho más claro.

## 4. Usa `FlatCompat` solo como capa de transición

No todas las dependencias estuvieron listas para flat config al mismo tiempo. En esos casos, `FlatCompat` resulta útil:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.mjs"
import { FlatCompat } from '@eslint/eslintrc'
import { defineConfig } from 'eslint/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname
})

export default defineConfig([
  ...compat.extends('eslint-config-my-config')
])
```

Lo veo como un puente temporal, no como la arquitectura definitiva.

Si una configuración todavía depende de `FlatCompat`, intento responder dos preguntas:

1. ¿Puedo actualizar la dependencia a una versión compatible con flat config?
2. Si no, ¿puedo reemplazarla por algo más explícito y fácil de mantener?

Las capas de compatibilidad son útiles, pero cada una representa trabajo de limpieza futuro.

## 5. Traslada las exclusiones a la configuración de forma deliberada

Es fácil pasar por alto esta parte si migras demasiado rápido.

Con flat config, ya no quiero gestionar las exclusiones del análisis en `.eslintignore`. Prefiero que esas reglas estén junto al resto de la configuración, para ver todo el comportamiento en un solo lugar.

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.mjs"
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.astro/**',
      '**/.*'
    ]
  }
])
```

Aquí importan dos detalles:

- `temp.js` en `.eslintignore` normalmente se convierte en `**/temp.js` en flat config.
- Los archivos cuyo nombre empieza por punto no se ignoran por defecto; si quieres ese comportamiento, debes declararlo.

Es otra razón por la que me gusta el nuevo formato. Las exclusiones ocultas son una de esas pequeñas cosas que generan mucha confusión en equipos grandes.

## 6. Una configuración frontend más clara con `@santi020k/eslint-config-basic`

Después de migrar suficientes proyectos, me cansé de reconstruir la misma configuración frontend una y otra vez. Por eso trasladé mis estándares a [`@santi020k/eslint-config-basic`](https://eslint.santi020k.com/).

La versión más sencilla es:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.mjs"
import { eslintConfig } from '@santi020k/eslint-config-basic'

export default eslintConfig()
```

Eso ya ofrece un punto de partida sólido y detecta automáticamente señales comunes del proyecto a partir de `package.json`.

Cuando quiero ser más explícito, prefiero algo como esto:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.mjs"
import {
  eslintConfig,
  Library,
  Testing
} from '@santi020k/eslint-config-basic'

export default eslintConfig({
  libraries: [Library.Tailwind],
  testing: [Testing.Vitest, Testing.TestingLibrary],
  strict: true,
  typescript: true
})
```

Este enfoque encaja con mi manera de trabajar:

- Valores predeterminados sólidos
- Menos decisiones repetidas
- Opciones explícitas cuando el proyecto las necesita
- Menor dependencia del comportamiento específico del editor

Para los equipos frontend, eso importa mucho. No quiero que la calidad dependa de si un desarrollador instaló la extensión correcta o recordó la configuración adecuada hace seis meses.

![Diagrama con una ruta de migración desde una configuración ESLint antigua hacia una configuración plana reutilizable y explícita](./fig-2.webp "Un camino más claro hacia flat config.")

## 7. Lista final de comprobación de la migración

Antes de integrar el PR de migración, recomiendo revisar estos puntos:

- Actualiza primero Node y después ESLint.
- Genera la primera configuración plana con el migrador oficial si el proyecto es grande.
- Reemplaza `extends` basado en cadenas por configuraciones importadas siempre que sea posible.
- Traslada los patrones de `.eslintignore` a `ignores`.
- Conserva `FlatCompat` solo para las dependencias que aún lo necesitan.
- Revisa CI si usabas formateadores del núcleo eliminados en ESLint 9.
- Evita mezclar la migración con miles de correcciones automáticas no relacionadas en el mismo PR.

Ese último punto es importante. No recomiendo migrar la configuración y reescribir media base de código en el mismo pull request. Separa la migración estructural de las correcciones masivas de reglas siempre que puedas. Facilita la revisión y reduce el riesgo.

## Conclusión

Migrar a ESLint 9 tiene menos que ver con la sintaxis y más con asumir la responsabilidad de la configuración.

Dejas de heredar configuraciones por accidente y empiezas a componerlas a propósito. Para mí, ese es el verdadero valor del cambio. Lleva los proyectos frontend hacia una configuración más fácil de leer, entender y mantener con el tiempo.

Por esa misma razón sigo invirtiendo en `@santi020k/eslint-config-basic`: quiero menos valores predeterminados mágicos y más estándares declarados claramente en el código.

Si todavía usas ESLint 8 o una versión anterior, este es un buen momento para limpiar los cimientos en lugar de actualizar únicamente el número de versión.
