---
title: "Integración y despliegue continuos para proyectos Next.js"
description: "Crea un flujo CI/CD práctico para Next.js con GitHub Actions: instalación limpia, análisis, pruebas, verificación de compilación y despliegue de código validado."
seoTitle: "CI/CD de Next.js con GitHub Actions"
coverImage:
  alt: "Artefactos de código atraviesan cinco controles verificados de entrega hacia una versión protegida"
---

[Lee el artículo anterior: pruebas de componentes React con Vitest y React Testing Library](/es/blog/testing-react-components-with-vitest-and-react-testing-library/)

Después de agregar pruebas al proyecto, el siguiente paso lógico es asegurarse de que se ejecuten automáticamente. De lo contrario, la suite se vuelve opcional, y los equipos ocupados terminan ignorando los controles de calidad opcionales.

Por eso me gusta contar con CI/CD desde el principio, incluso cuando el producto aún es pequeño. Crea pronto un hábito de entrega: cada cambio debe demostrar que puede analizarse, probarse y compilarse antes de que alguien confíe en él.

En proyectos Next.js esto es especialmente importante porque los problemas de frontend suelen aparecer en varios lugares a la vez:

- Problemas de análisis estático
- Errores de tipos
- Compilaciones rotas
- Errores en variables de entorno
- Diferencias de despliegue entre el entorno local y producción

Un buen flujo de CI/CD los detecta antes y reduce la depuración posterior a la integración.

## CI y CD no son lo mismo

Prefiero separar claramente ambos conceptos.

- **Integración continua** verifica que el código esté en buen estado.
- **Despliegue continuo** publica código verificado en un entorno.

Muchos equipos mezclan ambas ideas en un solo flujo y después se preguntan por qué resulta difícil entenderlo. Prefiero un modelo más sencillo:

1. Validar cada pull request
2. Desplegar solo lo que ya superó la validación

Esto facilita el mantenimiento del proceso.

## ¿Qué debe validar la integración continua?

En un proyecto Next.js, normalmente quiero validar al menos lo siguiente:

- Instalar las dependencias de forma limpia
- Ejecutar el análisis estático
- Ejecutar las pruebas unitarias
- Compilar la aplicación

Si el proyecto ya tiene pruebas de extremo a extremo, también pueden agregarse, pero no recomiendo hacer demasiado pesado el primer flujo. Es mejor empezar con los controles de mayor valor y crecer con cuidado.

## Un flujo práctico de GitHub Actions

Crea el archivo `.github/workflows/ci.yml`:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```yaml title=".github/workflows/ci.yml"
name: CI

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run tests
        run: npm run test

      - name: Build project
        run: npm run build
```

No es el flujo más complejo del mundo, y está bien que así sea. En mi experiencia, muchos procesos se complican innecesariamente porque los equipos intentan optimizar todo antes de demostrar su valor.

Una buena primera versión debe ser clara, predecible y fácil de entender para todo el equipo.

## Por qué incluyo el paso de compilación

Algunos equipos se quedan en el análisis estático y las pruebas unitarias. Yo no.

En Next.js, la compilación suele detectar problemas que esos controles no encuentran:

- Importaciones incorrectas
- Errores en los límites entre servidor y cliente
- Suposiciones inválidas sobre el entorno
- Fallos al compilar rutas
- Problemas de generación estática

Si la aplicación no puede compilarse en CI, no quiero descubrirlo después de integrar el cambio o durante el despliegue.

## Opciones de despliegue

Para desplegar, normalmente prefiero uno de estos enfoques:

### 1. Integración de Vercel con Git

Es la opción más sencilla para muchos proyectos Next.js. Envía los cambios al repositorio, deja que Vercel genere la vista previa y promuévela a producción después de la integración.

Es simple, y la simplicidad tiene valor.

### 2. Despliegue explícito en GitHub Actions

Si necesitas más control, puedes desplegar después de que termine correctamente el trabajo de verificación. Por ejemplo:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```yaml title=".github/workflows/deploy.yml"
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build

      - name: Deploy to Vercel
        run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

Si eliges este camino, organiza los secretos y las variables de entorno desde el inicio. Los flujos de despliegue se vuelven frágiles muy rápido cuando la gestión de secretos es inconsistente.

## Mantén estándares de calidad estrictos

Algo que no recomiendo es permitir que el flujo pase con advertencias que el equipo ya decidió que importan.

Si un control es lo bastante importante como para existir, prefiero ser honesto al respecto. O bien:

- Importa y debe hacer fallar el flujo
- O no importa y no debería estar ahí

Es la misma razón por la que intento evitar valores predeterminados débiles en el frontend. Los estándares ambiguos crean responsabilidades ambiguas.

## Scripts sugeridos en `package.json`

Los scripts del proyecto deben respaldar directamente el flujo:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```json title="package.json"
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings=0",
    "test": "vitest run"
  }
}
```

Prefiero `--max-warnings=0` en proyectos sensibles a CI porque obliga al equipo a definir explícitamente qué tolera. De lo contrario, las advertencias tienden a acumularse hasta que nadie confía en esa señal.

## CI/CD también es una herramienta de comunicación del equipo

Esta parte suele subestimarse.

Un buen flujo hace más que validar código. Comunica expectativas al equipo:

- Este proyecto debe compilar
- Este proyecto debe superar las pruebas
- Este proyecto debe respetar las reglas de análisis
- Este proyecto debe poder publicarse desde la rama principal

Cuando esas reglas quedan claras en la automatización, el proyecto resulta más fácil de escalar.

## Conclusiones

- CI valida la calidad de forma continua, mientras CD se encarga de la entrega.
- En Next.js, el análisis, las pruebas y la compilación deben formar parte del flujo mínimo.
- Un flujo sencillo de GitHub Actions suele bastar para crear buenos hábitos de entrega.
- La compilación es especialmente valiosa en Next.js porque detecta problemas que las pruebas unitarias pueden pasar por alto.
- Los flujos deben reflejar estándares reales, no intenciones vagas.
