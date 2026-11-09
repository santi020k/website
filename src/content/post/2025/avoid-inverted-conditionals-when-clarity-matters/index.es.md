---
title: "Evita las condiciones invertidas cuando importa la claridad"
description: "Las condiciones positivas suelen reducir la carga mental y facilitan la lectura, revisión y modificación de las ramas del código."
coverImage:
  alt: "Un recorrido de decisiones enredado se transforma en dos ramas claras y directas"
---

La mayoría de los consejos sobre legibilidad parecen abstractos hasta que se siente su costo en una base de código activa. Las condiciones invertidas son un buen ejemplo. No siempre están mal, pero a menudo hacen que una lógica sencilla tarde más de lo necesario en entenderse.

Ese trabajo mental adicional es pequeño en una línea y costoso en toda una base de código.

## Por qué las condiciones invertidas ralentizan la lectura

Normalmente entendemos el camino «normal» más rápido que el excepcional. Cuando el código empieza con una negación, hay que invertir mentalmente la condición antes de evaluar la rama.

Esto:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```ts
const maxWidth = isDesktop ? 288 : '100%'
```

suele leerse más rápido que esto:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```ts
const maxWidth = !isDesktop ? '100%' : 288
```

La segunda versión sigue siendo válida. Simplemente es más difícil de interpretar porque la lógica comienza con la ausencia del estado deseado.

## Prefiere la rama positiva cuando el concepto ya existe

Si el dominio ya tiene un nombre positivo claro, úsalo.

Ejemplos:

- `isAuthenticated` en lugar de `isNotAnonymous`
- `hasAccess` en lugar de `isDenied === false`
- `isDesktop` en lugar de `!isMobile`
- `canSubmit` en lugar de `isSubmitDisabled === false`

Estos nombres se ajustan mejor a cómo solemos razonar sobre el estado. Agilizan las revisiones y reducen los errores en cambios posteriores.

## Mejores herramientas que la negación

Si una condición resulta incómoda, intento una de estas opciones antes de aceptar una rama invertida:

### Cambia el nombre del booleano

A veces la lógica está invertida únicamente porque la variable se nombró desde la perspectiva equivocada.

### Usa una cláusula de guarda

En lugar de introducir negaciones en cada expresión, resuelve el caso excepcional al principio y deja que el cuerpo principal siga un camino directo.

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```ts
if (!user) return null

return <Dashboard user={user} />
```

### Extrae la intención a una función auxiliar

Si la condición es realmente más compleja de lo que debería representar un booleano, dale un nombre a la decisión en lugar de anidar más inversiones en la rama.

## Cuándo está bien invertir

Esto no es una prohibición absoluta.

No me molesta la inversión cuando:

- El caso negativo es la principal salida anticipada
- La expresión ya es más clara en forma negativa
- Invertir la condición haría la rama más incómoda

La clave es optimizar para quien leerá después, no aplicar una regla general sin criterio.

## La pregunta que hago al revisar

Cuando veo una condición invertida, pregunto: ¿la negación aporta claridad o la quita?

Si la quita, normalmente la reescribo. El costo es mínimo y la mejora de legibilidad empieza a acumularse de inmediato.

Ese es el patrón detrás de muchos consejos de calidad que me importan. Las pequeñas decisiones de legibilidad no son cosméticas. Determinan la rapidez con la que un equipo podrá entender, revisar y modificar el sistema de forma segura más adelante.
