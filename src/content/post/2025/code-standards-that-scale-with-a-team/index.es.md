---
title: "Estándares de código que crecen con el equipo"
description: "La versión de los estándares de código que hoy entregaría a un equipo frontend en crecimiento."
coverImage:
  alt: "Varios módulos de proyecto alineados mediante un núcleo compartido de estándares"
---

Muchos «estándares» de equipo fallan porque son demasiado abstractos, rígidos o anticuados para ayudar en el trabajo real. Un estándar útil debería facilitar la siguiente decisión. Si agrega debate sin reducir la ambigüedad, probablemente no sea bueno.

Esta es la versión que sí entregaría a un equipo frontend en crecimiento.

## Los estándares deben reducir el cansancio de decidir

El objetivo no es controlar todas las preferencias personales. Es hacer predecibles las decisiones comunes para que el equipo dedique su energía al producto y la arquitectura, en lugar de discutir de nuevo los nombres, la estructura y el formato en cada pull request.

Un estándar sólido hace tres cosas:

- Hace evidente el camino deseado
- Deja que las herramientas se encarguen de las partes rutinarias
- Permite aplicar criterio donde el contexto realmente importa

## Separa la presentación del comportamiento del producto

Me gusta distinguir claramente los componentes de presentación de la lógica de funciones o módulos.

Los componentes de presentación deberían:

- Recibir datos y funciones de retorno mediante propiedades
- Centrarse en el renderizado y los estados de interacción
- Ser reutilizables cuando esa reutilización sea real

Los módulos de una función pueden:

- Coordinar reglas de negocio
- Coordinar llamadas a API y estado
- Adaptar los datos para la capa de presentación

Ese límite nunca es perfecto, pero sigue siendo útil. Facilita probar y mover las piezas de interfaz.

## Prefiere tipos sólidos y nombres explícitos

Si un equipo usa TypeScript, debería aprovechar sus beneficios.

Eso normalmente significa:

- Evitar `any`
- Modelar conceptos de dominio con tipos que tengan nombre
- Mantener legibles las interfaces y los tipos auxiliares
- Usar nombres que describan la intención, no los mecanismos de implementación

También me gusta la consistencia al nombrar. Si la base de código tiene un patrón para DTO, otro para propiedades de componentes y otro para carpetas funcionales, esos patrones deben mantenerse estables. En los nombres comienza mucha complejidad accidental.

## Haz predecible la estructura

Una estructura de archivos predecible ayuda más de lo que suele reconocerse. Reduce el tiempo de búsqueda, facilita la incorporación de personas y simplifica las revisiones porque la forma del código deja de ser parte del rompecabezas.

Normalmente quiero que el equipo acuerde:

- Dónde viven los componentes de presentación
- Dónde viven los módulos funcionales
- Cómo se colocan las pruebas junto al código
- Dónde van los estilos
- Cómo se relacionan las rutas o páginas con su código de apoyo

Hay varias respuestas buenas. El requisito principal es compartir la misma respuesta.

## Deja las partes rutinarias a las herramientas

Los estándares que dependen de la memoria son frágiles. Si algo importa con frecuencia, las herramientas deberían ayudar.

Quiero que se encarguen de:

- El formato
- El orden de importaciones
- La detección evidente de código sin uso
- Las comprobaciones básicas de accesibilidad
- El sistema de tipos

Por eso sigo valorando una configuración clara de análisis y formato. Una buena base elimina ruido arbitrario de las revisiones y permite a las personas concentrarse en las decisiones que requieren criterio humano. Si construyes un entorno moderno con estas ideas, mi artículo sobre [una configuración de Next.js con TypeScript, Standard, Vitest y ESLint](/es/blog/building-the-best-next-js-typescript-standard-vitest-eslint-configuration/) presenta un ejemplo práctico.

## Escribe los TODO como trabajo futuro, no como confesiones

No me molestan los TODO cuando son específicos, temporales y accionables.

Sí me molestan los que no dicen nada más que «arreglar después».

Un TODO útil debería responder:

- Qué está incompleto
- Por qué está incompleto
- Qué condición permitirá eliminar el TODO

Si el equipo nunca vuelve a esas notas, ya no son tareas pendientes. Son decoración.

## Las expectativas de pruebas deben ser explícitas

No todos los componentes necesitan la misma profundidad de pruebas, pero todos los equipos se benefician de expectativas compartidas.

Por ejemplo:

- Los componentes con comportamiento deberían tener cobertura de interacción
- Los módulos con lógica condicional deberían tener pruebas unitarias de sus puntos de decisión
- Los recorridos críticos deberían tener cobertura de extremo a extremo

Eso ayuda más que una regla vaga como «todo debe estar probado».

## El estándar que más me importa

Si tuviera que condensarlo en una idea, sería esta: un estándar es útil cuando hace que trabajar bien sea lo más fácil.

Ese es el criterio. Los mejores estándares no son los más estrictos. Son los que ayudan discretamente al equipo a entregar mejor trabajo, de forma más consistente y con menos fricción.
