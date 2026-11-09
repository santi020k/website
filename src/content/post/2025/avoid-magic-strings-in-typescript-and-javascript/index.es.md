---
title: "Evita las cadenas de texto mágicas en TypeScript y JavaScript"
description: "Reemplaza cadenas dispersas por un lenguaje de dominio más claro, tipos más sólidos y refactorizaciones más seguras."
coverImage:
  alt: "Fragmentos de cadenas sueltos se convierten en valores de dominio tipados y conectados en un sistema estructurado"
---

Las cadenas de texto mágicas parecen inofensivas hasta que la base de código tiene mucha actividad. Una cadena aislada rara vez es el problema. La dificultad comienza cuando el mismo valor participa en el flujo de control, estados de interfaz, claves de analítica, mapeos de API o manejo de errores en varios lugares a la vez.

En ese momento, cada literal de cadena se convierte en un contrato oculto.

## Qué se considera una cadena mágica

No me refiero a todas las frases escritas directamente en una interfaz. Hablo de cadenas con un significado del que depende el sistema, pero que no está modelado en ninguna parte.

Ejemplos:

- Nombres de estados usados en condiciones
- Nombres de eventos enviados a analítica
- Nombres de roles usados para permisos
- Identificadores de error asociados a mensajes
- Claves de caché y segmentos de rutas repetidos a mano

El problema no es que sean cadenas. Es que son cadenas importantes sin una fuente de verdad compartida.

## Por qué generan fricción

Las cadenas mágicas crean varios riesgos a la vez:

- Es fácil escribirlas mal.
- Es difícil buscarlas con confianza cuando los nombres son inconsistentes.
- Favorecen copiar y pegar lógica en lugar de modelar el dominio.
- Reducen la capacidad de TypeScript para ayudarnos.
- Hacen las refactorizaciones más costosas de lo necesario.

Sobre todo, esconden la intención. `if (status === 'approved')` se entiende por sí solo. Pero si `'approved'`, `'pending_review'` y `'rejected'` aparecen en una docena de archivos con tratamientos ligeramente distintos, el vocabulario del sistema ya empezó a dispersarse.

## Mejores opciones en TypeScript

La alternativa adecuada depende de cómo se use el valor.

### Objetos de constantes con nombre

En muchos casos basta con un objeto inmutable:

```ts
export const ORDER_STATUS = {
  approved: 'approved',
  pendingReview: 'pending_review',
  rejected: 'rejected'
} as const

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS]
```

Esto ofrece autocompletado, nombres centralizados y un tipo reutilizable.

### Uniones de literales

Si el conjunto es pequeño y no necesitamos acceder a él en tiempo de ejecución, las uniones pueden ser incluso más claras:

```ts
export type Environment = 'development' | 'staging' | 'production'
```

### Mapas para los textos de la interfaz

Cuando necesitamos convertir valores internos en mensajes legibles, prefiero mapas explícitos:

```ts
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
  RATE_LIMITED: 'Please wait a moment and try again.',
  UNAUTHORIZED: 'You need to sign in again.',
  UNKNOWN: 'Something went wrong. Please try again.'
}
```

Esa estructura hace visible la intención y mantiene el texto de la interfaz cerca del concepto de dominio del que depende.

## Cuándo están bien las cadenas directas

No toda cadena necesita una abstracción.

Está bien escribirla directamente cuando:

- Es un texto de presentación que se usa una sola vez
- Es local a una prueba y facilita su lectura
- Realmente no forma parte de un contrato compartido

Mi regla es sencilla: si cambiar la cadena en un lugar probablemente debería cambiarla también en otro, merece una representación con nombre.

## Una regla de refactorización que escala

Cuando encuentro una cadena mágica que afecta el comportamiento, normalmente sigo esta secuencia:

1. Dar nombre al concepto
2. Centralizar los valores permitidos
3. Asignar un tipo a los valores
4. Actualizar las condiciones para usar la fuente con nombre
5. Eliminar las comparaciones de cadenas que ahora sean redundantes

Este proceso mejora el código sin convertir una limpieza pequeña en una gran migración.

## La claridad vale más que el ingenio

El objetivo no es abstraer por abstraer. Es lograr que el sistema hable en el lenguaje de su propio dominio.

Ese es el beneficio real. Las constantes, las uniones y los mapas son herramientas. La ganancia de fondo es que las revisiones se simplifican, la intención se aclara y TypeScript puede ayudarnos a proteger los contratos de los que ya depende el sistema.

Si una cadena controla el comportamiento, trátala como parte del diseño, no como texto incidental.
