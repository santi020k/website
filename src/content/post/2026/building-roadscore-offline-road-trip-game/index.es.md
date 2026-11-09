---
title: "Crear RoadScore: un juego de viaje sin conexión para compartir un teléfono"
description: "Cómo diseñé RoadScore alrededor del copiloto, un catálogo sin conexión, sesiones de viaje flexibles y límites de privacidad que mantienen los datos del juego en el dispositivo."
coverImage:
  alt: "Un teléfono abstracto y tres cartas conectadas se organizan alrededor de una ruta naranja que atraviesa un paisaje morado"
---

Los viajes por carretera tienen una clase particular de tiempo vacío. Todos están juntos, pero la experiencia habitual del teléfono lleva a cada persona a una pantalla distinta. Quería construir algo que fuera en la dirección contraria: un teléfono, un juego compartido y más motivos para mirar por la ventana o hablar con quienes van en el carro.

Así nació [RoadScore](https://roadscore.santi020k.com/), un juego de cartas para viajes por carretera en inglés y español, pensado para el teléfono del copiloto.

## Empieza por el límite de seguridad

La decisión de producto más importante también fue la más sencilla: quien conduce no usa RoadScore mientras el vehículo está en movimiento.

Durante la configuración, el grupo elige a un conductor y al menos dos pasajeros. El juego puede rotar la lectura de cartas entre los pasajeros que no conducen o dejar el teléfono en manos de una persona fija cuando pasarlo resulta poco práctico. Esa restricción da forma a la interfaz, las reglas y la redacción de cada carta.

También mantuvo honesto al producto. RoadScore no es un panel para el conductor. Es una actividad compartida para los demás ocupantes del carro.

## Haz que un teléfono se sienta compartido

Un juego con un solo teléfono debe avanzar rápido. Quien está leyendo saca una carta, toca a todas las personas a las que se aplica y asigna puntos o la omite. Los retos de observación y las penalizaciones diferidas pueden permanecer activos en un panel hasta que ocurran. El marcador sigue visible y los errores se pueden corregir sin reiniciar el viaje.

Las cartas abarcan cuatro interacciones básicas:

- **Recompensas y penalizaciones** que pueden aplicarse a uno o varios pasajeros.
- **Retos de observación** para la primera persona que detecte algo afuera.
- **Cartas del conductor** que permiten a los pasajeros reconocer una conducción segura y considerada, o señalar una falta inofensiva propia del viaje.
- **Conversación, trivia y actividades** que no dependen de una puntuación.

La mezcla gratuita Road Trip Mix de RoadScore contiene 350 cartas seleccionadas en inglés y español. Connections y Adults Only son mazos opcionales independientes, y el contenido para adultos queda fuera de las cartas disponibles hasta que el grupo confirma explícitamente que todos los jugadores son adultos y dan su consentimiento.

## Diseña sesiones, no mezclas interminables

Las cartas aleatorias por sí solas no crean un viaje satisfactorio. Un trayecto corto necesita un ritmo distinto al de una ruta panorámica larga, y un grupo que quiere conversar no debería recibir la misma secuencia que uno competitivo.

RoadScore ofrece combinaciones equilibradas, rápidas, panorámicas, de conversación y de caos. Los jugadores pueden terminar tras cierto número de cartas, al alcanzar una meta de puntos, después de un límite de tiempo o cuando el grupo decida. El modo competitivo lleva la cuenta de los líderes individuales; Crew vs. the Road convierte las mismas cartas en una meta cooperativa.

Una cola en el dispositivo utiliza los metadatos de las cartas para variar las interacciones, favorecer el ambiente elegido, respetar los favoritos y las cartas ocultas y evitar que se acumulen retos diferidos. El resultado sigue sorprendiendo, pero tiene un ritmo intencional.

## Trata el funcionamiento sin conexión como el camino normal

RoadScore no exige una cuenta y un túnel no debería interrumpir una partida. La aplicación incluye un catálogo completo y jugable, y consulta un pequeño servicio de Cloudflare para buscar una versión publicada más reciente cuando hay conexión.

Los catálogos publicados son inmutables y se validan contra un esquema. El dispositivo descarga una versión completa, la valida y solo entonces reemplaza su caché. Una respuesta fallida, parcial, anterior o inválida deja intacto el último catálogo válido.

Ese límite también protege la privacidad. El servicio no recibe pasajeros, puntuaciones, viajes, mazos personalizados, favoritos, cartas ocultas ni historial de compras. Devuelve el mismo catálogo a todos los dispositivos.

## Mantén la personalización en el dispositivo

Los jugadores pueden crear mazos personalizados y compartir archivos de mazos RoadScore con versiones. Las importaciones se previsualizan, tienen límites de tamaño y se validan antes de llegar a la biblioteca local. El contenido premium no puede exportarse y los archivos portables nunca incluyen pasajeros, puntuaciones, derechos de acceso ni historial de viajes.

Los favoritos, las cartas ocultas, las reacciones y los últimos 20 viajes completados permanecen en el almacenamiento del dispositivo. Una revancha puede recuperar las personas, la combinación y los ajustes de un viaje anterior sin convertir ese diario privado en un perfil en la nube.

## Construye cada superficie a partir de la misma promesa de producto

La aplicación móvil usa `Expo`, `React Native`, `TypeScript`, `Expo Router` y `Zustand`. El sitio público usa `Astro`; la API del catálogo utiliza `Hono`, Cloudflare Workers y D1. Los contratos compartidos de Zod mantienen alineados la caché móvil y el servicio de publicación, mientras Lumen aporta componentes accesibles y temas semánticos en la aplicación y el sitio.

El inglés y el español, las apariencias clara y oscura, la semántica para lectores de pantalla, las alternativas táctiles y la recuperación con poca fricción son parte de la experiencia principal. No son una ronda de ajustes aparte.

## Sé preciso sobre lo que significa «lanzado»

El sitio web, el servicio de catálogo y el juego de navegador de RoadScore están desplegados hoy. Las compilaciones nativas de iOS y Android tienen sus propios controles: pruebas en dispositivos físicos, cargas a las tiendas, procesamiento, revisión y disponibilidad pública. El sitio mantiene esos enlaces a las tiendas marcados como próximamente hasta que existan direcciones públicas reales.

Esa distinción importa. Una compilación exitosa demuestra que existe un artefacto; no demuestra que alguien pueda descargarlo de una tienda.

RoadScore ya se puede jugar allí donde su estado de lanzamiento está comprobado. Los próximos kilómetros consisten en validar la experiencia nativa con grupos reales, completar los pasos de las tiendas y seguir mejorando el mazo sin comprometer el núcleo privado y sin conexión.

[Juega RoadScore en la web](https://roadscore.santi020k.com/app/) o visita la [página del proyecto RoadScore](/es/portfolio/roadscore/).
