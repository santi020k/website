---
title: "Practica cómo explicar tus decisiones en una entrevista de React"
description: "Un pequeño ejercicio de búsqueda para practicar requisitos, estado, casos de falla y decisiones con ventajas y costos antes de una entrevista técnica de React."
coverImage:
  alt: "Piezas de rompecabezas lilas sueltas forman un puente sencillo con una unión cian entre dos soportes blanco hueso"
---

En enero de 2024 di la charla «Surviving Technical Interviews in React» en ReactJS Medellín. Pensar en voz alta era parte de su enfoque: hacer que otra persona pudiera entender el razonamiento detrás de una implementación.

Mi trabajo con [ReactJS Colombia](/es/portfolio/react-js-colombia/) le da a ese tema un propósito más amplio. Una sesión de práctica útil debería ofrecer algo concreto que las personas puedan intentar, incluso mientras siguen ganando confianza.

Este es un ejercicio para practicar la explicación junto con la implementación, con un alcance lo bastante pequeño para hacerlo por tu cuenta o con alguien más.

## Comienza con una consigna deliberadamente incompleta

«Construye una página que permita buscar en una lista de proyectos».

Antes de abrir el editor, identifica lo que necesitas saber. ¿La lista ya está disponible localmente? ¿Escribir activa una solicitud o hay un botón para enviar la búsqueda? ¿Qué debería mostrar una búsqueda vacía? ¿En qué campos se puede buscar?

Para este ejercicio, elige una lista local pequeña, coincidencias en los nombres de los proyectos sin distinguir mayúsculas y minúsculas, filtrado inmediato y todos los proyectos visibles cuando la búsqueda esté vacía. Di esas suposiciones en voz alta.

Eso convierte una consigna ambigua en una tarea que puedes completar. Si quien te entrevista da restricciones diferentes, ajusta el plan antes de construir sobre una suposición equivocada.

## Explica el modelo de estado más pequeño

Con una lista local fija, la entrada que cambia es la búsqueda. Los proyectos que coinciden se pueden calcular a partir de esa búsqueda y de la lista original durante el renderizado.

Mantener un segundo valor de estado para la lista filtrada introduce otro valor que sincronizar. La [guía de React sobre cómo elegir la estructura del estado](https://react.dev/learn/choosing-the-state-structure) explica por qué conviene evitar el estado redundante.

Una explicación útil es específica: «Guardaré la búsqueda en el estado y calcularé los proyectos visibles, porque el resultado está determinado por la búsqueda y la lista».

Eso le da a la otra persona algo que examinar y cuestionar. Decir «es una buena práctica» revela mucho menos sobre por qué esa elección encaja con esta tarea.

## Haz que el resultado vacío forme parte de la funcionalidad

Una búsqueda que solo funciona cuando encuentra una coincidencia deja sin explicar un caso habitual.

Prueba una búsqueda sin resultados. La página debería distinguir un resultado vacío de una aplicación averiada y facilitar que se cambie o se borre la búsqueda.

Dale al campo una etiqueta significativa. Comprueba que alguien pueda llegar a él y usarlo con el teclado. Mantén comprensibles los enlaces de los proyectos cuando aparezcan varios resultados juntos.

Esos detalles ayudan a completar el comportamiento solicitado. También generan una conversación útil sobre qué merece incluirse en el tiempo disponible.

## Cambia una restricción

Ahora reemplaza la lista local por un servicio de búsqueda remoto.

El problema cambió. Las solicitudes toman tiempo y pueden fallar. Una respuesta a una búsqueda anterior puede llegar después de una respuesta posterior. Una persona puede escribir varios caracteres antes de que termine la primera solicitud.

Haz una pausa y explica las nuevas responsabilidades antes de agregar código: carga, recuperación ante fallas, frecuencia de las solicitudes y asegurarse de que los resultados desactualizados no reemplacen los de la búsqueda actual. La [guía de React sobre la obtención de datos en Effects](https://react.dev/reference/react/useEffect#fetching-data-with-effects) ilustra el problema de las respuestas desactualizadas y analiza alternativas de los frameworks.

En una aplicación existente, revisa primero su enfoque establecido para cargar datos. En el ejercicio, explica qué enfoque eliges y por qué. No necesitas inventar un framework reutilizable de obtención de datos para demostrar que entiendes ese límite.

## Prueba las decisiones que describiste

Para la versión local, comprueba una búsqueda vacía, una coincidencia parcial, distintas combinaciones de mayúsculas y minúsculas y ninguna coincidencia. Para la extensión remota, agrega una respuesta fallida y respuestas que lleguen en un orden distinto al de las solicitudes.

Explica qué revelaría cada caso. Una lista de pruebas es más fácil de evaluar cuando se conecta directamente con un comportamiento que prometiste.

Si se acaba el tiempo, describe lo que falta y su consecuencia. «La versión remota todavía necesita protección contra respuestas desactualizadas» es más útil que una afirmación vaga de que a la solución solo le falta pulirse.

## Practica con una persona que escuche

Pídele a alguien que escuche buscando tres cosas: suposiciones que nunca expresaste, cambios que no pudo seguir y afirmaciones que tu ejemplo no demostró. Luego repite el ejercicio con una mejora.

Estás practicando cómo hacer que tus decisiones técnicas se puedan revisar mientras resuelves un problema pequeño. Esa habilidad también importa en la revisión cotidiana de código y en la programación en pareja.

Para conocer la sesión original, puedes [ver la charla sobre entrevistas de React](https://www.youtube.com/watch?v=UtBZP93cOUs) y usar el ejercicio anterior como una ronda de práctica posterior.
