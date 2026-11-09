---
title: "Por qué construí Between Contractions"
description: "Cómo la espera de Aarón se convirtió en un temporizador de contracciones tranquilo y privado para web, iOS, Android, relojes, widgets y dispositivos de acompañantes."
coverImage:
  alt: "Dos pulsos rítmicos de tiempo se sincronizan entre dispositivos privados alrededor de una luz central cálida"
startHere:
  label: "Por qué creo cosas"
  reason: "Cómo la espera de mi hijo se convirtió en una herramienta tranquila y privada centrada en una interacción importante."
---

Algunos proyectos nacen de una oportunidad de mercado. Between Contractions nació mientras Alejandra y yo esperábamos a nuestro hijo, Aarón.

Ya había construido [Aaronmgz](/es/portfolio/aaronmgz/) como un lugar cálido donde familiares y amigos pudieran acompañar nuestra espera. Between Contractions surgió de una parte más práctica de esa misma experiencia: pensar en el parto y notar cuántos temporizadores de contracciones se sentían recargados, comerciales o más difíciles de usar de lo que ese momento permite.

La regla del producto se volvió sencilla: quitar todo lo que no ayuda.

## Una acción debe sostener la experiencia

La interacción central debería ser evidente incluso desde el otro lado de la habitación. Tocar cuando comienza una contracción. Volver a tocar cuando termina.

La duración, la frecuencia entre inicios y el historial reciente deberían aparecer sin pedirle a alguien que recorra un panel mientras acompaña a una persona en trabajo de parto. Si la interfaz necesita una explicación en ese momento, ya ha pedido demasiado.

Esa restricción dio forma a todas las plataformas. Las superficies del navegador, el teléfono, el reloj, los widgets y el escritorio no necesitan diseños idénticos, pero sí deben conservar el mismo modelo mental.

## Priorizar lo local es parte del producto, no un eslogan

El temporizador principal es gratuito, no tiene anuncios y se puede usar sin cuenta. La versión del navegador guarda el historial en el dispositivo actual. Las aplicaciones nativas siguen el mismo principio: usan el almacenamiento de la plataforma y la copia de seguridad opcional del sistema operativo, en vez de enviar cada contracción a un servicio compartido.

Esa decisión elimina toda una categoría de tratamiento innecesario de datos. También hace que la herramienta básica sea resistente: medir el tiempo no depende de crear una cuenta ni de mantener una conexión a internet.

Algunas familias sí quieren que una pareja, una doula o un familiar coordine el mismo temporizador en vivo. Por eso existe Partner Sync como una función separada y explícita. Los datos compartidos usan su propio flujo de vinculación y servicio, en lugar de cambiar silenciosamente el modelo de privacidad del temporizador gratuito.

La diferencia importa. «Privado por defecto» debería describir la arquitectura, no solo el texto de una página de presentación.

## El mismo producto, construido de forma nativa

Entre enero y agosto de 2026, la idea creció desde un temporizador en el navegador hasta convertirse en un producto multiplataforma.

La experiencia web usa Astro y TypeScript para ofrecer un sitio bilingüe rápido y un temporizador sin instalación. Las aplicaciones de Apple usan SwiftUI y SwiftData, con widgets, Live Activities, soporte para reloj y una experiencia complementaria en macOS. Android usa Kotlin, Jetpack Compose, Room, widgets de Glance y Wear OS.

Elegí aplicaciones nativas porque las partes más útiles de este producto están cerca de cada sistema operativo: widgets, interacciones de reloj, notificaciones, atajos, integraciones de salud, comportamiento en segundo plano y copias de seguridad de la plataforma. Un entorno compartido de interfaz habría reducido parte de la duplicación, pero también habría dificultado tratar esas partes como superficies principales del producto.

El código se comparte donde hacerlo aporta valor: lenguaje del producto, contratos del servicio, reglas de validación, verificaciones de publicación y la definición central del comportamiento del temporizador. Las interfaces siguen siendo nativas donde las plataformas realmente difieren.

## La orientación necesita un límite visible

La aplicación puede reconocer el conocido patrón temporal 5-1-1: contracciones separadas por unos cinco minutos, de aproximadamente un minuto de duración, durante cerca de una hora.

No puede conocer la historia clínica de una persona, su plan de atención individual, el tiempo de traslado ni si existe otro síntoma urgente. Por eso la alerta invita a seguir las indicaciones del equipo de atención; nunca es un diagnóstico ni una garantía sobre cuándo ir al hospital.

Ese límite es especialmente importante en un producto creado para un momento de relevancia médica. Los avisos claros no bastan por sí solos: la interfaz, el lenguaje de las notificaciones y el diseño de las funciones deben evitar afirmar una certeza que el software no tiene.

## Conectado con la razón de su existencia

[Aaronmgz](/es/blog/building-aaronmgz-as-a-family-platform/) y Between Contractions son productos distintos, pero pertenecen a la misma historia familiar.

Uno es un hogar digital duradero para Aarón. El otro es una herramienta enfocada que construí mientras nos preparábamos para su llegada. Conectarlos hace visible la motivación sin mezclar sus funciones ni sus datos.

El temporizador del navegador [ya está disponible](https://between.santi020k.com/app/). Las aplicaciones de iOS y Android están preparadas para publicarse, y su disponibilidad depende de los tiempos de revisión de App Store y Google Play.

El proyecto creció en tamaño. Su promesa siguió siendo pequeña: ayudar a una familia a llevar el tiempo sin adueñarse del momento.

[Explora el proyecto Between Contractions](/es/portfolio/between-contractions/).
