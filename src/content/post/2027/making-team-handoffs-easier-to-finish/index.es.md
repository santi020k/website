---
title: "Cómo facilitar los traspasos de trabajo entre equipos"
description: "Una estructura práctica para traspasar trabajo entre frontend, backend, diseño y lanzamientos, basada en mi experiencia de liderazgo técnico en Void."
coverImage:
  alt: "Tres carriles de trabajo violetas se encuentran en una puerta blanco hueso y continúan hacia una pequeña pieza verde"
---

En [Void](/es/portfolio/void/), lideré trabajo técnico en web, móvil, backend y sistemas en tiempo real, con un equipo que abarcaba ingeniería, diseño y producto. Ese alcance hace especialmente concreto un problema de liderazgo: el trabajo puede avanzar en todas las disciplinas mientras sigue siendo difícil terminar una funcionalidad completa.

El espacio entre esas disciplinas necesita atención. Alguien debe saber qué decisión sigue abierta, quién puede resolverla y qué evidencia permite continuar a la siguiente persona.

Esta es la estructura de traspaso que usaría para esa situación, ilustrada con una funcionalidad ficticia de inscripción a torneos.

## Describan el resultado para la persona antes de dividir el trabajo

Consideren una funcionalidad de inscripción a torneos. «Construir el formulario», «crear el endpoint» y «terminar el diseño» son tareas útiles, pero completarlas no demuestra que alguien pueda inscribirse correctamente.

Comiencen por el resultado: una persona que cumpla los requisitos puede inscribirse, entender si la inscripción se completó y recuperarse cuando no fue así.

Eso genera de inmediato preguntas compartidas. ¿Qué pasa si el torneo se llena mientras el formulario está abierto? ¿Y si la persona ya está inscrita? ¿Puede una respuesta demorada provocar un segundo envío?

Estas preguntas deben estar cerca de la definición de la funcionalidad, antes de que cada disciplina complete los vacíos por su cuenta.

## Asignen un responsable a cada decisión pendiente

El responsable es la persona encargada de lograr que se resuelva una decisión. Puede necesitar aportes de varias personas más.

En el ejemplo de inscripción, las reglas de participación pueden necesitar aportes de producto, la estructura de la respuesta puede requerir un acuerdo entre frontend y backend, y el mensaje de recuperación puede necesitar una revisión de diseño. Registren a una persona que coordine cada pregunta abierta y cuándo se necesita la respuesta.

«Esperando al backend» oculta demasiado. «Esperando la respuesta acordada para cuando cambia la capacidad; se necesita antes de las pruebas de integración» identifica la dependencia. Agreguen a la persona responsable en el registro real del equipo.

Mantengan esto ligero. Una nota breve junto a la tarea es útil si las personas pueden encontrarla donde trabajan. Un segundo sistema de planificación puede crear otro traspaso que mantener.

## Escriban un traspaso que le permita actuar a la siguiente persona

Un traspaso útil para la funcionalidad ficticia podría decir:

> El formulario cubre carga, éxito, cupo completo y una inscripción existente con los datos de prueba acordados. Al entorno de pruebas todavía le falta la respuesta de capacidad. La integración sigue abierta hasta que el endpoint real se pruebe con esos casos. La persona responsable de la funcionalidad está coordinando esa comprobación antes de la revisión del lanzamiento.

Esa nota identifica qué existe, qué evidencia lo respalda, qué sigue siendo incierto y cuál es la siguiente acción.

Compárenla con «frontend terminado». La etiqueta más corta obliga a la siguiente persona a volver a descubrir todos esos detalles.

Las capturas de pantalla, los datos de prueba, los resultados de las pruebas y un enlace preciso al entorno pueden fortalecer el traspaso. Incluyan la evidencia que responda a la pregunta de la siguiente persona. Eviten volcar un registro completo de actividad en la tarea.

## Distingan estar listo de haber avanzado

El avance describe el trabajo completado. Estar listo describe si ese trabajo puede cruzar un límite específico.

Un formulario puede estar listo para revisión de diseño mientras la integración sigue bloqueada. Un endpoint puede estar listo para pruebas de contrato mientras la funcionalidad completa todavía necesita una decisión sobre el lanzamiento.

Usen esas distinciones en el flujo de trabajo existente del equipo. Ayudan a elegir trabajo útil sin convertir un resultado parcial en una promesa sobre producción.

Para cambios más grandes, acuerden la evidencia desde el principio. Esperar hasta la revisión final para definir «listo» hace que un trabajo razonable parezca incompleto de forma inesperada.

## Revisen los puntos de espera

Cuando se retrase la entrega, revisen dónde se quedó esperando el trabajo y qué información faltaba allí.

Tal vez se discutió la misma pregunta sobre una respuesta en tres lugares. Tal vez el entorno de pruebas no estaba disponible. Tal vez la revisión llegó cuando la implementación ya se había comprometido con una suposición.

Elijan un cambio que elimine esa demora específica: una revisión de contrato más temprana, una persona responsable del entorno o una porción más pequeña que se pueda integrar antes. Más reuniones solo son útiles si resuelven una necesidad concreta de coordinación.

La entrega predecible crece cuando el siguiente paso queda claro. En la próxima funcionalidad que involucre a varios equipos, reemplacen una actualización de estado vaga por la evidencia, la decisión abierta y la persona responsable que alguien necesita para completar el traspaso.
