---
title: "Mejora la calidad y la eficiencia del código con mi biblioteca de configuración de ESLint"
description: "Biblioteca ESLint reutilizable para React, Next.js y TypeScript. Aplica estándares con flat config y simplifica la migración de ESLint 8 a 9."
coverImage:
  alt: "Módulos de código inconsistentes entran en un motor compartido de análisis y salen como resultados verificados"
---

En un artículo anterior, [«Cómo crear una configuración de Next.js con TypeScript, Standard, Vitest y ESLint»](https://medium.com/@santi020k/building-the-best-next-js-typescript-standard-vitest-eslint-configuration-f6d91d6346e7), hablamos de una configuración potente de ESLint diseñada para mantener la calidad, la consistencia y las buenas prácticas en proyectos Next.js y TypeScript. Desde entonces, convertí esa configuración en una biblioteca de ESLint reutilizable y flexible: [@santi020k/eslint-config-santi020k](https://www.npmjs.com/package/@santi020k/eslint-config-santi020k).

Este paquete simplifica la configuración de entornos ESLint, especialmente al pasar de ESLint 8 a 9. Veamos cómo puede ahorrar tiempo, mejorar la calidad del código e integrarse en distintos proyectos JavaScript, TypeScript y React.

## ¿Por qué esta biblioteca? Problemas comunes y soluciones

Santiago Molina creó esta configuración para resolver problemas habituales del desarrollo frontend, en particular al gestionar configuraciones complejas con TypeScript, React y Next.js. Simplifica la migración entre versiones de ESLint y mantiene una base de código consistente y de calidad en varios proyectos.

### 1. Configuración simplificada

Actualizar mis propios proyectos de ESLint 8 a 9 dejó en evidencia lo difícil que es administrar dependencias, complementos y reglas para cada proyecto. Creé @santi020k/eslint-config-santi020k para simplificar ese proceso. Ahora, establecer un entorno ESLint consistente en varios proyectos es tan sencillo como ejecutar un comando de instalación de npm.

Con esta biblioteca, proyectos de distintos tipos —JavaScript, TypeScript, React, Next.js, Expo, Astro, etc.— pueden compartir una base de configuración y personalizarla cuando sea necesario.

### 2. Mejor calidad del código

Como líder técnico responsable de auditar software, encuentro con frecuencia proyectos con poca calidad de código por reglas de análisis inconsistentes o inexistentes. Mi biblioteca de ESLint aplica estándares automáticamente, detecta errores pronto y promueve buenas prácticas, por lo que puede ser una incorporación valiosa a un proyecto existente.

Integrar @santi020k/eslint-config-santi020k en una base de código puede mejorar rápidamente la calidad y reducir la carga cognitiva durante las revisiones.

### 3. Diseñada para ser flexible

Aunque toma decisiones propias, la biblioteca está diseñada con flexibilidad. Puedes crear una bifurcación para agregar reglas o complementos según tus necesidades. También facilité la inclusión de parámetros opcionales para incorporar tecnologías como TailwindCSS, Vitest, i18next y otras.

## Primeros pasos

### Instalación

Empieza por comprobar que tu proyecto tiene ESLint instalado:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```bash title="terminal"
npm install eslint --save-dev
```

Después instala mi paquete de configuración:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```bash title="terminal"
npm install @santi020k/eslint-config-santi020k --save-dev
```

### Ejemplos de uso

En un proyecto TypeScript y React, tu `.eslintrc.js` podría verse así:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.js"
import { eslintConfig, ConfigOption } from '@santi020k/eslint-config-santi020k'

export default [
  ...eslintConfig({ config: [ConfigOption.React, ConfigOption.Ts] }),
  // Additional custom configuration (if needed)
]
```

Para incluir soporte opcional de TailwindCSS y Vitest:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.js"
import { eslintConfig, ConfigOption, OptionalOption } from '@santi020k/eslint-config-santi020k'

export default [
  ...eslintConfig({
    config: [ConfigOption.React, ConfigOption.Ts],
    optionals: [OptionalOption.Tailwind, OptionalOption.Vitest]
  })
]
```

Encontrarás más ejemplos y configuraciones en la [documentación del paquete en npm](https://www.npmjs.com/package/@santi020k/eslint-config-santi020k).

## Implementación en proyectos existentes

Integrar esta biblioteca de configuración de ESLint en proyectos existentes es sencillo:

**1. Instala la biblioteca** con los comandos anteriores.

**2. Extiende la configuración de ESLint** para usar @santi020k/eslint-config-santi020k.

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```javascript title="eslint.config.js"
import { eslintConfig, ConfigOption } from '@santi020k/eslint-config-santi020k'

export default [
  ...eslintConfig({ config: [ConfigOption.React, ConfigOption.Ts] }),
  // Additional or previous config
]
```

**3. Agrega comandos de análisis** a package.json

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```json title="package.json"
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

**4. Ejecuta ESLint** para identificar y resolver problemas en tu base de código. Usa:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```bash title="terminal"
npm run lint
npm run lint:fix
```

**5. Ajusta las reglas cuando sea necesario**, sobre todo en proyectos con requisitos particulares.

## Beneficios en la práctica: impacto real

Tener esta biblioteca de configuración como herramienta base me ha permitido concentrarme más en la lógica de negocio y en los aspectos estratégicos del desarrollo de software, en lugar de los detalles de estilo. Estas son algunas ventajas prácticas:

- **Código más legible y consistente** en varios proyectos
- **Correcciones automáticas** para problemas que suelen pasarse por alto o ignorarse, especialmente en bases de código antiguas
- **Menos revisiones manuales** de estilo, formato y errores menores

## Desarrollo futuro

Trabajo continuamente para mejorar esta biblioteca y me encantaría recibir contribuciones de la comunidad. Estas son algunas funciones previstas:

- Soporte para otros frameworks, como Vue y Angular, y una mejor configuración de Astro
- Pruebas unitarias y documentación ampliada para distintos casos de uso
- Conjuntos de reglas personalizables para un control más preciso

Te invito a [visitar el repositorio de GitHub](https://github.com/santi020k/eslint-config-santi020k) si te interesa contribuir o reportar problemas.

## Conclusión

Incorporar @santi020k/eslint-config-santi020k en tus proyectos Next.js, TypeScript o React puede reducir considerablemente las inconsistencias, mejorar la calidad y ahorrar tiempo valioso. Tanto si trabajas por tu cuenta como si lideras varios proyectos, esta biblioteca puede ser una herramienta potente.

Gracias por leer. Espero que esta herramienta te resulte tan útil como a mí para mantener estándares altos de calidad. ¡Sigamos construyendo código mejor, más limpio y más fácil de mantener!

*¡Pronto compartiré más novedades e ideas! No dudes en escribirme si tienes preguntas o comentarios.*
