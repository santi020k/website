---
title: "Una estrategia sólida de ramas Git para equipos de ingeniería en crecimiento"
description: "Cómo superar las ramas de funcionalidad básicas e implementar un modelo que permita entregas estables, entornos UAT y correcciones urgentes sin interrumpir el desarrollo."
coverImage:
  alt: "Rutas estructuradas de funcionalidades, versiones, pruebas, producción y correcciones urgentes que convergen de forma segura"
---

Cuando los equipos de ingeniería son pequeños y avanzan rápido, un flujo de Git básico suele parecer la opción adecuada. Creas una rama desde `develop` (o `main`), construyes la funcionalidad, abres un Pull Request y lo integras. La canalización de CI/CD toma el cambio, lo despliega en un entorno de desarrollo o preproducción y pasas a la siguiente tarea.

Esto funciona de maravilla, hasta que deja de hacerlo.

A medida que el equipo crece, aumentan los proyectos en paralelo y la complejidad de los entornos. De pronto hay ciclos dedicados de control de calidad, períodos de pruebas de aceptación del usuario (UAT) y calendarios estrictos de publicación en producción. Un modelo sencillo de ramas de funcionalidad no ofrece la estructura necesaria para gestionar pruebas, entregas repetibles y correcciones urgentes de forma eficiente a escala.

En esta guía explicaré una estrategia de ramas sólida, diseñada para gestionar entornos complejos —desarrollo, QA, preproducción y producción— sin sacrificar estabilidad ni velocidad.

## El problema de la configuración «básica»

En una configuración típica de las primeras etapas, los desarrolladores siguen un flujo sencillo:

1. Crear `feature/<ticket-id>` desde `develop`.
2. Registrar los cambios en commits.
3. Abrir un PR hacia `develop`.
4. Desplegar automáticamente en el entorno DEV.

El problema aparece cuando una funcionalidad se integra en `develop` pero todavía no está lista para producción. Si necesitas preparar una entrega, debes separar las funcionalidades a medio terminar de las completadas. Además, si se descubre un error crítico en producción, corregirlo sin arrastrar código sin probar desde `develop` se convierte en una pesadilla logística.

## Una estrategia de ramas que puede crecer

Para permitir desarrollo de funcionalidades en paralelo, entregas repetibles y correcciones urgentes rápidas, necesitamos una separación clara de responsabilidades entre ramas y entornos.

| Rama | Propósito | Entorno de destino |
| --- | --- | --- |
| `main` | Fuente de verdad de la última versión estable. | Producción |
| `release/X.Y.Z` | Código aislado específicamente para una próxima entrega. | UAT → Producción |
| `staging` | Espacio de integración para las pruebas de QA. | UAT / Preproducción |
| `develop` | Trabajo de desarrollo diario y continuo. | DEV |
| `feature/*` | Funcionalidades individuales construidas por los desarrolladores. | Local |
| `hotfix/*` | Correcciones urgentes aplicadas directamente al código de producción. | Preproducción / Producción |

Esta estructura permite que el trabajo en curso nunca bloquee una entrega y que las entregas nunca bloqueen el trabajo en curso. Veamos los distintos flujos.

## Flujos principales

### 1. Desarrollo de funcionalidades
Todo desarrollo nuevo comienza desde la rama `develop`. Así, los desarrolladores construyen sobre la versión integrada más reciente del código.

```bash
git checkout develop
git checkout -b feature/<ticket-id>
```

Una vez terminada la funcionalidad, se envía como PR hacia `develop`. En una configuración de CI/CD sólida, integrar ese PR debería desplegar automáticamente el código en un entorno DEV para la verificación inicial del desarrollador.

### 2. Integración y pruebas de QA
Cuando un conjunto de funcionalidades está listo para QA o para las pruebas de aceptación del usuario (UAT), las funcionalidades probadas de `develop` se integran en la rama `staging`.

La rama `staging` se despliega continuamente en el entorno UAT. Esto ofrece al equipo de QA y a las personas interesadas un entorno estable donde validar funcionalidades sin interferencias del trabajo en curso en `develop`.

### 3. Preparación de una entrega
Cuando las funcionalidades de `staging` superan UAT y reciben aprobación para producción, llega el momento de preparar una entrega.

En lugar de desplegar `staging` directamente en producción, creamos desde ella una rama dedicada: `release/v1.2.0`.

Esta rama se despliega en un entorno final de preproducción/UAT para una comprobación previa.

- **Regla n.º 1:** No se pueden integrar funcionalidades nuevas en una rama de entrega.
- **Regla n.º 2:** Si aparecen errores durante esta fase, las correcciones se incorporan directamente a la rama de entrega mediante PR.

### 4. Publicación en producción
Una vez aprobada la rama de entrega, se despliega en producción.

Después de un despliegue exitoso, hay que cerrar el ciclo para mantener sincronizadas todas las ramas:

1. Integrar `release/v1.2.0` en `main`, el registro permanente de producción.
2. Integrar `release/v1.2.0` de vuelta en `develop`, para no perder las correcciones realizadas durante la preparación.
3. Etiquetar el commit de `main` como `v1.2.0`.

### 5. El flujo de correcciones urgentes
Por bueno que sea tu proceso de QA, algunos errores críticos llegarán a producción. El flujo de correcciones urgentes permite repararlos rápidamente sin publicar por accidente funcionalidades no aprobadas de `develop` o `staging`.

1. **Crear una rama desde producción:** Crear una rama base de corrección urgente desde la última etiqueta de entrega en `main`, por ejemplo `hotfix/20260515`.
2. **Corregir el error:** Crear una rama para el problema concreto desde esa base, por ejemplo `hotfix/<issue-id>`, subir la corrección y abrir un PR hacia la rama base.
3. **Validar:** Después de la aprobación, integrar la corrección y desplegar la rama base en UAT —integrándola temporalmente en `staging` o desplegándola directamente— para comprobar que funciona.
4. **Desplegar:** Una vez validada, integrar la corrección en `main` y desplegar en producción.
5. **Reintegrar:** Es fundamental llevar la corrección de vuelta a `develop` —y a `staging` si hace falta— y etiquetar el nuevo commit de `main` como `v1.2.1` o `v1.2.0-hotfix`.

## Por qué importa

Al principio, adoptar un modelo de ramas más estructurado puede parecer trabajo adicional. Su valor, sin embargo, está en la previsibilidad. Al separar estrictamente los entornos y vincularlos a ramas concretas, eliminas la fricción de revertir despliegues, los conflictos de integración durante los ciclos de entrega y el pánico de separar código durante un incidente en producción.

Esto permite a los equipos avanzar rápido en `develop` y mantener una estabilidad firme en `main`.
