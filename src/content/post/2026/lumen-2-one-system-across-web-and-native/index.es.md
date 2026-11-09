---
title: "Lumen 2.0.0: un sistema para web y plataformas nativas"
description: "Cómo Lumen 2.0.0 extiende un lenguaje de diseño accesible a Astro, React, Web Components, React Native, SwiftUI y Jetpack Compose."
coverImage:
  alt: "Un núcleo luminoso de tokens compartidos conecta cuatro estructuras con formas propias de distintas plataformas"
---

Lumen comenzó con una pregunta sobre la web: ¿puede un sistema de diseño admitir distintos frameworks sin obligarlos a fingir que son el mismo?

La versión 1 respondió esa pregunta con Astro, React y Web Components basados en estándares.

[Lumen 2.0.0](https://lumen.santi020k.com/) da el siguiente paso. Extiende ese lenguaje de diseño compartido a React Native, SwiftUI y Jetpack Compose, y ofrece a las aplicaciones web y nativas la misma base semántica mientras conserva el modelo de desarrollo e interacción de cada plataforma.

Este es el mayor cambio de Lumen desde su primera versión estable. También expresa con más claridad lo que busca ser el sistema: un lenguaje de producto accesible, implementado de forma nativa dondequiera que se ejecute.

## La base web permanece intacta

Lumen 2.0 no reemplaza el sistema web que lo precedió.

Astro sigue siendo la implementación de referencia. React conserva un modelo de componentes y hooks que resulta natural en JSX. Web Components mantiene la vía basada en estándares para aplicaciones independientes de un framework y entornos mixtos.

El catálogo web ahora incluye más de 150 primitivas, respaldadas por estilos compartidos, contratos de interacción, documentación, plantillas y herramientas legibles por máquinas.

Escribí sobre esa arquitectura en [Lumen UI: un sistema, tres frameworks](/es/blog/lumen-ui-one-system-three-frameworks/). La versión 2 lleva el mismo principio más allá del navegador.

## Los tokens compartidos son la base multiplataforma

El centro de Lumen 2.0 es una fuente de tokens independiente de la plataforma.

Los colores, el espaciado, los radios, la tipografía, el movimiento y la elevación comienzan como decisiones semánticas de diseño. Lumen genera después la forma que necesita cada destino:

- valores CSS y TypeScript para la web
- colores hexadecimales y dimensiones numéricas para React Native
- valores `Color`, `CGFloat`, de movimiento y de elevación para SwiftUI
- valores `Color`, `Dp`, `Sp`, de movimiento y de elevación para Jetpack Compose

La fuente es compartida, pero el resultado es nativo de su destino. Las verificaciones automáticas de divergencia comparan las superficies generadas para que un cambio de color o movimiento no se desvíe silenciosamente entre aplicaciones web y nativas.

Esto hace que un papel como una superficie de acento o una acción destructiva sea portable, sin reducirlo a un valor de color copiado entre repositorios.

## Los contratos compartidos no implican renderizadores compartidos

La consistencia entre plataformas suele tratarse como un ejercicio visual. Hacer coincidir colores y radios de esquina es útil, pero no basta.

Lumen comparte las partes de un componente que deberían permanecer estables: propósito semántico, variantes, tamaños, estados, reglas de contenido, expectativas de accesibilidad y funciones de los tokens.

La implementación permanece en la plataforma.

Un botón puede compartir las intenciones primaria, secundaria, discreta y de peligro mientras usa por debajo `Pressable` de React Native, `Button` de SwiftUI o `Button` de Compose. El foco, los gestos, la escala del texto, el comportamiento de los lectores de pantalla y el estado deshabilitado siguen las reglas de la plataforma anfitriona.

Los adaptadores nativos no dependen del DOM, clases CSS, el runtime de Astro ni WebViews. La consistencia surge del contrato, no de incrustar el mismo renderizador en todas partes.

## Tres caminos nativos, un lenguaje de diseño

Lumen 2.0 presenta bases y paquetes de componentes de primera clase para tres ecosistemas nativos:

- `@santi020k/lumen-react-native` para aplicaciones React Native
- `LumenUI` como Swift Package para SwiftUI en plataformas Apple
- `lumen-compose` para aplicaciones Android construidas con Jetpack Compose

Los tres incluyen el nivel nativo universal: temas, texto, iconos, botones, superficies, campos, insignias, separadores, indicadores de carga y un conjunto más amplio de controles compartidos para interfaces habituales de producto.

La paridad sigue siendo deliberada, no absoluta.

Los componentes de selección, deslizamiento y medición pertenecen a SwiftUI y Compose porque esas plataformas ofrecen controles nativos estables y sin dependencias. React Native recibe un control semántico de actualización. SwiftUI incluye selección nativa de fechas y herramientas de atajos y símbolos específicas de macOS. Compose incluye un botón de acción flotante nativo de Material.

La navegación, las escenas de ventanas, las hojas, las ventanas emergentes, los menús del sistema y el resto de la estructura de la aplicación siguen bajo responsabilidad de la aplicación. Lumen debe fortalecer la plataforma, no competir con ella.

## La accesibilidad sigue perteneciendo al contrato

Salir de la web cambia las API, pero no cambia el estándar.

Las áreas táctiles, el comportamiento de carga y deshabilitado, el foco, el texto dinámico, la reducción de movimiento, VoiceOver y TalkBack deben verificarse en el adaptador donde se ejecutan. Un componente no se considera compatible solo porque se renderice.

Su contrato público, comportamiento de accesibilidad, pruebas y guía de uso tienen que existir juntos.

El repositorio ahora incluye documentación de compatibilidad nativa, matrices de componentes, validación de consumidores y entornos interactivos para React Native, plataformas Apple y Android. Estas superficies permiten probar los paquetes reales en lugar de revisar aisladamente los tokens generados.

## La compatibilidad nativa se convierte en un contrato de producción

Lumen 2.0.0 es un hito coordinado de soporte para producción. La base compartida de tokens y los contratos de componentes compatibles de React Native, SwiftUI, Jetpack Compose, WidgetKit y Wear OS pasan juntos a la categoría estable bajo una misma versión mayor.

Ese soporte explicita su evidencia. React Native y SwiftUI requieren consumidores validados y pruebas actuales aprobadas en dispositivos físicos. Compose, WidgetKit, Wear OS y las plataformas sin hardware propio pueden tener soporte con validación limitada en dispositivos: las verificaciones automáticas, los artefactos publicados, la evidencia de actualización y la evidencia inmutable de consumidores reales siguen siendo obligatorios, mientras la matriz de hardware pendiente permanece visible como trabajo posterior al lanzamiento.

Pasar a estable todavía requiere algo más que un número de versión. La versión 2.0.0 se publica solo cuando se aprueba el contrato coordinado, está completa la evidencia requerida de consumidores y dispositivos, se registra el historial de estabilidad, se verifica cada artefacto público y la etiqueta inmutable de la versión apunta a la revisión evaluada.

Después de ese paso, las API nativas compatibles siguen versionado semántico. Las funciones futuras que no hayan alcanzado el nivel de soporte necesario permanecen experimentales, en lugar de ampliar silenciosamente la superficie estable.

## Un sistema debe seguir sintiéndose nativo

Lumen 2.0 no intenta que un sitio web, una aplicación de iPhone y una aplicación de Android rendericen la misma interfaz.

Busca que pertenezcan al mismo producto sin perder lo que hace funcionar a cada plataforma.

La web puede seguir siendo semántica y mejorarse progresivamente. React Native puede conservar su propio modelo de composición y gestos. SwiftUI puede responder a los entornos y convenciones de Apple. Compose puede seguir siendo nativo de Material. Todos los destinos pueden compartir los mismos roles, lenguaje de producto, base de accesibilidad e intención documentada de los componentes.

Esa es la promesa de Lumen 2.0.0: no un renderizador en todas partes, sino un sistema que entiende dónde se ejecuta.

Puedes [explorar la documentación de Lumen](https://lumen.santi020k.com/), [leer las guías multiplataforma](https://lumen.santi020k.com/docs/foundations) o [seguir el proyecto en GitHub](https://github.com/santi020k/lumen).
