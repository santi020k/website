---
title: "Coolstead: refrigeración para Mac con la seguridad primero"
description: "Qué implica diseñar una utilidad nativa de control de ventiladores con solicitudes limitadas, sensores inválidos, comportamiento reversible y macOS como última capa de seguridad."
coverImage:
  alt: "Señales de sensores térmicos atraviesan límites de seguridad mediante un ventilador central"
---

La versión más simple de una aplicación de control de ventiladores también es la versión que no quiero construir.

Leer una temperatura. Elegir una velocidad. Escribir esa velocidad.

Esa descripción deja por fuera casi todo lo que hace confiable al software que interactúa con hardware: sensores inciertos, distintos rangos de ventilación, dispositivos sin ventilador, límites de privilegios, limpieza durante el ciclo de vida y el hecho de que macOS ya tiene una política térmica que sigue siendo la última capa de seguridad.

[Coolstead](/es/portfolio/coolstead/) es mi experimento con un enfoque más tranquilo. Es una aplicación nativa de la barra de menús que empieza a refrigerar antes que la política predeterminada de ventilación de macOS, aplica una curva gradual y devuelve el control cada vez que se desactiva la refrigeración equilibrada.

La idea del producto es la «refrigeración estable». La idea de ingeniería es «limitado y reversible».

## Empezar antes no tiene por qué significar usar el máximo

Muchas utilidades de ventilación facilitan alcanzar la velocidad máxima. Eso puede reducir la temperatura rápidamente, pero no es la única estrategia útil.

Coolstead usa una curva de ventilación gradual. A medida que cambia la señal térmica, el objetivo se mueve suavemente en lugar de saltar directamente al resultado final de la curva. El objetivo es responder antes y mantener una experiencia más silenciosa y menos brusca.

El proceso auxiliar limita cada solicitud dos veces:

- al rango mínimo y máximo que informa el ventilador
- a no más del 75 % de ese rango informado

Ese segundo límite es una decisión de producto, no una garantía del hardware. macOS sigue siendo responsable de la seguridad térmica del equipo. Coolstead intenta influir en la comodidad y en el comportamiento sostenido dentro de un margen conservador.

## Una entrada inválida significa que no se escribe

Los datos de los sensores no son una promesa.

Una lectura puede faltar, no estar soportada, estar desactualizada o ser claramente inválida. Un ciclo de control que trata cada valor como confiable crea el peor tipo de falla: una acción segura de sí misma basada en una entrada incorrecta.

Coolstead desactiva las escrituras en los ventiladores cuando el estado de los sensores no tiene la validez suficiente para sustentarlas. La interfaz de monitoreo puede explicar qué información está disponible, pero la ruta privilegiada no adivina.

Este es un patrón que quiero ver en más automatizaciones: la incertidumbre debería reducir la autoridad.

Cuando una herramienta sabe menos, debería hacer menos.

## Volver al modo automático forma parte de cada función

La acción más importante de un controlador de ventiladores puede ser la que cede el control.

Coolstead devuelve cada ventilador controlado al modo automático cuando se desactiva la refrigeración activa, cuando se pierde la conexión o cuando se cierra la aplicación. La limpieza no es un botón opcional de «restablecer» escondido en los ajustes. Forma parte del ciclo de vida.

Ese requisito afecta la arquitectura desde el principio. La aplicación y el proceso auxiliar necesitan un protocolo acotado. Hay que registrar el estado de los ventiladores controlados. Las rutas de terminación deben poder probarse. Una falla no puede dejar un objetivo manual anterior como si el producto todavía estuviera presente.

La reversibilidad no es una tarea de acabado. Es el modelo de seguridad.

## Los privilegios deben mantenerse acotados

Monitorear y escribir son capacidades diferentes.

La aplicación puede compilarse y ejecutarse en modo de solo monitoreo con firma ad hoc. El control activo de ventiladores requiere aprobar un proceso auxiliar privilegiado incluido en la aplicación y contar con una identidad Developer ID adecuada.

Esa separación hace más seguro el desarrollo local y concentra el trabajo con privilegios elevados en una superficie mucho menor. La interfaz no se vuelve privilegiada solo porque una operación lo requiera.

La aplicación también admite Mac sin ventilador en modo de solo monitoreo. Que el hardware de control no sea compatible no debería convertir todo el producto en una pantalla de error cuando todavía hay información térmica útil disponible.

## El hardware estudiado mediante ingeniería inversa necesita textos honestos

Coolstead usa el comportamiento de SMC obtenido mediante ingeniería inversa y se apoya en el paquete Swift `macos-smc-fan`, con licencia MIT, para el transporte y el soporte de modos de ventilación de Apple Silicon.

Eso significa que la compatibilidad con el hardware puede variar según el modelo y la versión de macOS. El producto debería decirlo claramente.

En las utilidades del sistema existe la tentación de escribir mensajes de marketing contundentes alrededor de comportamientos inciertos de la plataforma. Prefiero hacer visibles los límites:

- Coolstead no está afiliado a Apple.
- El comportamiento del hardware varía.
- El proceso auxiliar privilegiado requiere un Developer ID.
- macOS sigue siendo la última capa de seguridad térmica.

La confianza crece más rápido con un límite claro que con una promesa exagerada.

## Las utilidades pequeñas contienen lecciones sobre sistemas

Coolstead sigue siendo un experimento, pero ya ha reforzado una lista útil para el software que puede afectar a un equipo:

1. Limitar cada acción solicitada.
2. Aplicar los cambios gradualmente cuando no sea necesario un movimiento brusco.
3. Tratar los datos ausentes como un motivo para detenerse.
4. Mantener los privilegios en una parte menor que el producto completo.
5. Hacer automático el regreso al comportamiento predeterminado.
6. Permitir el monitoreo cuando el control no esté disponible.
7. Documentar la incertidumbre como parte de la función.

Esas reglas se aplican más allá del control de ventiladores. Se aplican a la automatización de despliegues, los agentes de IA, las herramientas de bases de datos y cualquier sistema en el que una acción útil pueda volverse costosa cuando el contexto es incorrecto.

El resumen completo del proyecto está en la [entrada de Coolstead en el portafolio](/es/portfolio/coolstead/).
