---
title: "Lumen UI: un sistema, tres frameworks"
description: "Cómo construí 123 primitivas accesibles para Astro, React y Web Components compartiendo tokens y comportamiento, sin imponer un único modelo de ejecución."
coverImage:
  alt: "Primitivas y tokens de interfaz compartidos fluyen hacia tres implementaciones distintas de frameworks"
---

«Funciona con varios frameworks» puede significar cosas muy diferentes.

A veces significa un archivo CSS que cualquier aplicación puede cargar. A veces significa una implementación de React envuelta para otros entornos. Y a veces significa tres bibliotecas de componentes que comparten nombre pero divergen en comportamiento.

Quería una definición más sólida para [Lumen UI](https://lumen.santi020k.com/).

Lumen es un sistema para varios frameworks con 123 primitivas accesibles para Astro, React y Web Components basados en estándares. Los paquetes comparten tokens, contratos, estilos y patrones de interacción, mientras conservan el modelo de desarrollo nativo de cada framework.

El sistema es compartido. Los entornos de ejecución no pretenden ser idénticos.

## Empieza por el contrato, no por la envoltura

El contrato del componente es el centro de Lumen.

Un botón debería tener las mismas funciones visuales, semántica de deshabilitado, expectativas de carga, comportamiento del foco y tratamiento de reducción de movimiento, tanto si la aplicación lo escribe como marcado Astro, JSX o un elemento personalizado.

Eso no exige que el código de implementación sea idéntico.

El paquete de Astro puede emitir HTML semántico y usar un pequeño runtime de mejora progresiva para el comportamiento interactivo. El paquete de React puede usar componentes y hooks que encajen con el modelo de estado de React. El paquete de Web Components puede registrar elementos personalizados y apoyarse en los estándares del navegador.

Compartir comportamiento es más importante que compartir una abstracción de ejecución.

## Astro debe seguir siendo Astro

Una razón por la que construí Lumen fue la frustración con las bibliotecas de componentes que obligan a Astro a instalar un framework de frontend para interacciones básicas.

El paquete de Astro trata el HTML estático como opción predeterminada. Las aplicaciones montan un único runtime `UIPrimitives`, y esa pequeña capa cliente mejora el marcado compatible de Lumen.

Eso significa que una aplicación de Astro puede usar diálogos, pestañas, menús y otras primitivas interactivas sin convertir cada componente en una isla hidratada.

El modelo encaja con la arquitectura de Astro:

- renderizar HTML útil en el servidor
- mantener la semántica antes de JavaScript
- mejorar solo el comportamiento que necesita un cliente
- conservar los recorridos de teclado y reducción de movimiento

Un sistema de diseño debe apoyar las fortalezas del framework anfitrión, no borrarlas.

## React recibe una interfaz propia de React

El paquete de React expone componentes y hooks de comportamiento que resultan naturales en JSX.

Las aplicaciones importan una vez la hoja de estilos compartida y luego componen los componentes de Lumen dentro de su modelo existente de estado y renderizado. No hay ceremonias de elementos personalizados ni runtime de Astro.

Lo importante es que el componente de React siga el mismo contrato que sus equivalentes. Los tokens, las variantes, las reglas de accesibilidad y las expectativas de interacción permanecen alineados.

Aquí los metadatos compartidos se vuelven valiosos. La interfaz del paquete se puede validar contra el registro, en lugar de depender únicamente de que la documentación se mantenga actualizada.

## Web Components abre el camino de los estándares

El paquete de elementos proporciona elementos personalizados basados en estándares.

Eso ofrece a Lumen una vía para aplicaciones que no usan Astro ni React, y para entornos mixtos que quieren marcado portable. El paquete registra los elementos una sola vez, carga la misma base visual y expone el comportamiento de los componentes mediante API nativas del navegador.

Web Components no es una implementación de respaldo. Es uno de los tres destinos de primera clase.

Esa distinción afecta a las pruebas y la documentación. Los ejemplos deben mostrar la forma nativa de cada framework, y las comprobaciones de interacción deben demostrar el contrato en los tres.

## El CSS independiente va antes de la integración con Tailwind

Lumen no requiere una configuración de Tailwind.

Los componentes incluyen CSS y tokens independientes. Las aplicaciones Tailwind usan una integración explícita de capas de cascada para que los estilos base de Tailwind, los componentes de Lumen y las utilidades queden en el orden previsto.

Ese límite importa para la adopción. Un sistema de diseño no debería obligar a todos sus consumidores a usar la misma herramienta de estilos en compilación. También debería documentar la ruta exacta de integración cuando una herramienta popular cambia el comportamiento de la cascada.

La base CSS compartida mantiene coherente el lenguaje visual mientras cada paquete se concentra en el marcado y la interacción.

## La accesibilidad pertenece a la primitiva

Lumen trata el marcado semántico, la navegación por teclado, la gestión del foco y el soporte de reducción de movimiento como parte de la definición del componente.

Las aplicaciones todavía deben usar los componentes con responsabilidad. Una biblioteca no puede elegir una etiqueta útil ni una jerarquía de encabezados para el producto. Sí puede hacer que el comportamiento correcto sea el más fácil.

El repositorio valida esto mediante pruebas de interacción, comprobaciones de accesibilidad, cobertura visual y verificaciones de contratos entre frameworks.

Para un ejemplo concreto a nivel de aplicación, consulta las [pruebas de foco de diálogos y la lista de verificación de teclado con Playwright](/es/blog/playwright-accessibility-checks-that-teams-keep-running/#test-the-whole-dialog-focus-cycle). Ejercitan la entrada del foco, ambos límites de tabulación, el cierre y el retorno del foco en este sitio web.

La accesibilidad no es una insignia aplicada a toda la biblioteca. Es un conjunto de decisiones repetidas en 123 primitivas.

## El sistema de diseño necesita contexto legible por máquinas

Los sistemas de diseño modernos los usan más personas y herramientas que los desarrolladores que leen una página de documentación.

Lumen incluye:

- una biblioteca de la comunidad de Figma
- una skill portable para agentes
- un servidor MCP
- `llms.txt`
- un registro legible por máquinas
- recetas y grupos de archivos instalables

Estas superficies dan a las herramientas de diseño y a los agentes de programación una forma de descubrir el sistema real en lugar de adivinar a partir de un prompt.

El paquete MCP puede listar componentes, obtener el código vigente, exponer props y tokens, y orientar a un agente hacia las reglas que aplican a una composición. La skill del agente enseña patrones de selección, temas y verificación.

No se trata de generar más código. Se trata de dar al código generado la misma fuente de verdad que usan los colaboradores humanos.

## La validación protege la promesa compartida

Los sistemas entre frameworks fallan silenciosamente cuando un paquete gana una prop, un ejemplo cambia o un comportamiento se corrige en un solo destino.

La validación de Lumen incluye:

- compilaciones y comprobaciones de tipos
- pruebas unitarias y de interacción
- pruebas de accesibilidad y visuales
- verificaciones del tamaño de los bundles
- sincronización del registro
- verificaciones de tokens de Figma
- verificaciones de contratos entre frameworks
- ensayos de publicación de paquetes
- verificaciones de snapshots y evaluación de MCP
- pruebas básicas de paquetes consumidores

La lista exacta evolucionará. El principio es estable: una promesa compartida necesita evidencia automatizada.

## Un lenguaje, no una implementación

La arquitectura de Lumen se resume en una distinción que me gustaría ver en más sistemas de diseño.

La consistencia no requiere que todos los frameworks ejecuten la misma implementación de un componente. Requiere que cada implementación respete el mismo contrato de producto.

Astro puede seguir siendo progresivo. React puede seguir siendo React. Web Components puede seguir siendo elementos estándar. Los usuarios siguen recibiendo un lenguaje visual, un sistema de tokens, una base de accesibilidad y una forma documentada de razonar sobre los componentes.

Puedes explorar la [documentación de Lumen UI](https://lumen.santi020k.com/), usar la [biblioteca de Figma](https://www.figma.com/community/file/1662337342676541513), ver el [código en GitHub](https://github.com/santi020k/lumen) o leer el [caso de estudio resumido del portafolio](/es/portfolio/lumen-ui/).
