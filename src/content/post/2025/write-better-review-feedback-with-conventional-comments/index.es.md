---
title: "Mejora tus comentarios de revisión con Conventional Comments"
description: "Un lenguaje ligero para revisar código con comentarios más claros, amables y fáciles de llevar a la práctica."
coverImage:
  alt: "Señales diferenciadas de comentarios de revisión que fluyen desde un cambio de código hasta una corrección concreta"
---

La mayoría de los problemas de revisión no se deben a la mala intención. Se deben a la ambigüedad.

Comentarios como «esto no me convence» o «¿puedes arreglar esto?» obligan a quien escribió el código a adivinar si la observación bloquea la aprobación, es opcional, es de estilo, señala un riesgo o solo explora una idea. Esa incertidumbre hace perder tiempo y cambia silenciosamente el tono de la revisión.

Me gusta Conventional Comments porque resuelve ese problema sin convertir la revisión en burocracia.

## La idea central

Empieza cada comentario con una etiqueta que explique su intención.

```text
<label> [decorations]: <subject>

[discussion]
```

Ejemplos:

```text
suggestion: Could we move this transformation into the server action so the component stays focused on rendering?
```

```text
issue (blocking): This fallback skips the permission check and could expose the admin branch to non-admin users.
```

```text
question (non-blocking): Do we expect this request to be idempotent if the user refreshes midway through the flow?
```

Ese pequeño toque de estructura cambia la experiencia de inmediato. La persona sabe qué tipo de comentario está leyendo antes de interpretar el resto de la frase.

## Etiquetas que vale la pena estandarizar

No necesitas una taxonomía enorme. Basta con un conjunto pequeño y compartido:

- `praise:` para algo especialmente bien logrado
- `suggestion:` para una mejora con una dirección propuesta
- `issue:` para un problema real que necesita solución
- `question:` para una duda o una investigación
- `todo:` para una pequeña tarea obligatoria
- `note:` para contexto que no debería bloquear el trabajo

La meta no es la perfección. Es llegar a un entendimiento más rápido.

## Por qué funciona tan bien

Conventional Comments mejora tres cosas al mismo tiempo.

### Hace que los comentarios sean más fáciles de resolver

Una etiqueta anima a quien revisa a ser específico. Cuando escribo `suggestion:`, siento la necesidad de explicar una alternativa mejor. Cuando escribo `issue:`, siento la necesidad de describir el riesgo real.

### Reduce la fricción social

Los comentarios ambiguos suelen sentirse más duros de lo que se pretendía porque quien los recibe debe deducir si bloquean la aprobación. Una intención clara reduce esa tensión.

### Facilita recorrer la revisión

Cuando un pull request tiene muchos comentarios, las etiquetas ayudan a decidir qué atender primero. Eso permite que ambas partes mantengan el ritmo.

## El tono sigue importando

La estructura ayuda, pero el tono también es parte del oficio.

Intento mantener algunos hábitos:

- Reemplazar «tú» por «nosotros» cuando sea posible
- Explicar por qué, además de qué
- Ser explícito cuando algo no bloquea la aprobación
- Acompañar los problemas con sugerencias siempre que pueda
- Reconocer sinceramente el trabajo cuando lo merece

Lo último suele subestimarse. Un reconocimiento sincero no es relleno. Le enseña al equipo cómo se ve un buen trabajo.

## Cómo lo introduzco en un equipo

No lo implementaría como una política rígida desde el primer día. Haría algo más sencillo:

1. Empezar a usar las etiquetas en mis propias revisiones
2. Explicar el patrón en una nota breve para el equipo
3. Mantener deliberadamente pequeño el conjunto de etiquetas
4. Normalizar el modificador `non-blocking` para los ajustes opcionales
5. Afinar el enfoque según los puntos donde siga habiendo confusión

Es una convención ligera, no una ceremonia.

## Las mejores revisiones crean mejores sistemas

La revisión de código es una de las principales formas en que los equipos transmiten sus estándares. Si el lenguaje de la revisión es vago, los estándares también se vuelven vagos.

Conventional Comments no hace que las personas sean consideradas por sí solo. Pero facilita expresar esa consideración. Eso basta para mejorar la colaboración, acortar los ciclos de comentarios y reducir los hilos de revisión que terminan en fricción evitable.

Etiquetas claras. Intención clara. Mejores conversaciones.
