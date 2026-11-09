---
title: "Between Contractions: sincronización en pareja con prioridad local"
description: "Cómo diseñé Partner Sync opcional y multiplataforma sin hacer que un contador de contracciones dependa de la red, una cuenta o una base central de historiales."
coverImage:
  alt: "Tres plataformas de dispositivos independientes conectadas mediante una capa opcional de sincronización en la nube alrededor de un contador local"
---

El requisito más importante de un contador de contracciones no es la sincronización.

Es que el contador funcione de inmediato.

[Between Contractions](https://between.santi020k.com/) tiene una función opcional llamada Partner Sync para hogares que quieren coordinar una misma sesión en vivo desde varios dispositivos. Construirla introdujo los problemas habituales de los sistemas distribuidos: varios escritores, conexiones intermitentes, eventos retrasados, bases de datos independientes y compras gestionadas por dos tiendas.

Ninguno de esos problemas puede bloquear la acción principal.

Por eso la arquitectura empieza con una restricción: Iniciar y Detener siguen siendo operaciones locales. La sincronización puede coordinarlas, conciliarlas y reproducirlas, pero no puede ser un requisito para registrar una contracción.

Esta es la historia técnica. La razón personal por la que existe el producto está en el diario oficial bilingüe: [Por qué creé Between Contractions](https://between.santi020k.com/journal/why-i-built-between-contractions/).

## La base de datos local sigue siendo la fuente del historial personal

Cada aplicación es dueña de sus registros en el dispositivo.

Las aplicaciones de Apple guardan las contracciones con SwiftData. Android usa Room. El contador del navegador también almacena su historial localmente. Una familia puede usar el contador gratuito sin cuenta, suscripción ni conexión a mi backend.

Ese límite cumple dos funciones.

Primero, protege la experiencia básica de los fallos de red. Perder la conexión no debería convertir un gran botón de Iniciar en un indicador de carga.

Segundo, evita que el backend se convierta en una base de datos central permanente del historial de trabajo de parto. Partner Sync necesita suficiente estado en el servidor para autenticar a los miembros, coordinar un grupo en vivo y entregar eventos que otro dispositivo todavía no ha aplicado. No necesita reemplazar las bases de datos que ya existen en cada teléfono.

Aquí, priorizar lo local no significa «todo se queda para siempre en un solo dispositivo». Significa que la aplicación local sigue siendo útil y conserva la autoridad sobre su propio historial, mientras compartir es una capa explícita encima.

## Una sala coordina hasta cinco dispositivos independientes

Partner Sync usa una API de Hono en Cloudflare Workers, D1 para los metadatos de suscripciones y grupos y un Durable Object por grupo de dispositivos.

El Durable Object proporciona un único punto de coordinación para cada grupo. Los dispositivos conectados se comunican mediante WebSockets y la sala puede resolver comandos simultáneos, en lugar de pedir a varios teléfonos que decidan de forma independiente qué evento de inicio ganó.

Cuando comienza una contracción, la sala asigna un identificador canónico. Cada dispositivo participante guarda ese identificador con su propio registro local. Los eventos posteriores de detención, intensidad, notas, edición o eliminación pueden así referirse a la misma contracción en SwiftData y Room sin depender de marcas de tiempo ni del orden de inserción.

El modelo permite una persona que paga y hasta cuatro dispositivos unidos, en cualquier combinación de Apple y Android. La facturación determina quién puede crear y mantener el grupo; no cambia quién puede participar en el contador compartido después de unirse.

## Confirmar significa haber guardado, no solo haber recibido

Un acuse de recibo de WebSocket es insuficiente para este producto.

Si un teléfono confirma un evento apenas llegan los bytes, el backend puede descartarlo antes de que la aplicación guarde el registro correspondiente. Una transición a segundo plano, el cierre del proceso o un error de almacenamiento durante ese intervalo harían que el grupo pareciera sincronizado cuando uno de los dispositivos en realidad perdió la actualización.

Partner Sync confirma un evento después de que el cliente lo aplica en SwiftData o Room. Hasta que todos los miembros actuales lo hayan hecho, el intermediario puede conservarlo para entregarlo mediante almacenamiento y reenvío.

Eso hace que reconectarse sea más que «abrir otra vez un socket». Un dispositivo que vuelve tras una interrupción temporal puede solicitar los eventos que no ha guardado, aplicarlos en orden y confirmar el estado local resultante.

El backend sigue sin convertirse en un servicio de historial. Los eventos retenidos existen para completar la entrega, no para ofrecer una segunda copia permanente de cada contracción.

## Un inicio simultáneo es un problema de conciliación

Dos personas pueden tocar Iniciar casi al mismo tiempo.

Crear dos contracciones sería confuso. Esperar indefinidamente a la red sería peor.

La interfaz puede responder de forma optimista mientras la sala del grupo resuelve el comando y devuelve el evento canónico. Si otro dispositivo ganó la carrera, el cliente concilia su estado local temporal con el identificador aceptado, en lugar de crear silenciosamente una segunda sesión.

El mismo principio se aplica cuando la conectividad es deficiente: primero preservar la acción del usuario y luego hacer que la convergencia sea visible y determinista. La consistencia distribuida importa, pero no puede estar por encima del comportamiento local inmediato del contador.

## Las diferencias entre plataformas quedan detrás del protocolo

Las dos aplicaciones nativas no comparten un entorno de ejecución de interfaz.

Apple usa SwiftUI, SwiftData, WidgetKit, WatchConnectivity y StoreKit. Android usa Jetpack Compose, Room, Glance, Wearable Data Layer y Play Billing. Esas diferencias son valiosas porque los widgets, los relojes, la ejecución en segundo plano, las compras y las copias de seguridad son capacidades de cada plataforma, no pantallas genéricas.

La capa compartida es el protocolo:

- Identificadores canónicos de contracciones
- Cargas de eventos con versiones
- Pertenencia al grupo y límites de dispositivos
- Confirmaciones que tienen en cuenta la persistencia
- Comportamiento de reconexión y recuperación de eventos pendientes
- Estados de suscripción y derechos de acceso

Esa es la parte que necesita un significado idéntico. La interfaz y la implementación del almacenamiento solo necesitan respetar el mismo contrato.

## La infraestructura opcional debe seguir siendo opcional

Partner Sync es la parte más distribuida de Between Contractions. También está deliberadamente fuera del camino crítico del contador gratuito.

Esta separación hizo más complejo un punto del sistema y mucho más sencillo todo lo demás. Las aplicaciones nativas pueden ofrecer coordinación multiplataforma en tiempo real cuando una familia la elige, mientras la experiencia principal de Iniciar y Detener sigue siendo rápida, privada y útil por sí sola.

Esa es la arquitectura que quiero para los datos personales: primero la capacidad local, después el uso compartido explícito y un backend sin más autoridad de la que exige la función.

[Explora el proyecto completo de Between Contractions](/es/portfolio/between-contractions/).
