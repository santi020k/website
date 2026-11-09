---
title: "Buenas prácticas de Git para colaborar con tranquilidad"
description: "Hábitos sencillos para commits y pull requests que reducen la fricción en las revisiones y facilitan una colaboración más tranquila."
coverImage:
  alt: "Cuatro rutas de desarrollo ordenadas que atraviesan controles de revisión y se unen en una línea protegida"
---

Git no suele frenar a los equipos por sí solo. La verdadera demora viene de los hábitos inconsistentes a su alrededor: historiales de commits vagos, pull requests demasiado grandes, responsabilidades poco claras y pasos de publicación que viven principalmente en la memoria de alguien.

La solución no es añadir complejidad. Es adoptar unos pocos hábitos que permitan seguir el trabajo con facilidad.

## Prioriza la trazabilidad, no el ingenio

Quiero que el historial responda rápidamente preguntas sencillas:

- ¿Qué cambió?
- ¿Por qué cambió?
- ¿Quién está a cargo?
- ¿En qué deberían concentrarse quienes revisan?
- ¿Cómo lo revertimos si hace falta?

Si el historial no puede responderlas sin trabajo de investigación adicional, el costo de colaboración aumenta para todos cuando la persona que hizo el cambio pasa a otra cosa.

## Elige una convención de commits y úsala de forma consistente

Me importa menos el formato exacto que la consistencia. En la mayoría de los repositorios modernos, [Conventional Commits](https://www.conventionalcommits.org/) es una buena opción inicial porque escala bien:

```text
feat(blog): add santi020k way series landing section
fix(auth): preserve redirect after session refresh
docs(release): clarify staging verification checklist
```

Si un equipo ya usa una convención con el ámbito entre corchetes u otro formato establecido, también está bien. Lo esencial es que el título describa fielmente el cambio sin obligar a quien lo lee a abrir primero el diff.

## Los pull requests deben reducir las conjeturas de quien revisa

Un buen pull request hace más que adjuntar código a una rama. Ofrece un mapa para la revisión.

Como mínimo, espero encontrar:

- Una descripción concisa del cambio
- La razón del cambio
- Capturas o grabaciones cuando se modificó la interfaz
- Notas sobre el despliegue o la migración cuando hagan falta
- Concesiones conocidas o tareas posteriores señaladas explícitamente

Por eso me gusta combinar buenas descripciones de PR con [Conventional Comments](/es/blog/write-better-review-feedback-with-conventional-comments/). Juntos acortan todo el ciclo de revisión.

## Limita cada PR a una unidad real de cambio

Los pull requests demasiado grandes generan revisiones superficiales. Quienes revisan leen por encima, quienes los escriben esperan más y los problemas sutiles sobreviven porque hay demasiados cambios de contexto dentro de una sola rama.

Si un cambio mezcla refactorizaciones, funcionalidades nuevas, reescrituras de pruebas y ajustes de diseño, suelo preguntar si algunas de esas responsabilidades pueden separarse. Los pull requests pequeños no solo son más fáciles de revisar. También es más fácil confiar en ellos.

## La responsabilidad no termina al abrir el PR

Abrir un PR no es la meta. Es el inicio de una fase de colaboración.

Eso significa que su autor debería:

- Asignárselo o dejar clara su responsabilidad en la plataforma que use el equipo
- Responder a los comentarios a tiempo
- Mantener la rama actualizada cuando aparezcan conflictos
- Verificar los controles y las vistas previas antes de pedir la aprobación final
- Completar el seguimiento después de integrar si quedan pasos de despliegue pendientes

Dejar clara la responsabilidad es una forma de consideración. Evita que el trabajo quede en estados ambiguos.

## Protege la trazabilidad de las versiones

Un buen uso de Git debería facilitar las publicaciones. Eso implica:

- Etiquetas significativas para las versiones de producción
- Una relación clara entre el código integrado y la versión entregada
- Un historial de commits que permita generar el registro de cambios cuando haga falta
- Evitar el caos de los force-push en ramas compartidas

Cuando publicar ya resulta estresante, un historial de Git impreciso empeora todo.

## El estándar práctico que mantengo

Si un equipo solo adoptara unas pocas reglas, elegiría estas:

- Un pull request debe representar una intención principal
- Los títulos de los commits deben entenderse por sí solos
- Las descripciones de los PR deben explicar qué cambió y por qué
- La responsabilidad debe ser explícita desde que empieza la revisión
- El historial de versiones debe ser lo bastante claro como para confiar en él durante un incidente

El objetivo no es la elegancia por sí misma. Es colaborar con tranquilidad. Git aporta más cuando reduce la ambigüedad y ayuda a todo el equipo a avanzar con confianza.
