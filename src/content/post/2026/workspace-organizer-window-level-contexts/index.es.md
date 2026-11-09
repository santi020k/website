---
title: "Workspace Organizer: cambiar de contexto a nivel de ventana"
description: "Por qué construí un gestor nativo de espacios de trabajo para macOS basado en ventanas individuales, API públicas, diseños adaptables y automatización que respeta la privacidad."
coverImage:
  alt: "Ventanas de aplicaciones dispersas atraviesan un motor de distribución y forman tres espacios de trabajo organizados"
---

La mayor parte de mi trabajo ocurre dentro de un pequeño conjunto de aplicaciones.

El contexto cambia constantemente.

Safari puede tener ventanas de navegación personal, de un cliente, de documentación y de un producto que estoy construyendo. Lo mismo ocurre con terminales, editores, Finder y herramientas de IA. Cambiar entre aplicaciones no permite distinguir esos contextos.

Por eso construí [Workspace Organizer](https://workspace.santi020k.com/), una aplicación nativa para macOS que agrupa ventanas individuales en espacios enfocados dentro de espacios de trabajo con nombre.

Un espacio de trabajo puede ser Personal, Trabajo o un proyecto. Dentro de él, espacios como Navegador, Código e IA reúnen las ventanas que corresponden. La aplicación recuerda las asignaciones y las distribuciones, y luego restaura la escena pertinente desde la aplicación, la barra de menús, el teclado, el trackpad, Atajos, comandos URL o una CLI.

La unidad de organización es la ventana.

## Las API públicas definen el límite del producto

Workspace Organizer no usa API privadas de Spaces de macOS.

Detecta ventanas estándar mediante la API pública de Accesibilidad, las mueve y redimensiona con capacidades admitidas del sistema y usa AppKit para ocultar aplicaciones cuando ninguna de sus ventanas pertenece al contexto activo.

Eso crea algunas restricciones.

macOS controla Spaces y Stage Manager. Una aplicación de terceros no puede recrear de forma segura cada parte de esos sistemas mediante API públicas. En cambio, Workspace Organizer ofrece su propio modelo virtual de contextos sobre las ventanas que puede detectar y controlar.

Ese límite está documentado porque afecta la configuración. Para que el cambio sea lo más determinista posible, las ventanas asignadas deberían estar en un solo escritorio de macOS y Stage Manager debería estar desactivado. Si Stage Manager permanece activo, sus reglas de agrupación siguen vigentes.

Una herramienta nativa de productividad debería explicar dónde el sistema operativo sigue al mando.

## Las aplicaciones compartidas necesitan reglas por ventana

Ocultar una aplicación es fácil cuando todas sus ventanas pertenecen al mismo contexto. El problema interesante aparece cuando una aplicación se comparte entre espacios.

Si una ventana de Safari pertenece a Trabajo y otra a Personal, el cambio no puede ocultar Safari por completo. Workspace Organizer lleva al frente las ventanas de destino y mantiene detrás las inactivas.

La aplicación reconoce perfiles de Safari cuando Safari expone los controles y las etiquetas pertinentes. Usa la interfaz pública de Automatización de Safari únicamente para los identificadores y nombres de las ventanas. Los perfiles de Chrome, Edge, Brave, Vivaldi, Chromium y Firefox se identifican en la medida de lo posible a partir de metadatos de las ventanas.

El producto almacena el nombre del perfil cuando es útil, no el título completo ni la URL.

Ese límite de privacidad todavía permite que una regla distinga entre «perfil personal del navegador» y «perfil del navegador del cliente».

## Las distribuciones deben sobrevivir a los cambios de pantallas

Un rectángulo guardado no es un modelo completo de distribución.

Trabajar solo con el portátil, conectar un monitor externo o cambiar la disposición del escritorio puede alterar el espacio de coordenadas. Restaurar las mismas posiciones absolutas puede dejar ventanas fuera de la pantalla o apiladas de forma inadecuada.

Workspace Organizer guarda perfiles de distribución relativos a las pantallas y los transforma cuando cambia la disposición de las pantallas conectadas. Las distribuciones de respaldo o aprendidas con grandes superposiciones se organizan automáticamente en mosaico. Elegir **Guardar distribución** conserva una superposición intencional.

La aplicación puede limitar la activación a todas las pantallas o solo a la que está bajo el puntero. Cambiar por pantalla evita ocultar una aplicación completa cuando esa acción alteraría sus ventanas en otra pantalla.

El modelo de distribución sigue al contexto y respeta el hardware actual.

## Smart Assist hace que las sugerencias se puedan explicar

La aplicación sugiere un destino para las ventanas sin asignar a partir de evidencia local.

Cada sugerencia puede explicar por qué coincide. La persona puede aceptarla, cambiar el destino, descartarla o reparar una regla de coincidencia guardada que haya quedado desactualizada.

Smart Organize construye un plan editable antes de cambiar el espacio de trabajo. Los cambios aplicados se pueden deshacer, incluso después de volver a abrir la aplicación, cuando la estructura del espacio de trabajo todavía coincide con la operación registrada.

La aplicación puede aprender de elecciones aceptadas repetidamente y, de forma opcional, asignar un destino de alta confianza después de aceptar el mismo patrón tres veces seguidas. La asignación automática sigue siendo visible, se puede deshacer con un clic y se puede desactivar por aplicación.

Este es un mejor modelo de inteligencia local que un botón de «organizar todo» sin explicación:

- mostrar el plan
- mostrar la evidencia
- permitir que la persona lo edite
- registrar el cambio
- permitir deshacerlo

## Cambiar de contexto necesita más de una interfaz

Distintas transiciones necesitan distintos controles.

Una aplicación visual es útil para definir espacios de trabajo, asignar ventanas o revisar una distribución. Un selector en la barra de menús es más rápido para cambios habituales. Los atajos de teclado numerados funcionan cuando el orden de los espacios resulta familiar. Un selector de uso reciente centrado en el contexto ayuda a volver al último espacio usado. Un buscador de ventanas ayuda cuando la persona recuerda la aplicación o el título, pero no el contexto asignado.

Workspace Organizer también admite:

- atajos configurables de enfoque direccional
- navegación hacia atrás y adelante entre espacios
- un gesto opcional de trackpad
- atajos globales fijados
- selectores en la muesca y en el borde superior
- horarios y activadores por disposición de pantallas
- App Intents y acciones nativas de Atajos
- un esquema URL `workspace-organizer://` validado
- una CLI incluida que respeta la privacidad

No son distintas maneras de mostrar la misma pantalla. Cubren distintas distancias entre la intención y la acción.

## La automatización no debería exponer el espacio de trabajo

La CLI puede listar los contextos configurados, consultar el contexto activo, abrir un espacio de trabajo o un espacio y transmitir eventos de cambio de contexto.

No expone títulos de ventanas, URL ni metadatos de documentos.

El esquema URL acepta un conjunto definido de comandos validados. Las acciones nativas de Atajos usan selectores dinámicos de espacios de trabajo y espacios. El modelo de lenguaje de Apple que se ejecuta en el dispositivo puede ayudar a interpretar comandos admitidos del espacio de trabajo cuando está disponible; en los demás casos se usa coincidencia local.

La automatización recibe suficiente información para actuar sin convertir la aplicación en una exportación de todo lo visible en el escritorio.

## Priorizar lo local también requiere una estrategia de sincronización

Los datos de los espacios de trabajo permanecen locales por defecto.

Las personas pueden exportar un documento JSON versionado e importarlo en otro Mac, combinando o reemplazando los datos. La importación crea primero una copia de seguridad.

La sincronización opcional mediante iCloud Drive usa un documento completo filtrado para proteger la privacidad, con la regla de que prevalece la última escritura. Los datos de aprendizaje de Smart Assist no se sincronizan.

Esto es deliberadamente más sencillo que un servicio propio de cuentas y sincronización. La aplicación usa la relación de almacenamiento privado que la persona ya tiene con la plataforma y mantiene los datos sensibles de aprendizaje en el Mac de origen.

## El producto incluye su sistema de distribución

Workspace Organizer es una aplicación nativa, pero el producto completo también incluye:

- un sitio de presentación y registro de cambios hecho con Astro
- versiones de la aplicación firmadas y notarizadas
- una prueba de 14 días y activación de licencia
- actualizaciones con Sparkle para descargas directas
- instalación y actualizaciones mediante un cask de Homebrew
- automatización de versiones y del appcast
- pruebas de accesibilidad y de navegador
- diagnósticos que respetan la privacidad

La descarga directa y el cask de Homebrew instalan la misma aplicación completa. La responsabilidad de actualizar depende del método de instalación: Sparkle para instalaciones directas y Homebrew para instalaciones mediante cask.

Ese detalle evita que dos sistemas de actualización compitan por la misma copia.

## El contexto es más útil que la identidad de la aplicación

La idea central de Workspace Organizer es pequeña:

El nombre de una aplicación no aporta suficiente información para decidir si una ventana pertenece a la tarea actual.

Cuando el sistema reconoce ventanas individuales, puede recordar grupos significativos, restaurar su geometría, cambiar la escena y automatizar transiciones sin tratar cada ventana de Safari o del editor como si fuera intercambiable.

La implementación es nativa, prioriza lo local y se limita a API admitidas. Esas restricciones hacen que el producto sea más honesto y duradero.

Puedes [visitar Workspace Organizer](https://workspace.santi020k.com/), [explorar el código fuente](https://github.com/santi020k/workspace-organizer) o leer el [caso de estudio resumido del portafolio](/es/portfolio/workspace-organizer/).
