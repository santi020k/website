---
title: "Por qué pasé de editores basados en VS Code a Zed"
description: "Por qué Zed se convirtió en mi editor preferido: agilidad al trabajar en varios proyectos, integraciones flexibles de IA y Dep Beacon disponible como extensión."
coverImage:
  alt: "Tres paneles flotantes en blanco cálido y lila conectados mediante caminos cian a un núcleo central morado"
---

Pasé de editores basados en VS Code a Zed por dos razones: cómo se siente al tener varios proyectos abiertos y lo bien que integra distintas herramientas de IA.

El rendimiento fue lo que más marcó la diferencia. Para mi forma de trabajar en varios proyectos a la vez, Zed ha sido la mejor experiencia de edición que he encontrado. Las integraciones de IA hacen que esa elección sea aún más útil: puedo conservar el editor que me gusta y tener opciones para la asistencia que uso dentro de él.

## Mi jornada de trabajo abarca más de un repositorio

Una sola ventana de proyecto es apenas una parte de la situación. Cuando trabajo en varios proyectos, necesito moverme entre bases de código distintas sin perder el hilo de lo que estoy haciendo.

Eso cambia lo que valoro en un editor. Abrir un archivo, recorrer el código y pasar a otro proyecto son acciones pequeñas, pero las repito durante todo el día. La capacidad de respuesta me importa especialmente cuando todos esos proyectos están abiertos al mismo tiempo.

Aquí es donde Zed destaca en mi experiencia. Se siente rápido al moverme entre proyectos y eso facilita mantener la concentración en el trabajo. Le dedico menos atención al editor en sí.

Estoy describiendo cómo se siente en mi flujo de trabajo. No he realizado una comparación controlada de uso de memoria, tiempo de inicio ni latencia de entrada, así que no le asigno un porcentaje a la mejora. Mi razón para cambiar es más sencilla: trabajar en varios proyectos se siente mejor en Zed.

## Quiero flexibilidad en mi uso de la IA

El rendimiento ya sería una razón de peso para cambiar. La integración de IA me da otra razón para quedarme.

Me gusta tener distintas opciones de IA sin que la elección del editor dependa de una sola. El editor es donde leo código, hago cambios y reviso el resultado. Quiero que ese entorno siga siendo útil a medida que cambien mis preferencias de herramientas de IA.

Zed admite tanto modelos configurados para sus propias funciones de IA como agentes externos de programación. Son vías de integración distintas: los proveedores de modelos alimentan las funciones nativas del asistente de Zed, mientras que los agentes externos se conectan mediante Agent Client Protocol y suelen administrar su propia autenticación y configuración. Zed explica esa diferencia en su [documentación de agentes](https://zed.dev/docs/ai/agents).

Para acceder a modelos, Zed también documenta [conexiones con las API de proveedores](https://zed.dev/docs/ai/use-api-access), entre ellos Anthropic, OpenAI y Google AI. El beneficio práctico para mí es poder elegir: mantener un entorno de edición consistente y escoger la integración de IA adecuada para el trabajo.

Esa flexibilidad es lo que valoro. La asistencia de IA debe estar lo bastante cerca del código para que pueda inspeccionar sus propuestas, entender los cambios y decidir qué conservar.

## Dep Beacon ya está disponible en Zed

También hay una pieza de mis propias herramientas en este cambio: [Dep Beacon](/es/portfolio/dep-beacon/) ahora tiene una [extensión publicada para Zed](https://zed.dev/extensions/dep-beacon-lsp).

Originalmente construí Dep Beacon para mantener las decisiones sobre dependencias cerca del manifiesto. El estado de las versiones, las opciones de actualización, el contexto de los espacios de trabajo de pnpm y los hallazgos de seguridad son más útiles junto a la dependencia que estoy revisando. Escribí sobre esa motivación en el [artículo original de la versión para VS Code](/es/blog/dep-beacon-vscode-extension/).

La integración de Zed lleva esa idea al editor mediante un servidor de lenguaje. Ofrece diagnósticos de dependencias, información al pasar el cursor, enlaces a npm y acciones de actualización individuales o en grupo. El núcleo compartido de análisis sirve a ambos editores; cada integración presenta esa información mediante las funciones de su editor. El [repositorio del proyecto](https://github.com/santi020k/dep-beacon) documenta la arquitectura y los flujos admitidos.

Para probarla, instala [Dep Beacon desde el registro de extensiones de Zed](https://zed.dev/extensions/dep-beacon-lsp) y luego abre `package.json`, `pnpm-workspace.yaml` o `pnpm-workspace.yml`. La [guía de configuración de Zed](https://beacon.santi020k.com/docs/zed-extension) explica las señales y acciones de actualización disponibles.

Tener una herramienta que construí disponible en el editor que ahora prefiero hace que el cambio sea especialmente satisfactorio.

## Mi tema también vino conmigo

También añadí [Santi020k Theme al registro de extensiones de Zed](https://zed.dev/extensions/santi020k-theme). Sus variantes clara y oscura llevan a Zed la misma paleta violeta tranquila, de modo que cambiar de editor puede seguir sintiéndose familiar.

La [familia de temas](/es/portfolio/santi020k-theme/) ahora va más allá de los editores: incluye configuraciones de Codex, Chrome, terminales, Raycast, Slack, IDE de JetBrains y Xcode, además de VS Code y Zed. El [sitio del tema](https://theme.santi020k.com/) reúne las aplicaciones compatibles y sus guías de instalación.

Tener tanto Dep Beacon como mi tema en Zed hace que el espacio de trabajo se sienta más propio.

## Elige según el trabajo que realmente haces

Para mí, la combinación decisiva es la agilidad al trabajar en varios proyectos y la buena integración con distintas herramientas de IA. Son cosas que uso todo el día, así que pesan más que una lista más larga de funciones.

Si estás considerando un cambio parecido, pruébalo con los proyectos que normalmente mantienes abiertos a la vez. Muévete entre ellos, revisa un cambio real y usa la integración de IA que te importa. Comprueba también las herramientas de lenguaje y las extensiones de las que depende tu trabajo.

Esa es la experiencia que quiero de un editor: mantener varios proyectos en marcha, elegir la asistencia que ayuda y dedicar la mayor parte de mi atención al código. Zed encaja muy bien con eso para mí.
