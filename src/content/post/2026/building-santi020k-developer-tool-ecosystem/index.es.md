---
title: "Cómo construí el ecosistema de herramientas de desarrollo de santi020k"
description: "Cómo Lumen, ESLint Config Basic, Quality, Astro Doctor, Commitprompt, Dep Beacon, OG, Theme y Auth forman un sistema práctico para mis proyectos."
coverImage:
  alt: "Un núcleo geométrico violeta conecta módulos de interfaz, controles de verificación y un proceso de entrega"
startHere:
  label: "Cómo construyo"
  reason: "Las herramientas compartidas y los límites que conectan mis proyectos sin convertirlos en un solo sistema."
---

No me propuse construir un ecosistema.

Construí una herramienta porque estaba cansado de resolver el mismo problema. Luego construí otra
porque la primera dejó al descubierto una decisión distinta que también se repetía. Con el tiempo,
los proyectos empezaron a formar un sistema: bases de diseño compartidas, reglas coherentes de
calidad del código, retroalimentación más rápida, lanzamientos más seguros y menos decisiones pequeñas
que cada aplicación tenía que volver a descubrir.

Ese sistema ahora incluye [Lumen UI](/es/portfolio/lumen-ui/),
[`@santi020k/eslint-config-basic`](/es/portfolio/eslint-config-basic/),
[Quality](/es/portfolio/quality/), [Astro Doctor](/es/blog/astro-doctor-announcement/),
[Commitprompt](https://github.com/santi020k/commitprompt), [Dep Beacon](/es/portfolio/dep-beacon/),
[`@santi020k/og`](/es/portfolio/og/), [Santi020k Theme](/es/portfolio/santi020k-theme/) y un paquete
público y experimental de autenticación que todavía se está validando en aplicaciones reales.

No comparten un único entorno de ejecución, ciclo de lanzamiento ni definición de éxito. Comparten
algo más importante: decisiones que no quiero que cada proyecto tome desde cero.

## El ecosistema es un conjunto de límites, no un monolito

La palabra _ecosistema_ puede convertirse fácilmente en una excusa para conectar todo con todo.
Ese no es el objetivo aquí.

Cada herramienta debe seguir siendo útil por separado. Un sitio Astro debería poder usar Astro
Doctor sin adoptar Lumen. Un repositorio con varios lenguajes debería poder usar Quality sin
reemplazar sus analizadores nativos. Un producto debería poder generar tarjetas para redes sociales
con `@santi020k/og` y conservar el control completo de su diseño visual.

Las herramientas se conectan mediante contratos, en lugar de acoplamientos ocultos:

- Theme se encarga de los tokens y recursos visuales compartidos.
- Lumen convierte las decisiones de diseño en primitivas de interfaz accesibles y bases nativas.
- ESLint Config Basic y Astro Doctor mantienen explícitos los patrones de implementación.
- Quality coordina las comprobaciones en las que un repositorio ya confía.
- Commitprompt y Dep Beacon acercan el mantenimiento cotidiano al lugar donde se trabaja.
- OG permite generar imágenes sociales de forma repetible sin apropiarse de la marca de un producto.
- Auth se encarga de la política de autenticación reutilizable sin crear una base de cuentas compartida.

Esa separación importa. Las herramientas compartidas deberían eliminar trabajo repetido, no trasladar
cada producto a un gran grafo de dependencias.

## El diseño empieza con Theme y se convierte en interfaz de producto mediante Lumen

[Santi020k Theme](/es/portfolio/santi020k-theme/) es la base visual. Coordina el lenguaje de color que
uso en editores, Codex, terminales, navegadores, documentación e interfaces de producto. Los paquetes
compartidos `@santi020k/theme` y `@santi020k/theme-core` ponen esos tokens y recursos a disposición del
código, en vez de dejarlos como colores que se copian entre repositorios.

[Lumen UI](/es/portfolio/lumen-ui/) se apoya en esa base. Ofrece más de 150 primitivas web, bases
nativas compartidas, plantillas, recursos de Figma, una habilidad para agentes y un servidor MCP.
Su trabajo no es hacer que Astro, React, Web Components, React Native, SwiftUI y Jetpack Compose
parezcan el mismo framework. Su trabajo es permitirles compartir semántica, expectativas de
accesibilidad, tokens y decisiones de interacción, conservando los modelos de desarrollo nativos.

Ese límite es importante para mí. Un sistema de diseño debería facilitar el buen comportamiento de
una interfaz. No debería obligar a encajar una pantalla especializada de un producto en una
abstracción genérica que empeore la experiencia.

## ESLint Config Basic, Astro Doctor y Quality cubren distintos ciclos de retroalimentación

Estas tres herramientas se ocupan de la calidad, pero trabajan en niveles diferentes.

[`@santi020k/eslint-config-basic`](/es/portfolio/eslint-config-basic/) es la base de análisis estático
para proyectos JavaScript y TypeScript. Ofrece una configuración plana de ESLint 10 con detección
automática del proyecto y paquetes específicos para los frameworks y las herramientas que un
repositorio realmente usa. El objetivo es facilitar la adopción de buenas configuraciones
predeterminadas sin convertir cada proyecto en la misma combinación de tecnologías.

[Astro Doctor](https://github.com/santi020k/astro-doctor) aporta criterio específico de Astro. Busca
patrones de rendimiento, accesibilidad, seguridad y arquitectura que pueden compilar correctamente
mientras contradicen la razón por la que un equipo eligió Astro. Puede ejecutarse como CLI, plugin de
ESLint, configuración de Oxlint, GitHub Action, extensión de editor o guía para agentes.

[Quality](/es/portfolio/quality/) opera un nivel más arriba. Detecta y coordina analizadores nativos
en repositorios de Rust, Swift, Android y Kotlin, Python, JavaScript, TypeScript y Astro. No reemplaza
los analizadores nativos en los que esos ecosistemas ya confían. Le ofrece al repositorio una forma
predecible de invocarlos, normalizar la evidencia y ejecutar la misma política localmente y en GitHub
Actions.

La distinción mantiene claras las responsabilidades de estas herramientas:

- ESLint Config Basic se encarga de la configuración de lint reutilizable.
- Astro Doctor se encarga de los diagnósticos y explicaciones específicos de Astro.
- Quality se encarga de la coordinación y de la coherencia de la evidencia entre lenguajes.

Combinar esas responsabilidades en un solo paquete haría que cada herramienta fuera más difícil de
adoptar y mantener.

## Commitprompt y Dep Beacon reducen las decisiones repetidas de mantenimiento

Algunos problemas de experiencia de desarrollo no son dramáticos. Son pequeñas interrupciones que
ocurren con suficiente frecuencia como para generar ruido.

[Commitprompt](https://github.com/santi020k/commitprompt) resuelve uno de ellos: escribir y validar
Conventional Commits sin pedirles a los desarrolladores que recuerden la sintaxis o las reglas
específicas de cada repositorio. Acompaña el flujo de commits y deja que los hooks de Git y la
política del repositorio tengan la última palabra.

[Dep Beacon](/es/portfolio/dep-beacon/) resuelve otro: entender el estado de las dependencias mientras
se edita un manifiesto. Sus integraciones con VS Code y Zed muestran versiones de npm, destinos
prácticos de actualización, catálogos de workspaces de pnpm y señales de seguridad de OSV junto a la
dependencia que necesita atención.

Ninguna de las dos herramientas intenta reemplazar el criterio de ingeniería. Acortan la distancia
entre la pregunta y la evidencia necesaria para responderla.

Ese es un principio recurrente en el ecosistema: automatizar la parte repetitiva y dejar visible la
decisión que tiene consecuencias.

## OG y Auth comparten mecanismos sin quitarles el control a los productos

Las imágenes sociales y la autenticación parecen temas desconectados, pero el límite de lo
reutilizable es similar.

[`@santi020k/og`](/es/portfolio/og/) se encarga de la generación determinista: rutas, huellas digitales,
caché, concurrencia, limpieza segura, formatos de salida y verificación de solo lectura en CI. El
proyecto que lo consume sigue siendo dueño de su contenido, fuentes, composición, recursos e
identidad visual. La abstracción compartida valiosa es el proceso de generación, no un diseño
universal de tarjeta.

El proyecto de código abierto [`santi020k auth`](/es/portfolio/auth/) sigue la misma regla en un
límite más sensible. Su primer paquete público, `@santi020k/auth-cloudflare`, se encarga de una
política de autenticación reutilizable y de una integración con Cloudflare Workers y D1 para
aplicaciones compatibles de Santiago. Cada producto sigue siendo dueño de sus datos de identidad,
migraciones, secretos, cookies, claves de acceso, proceso de recuperación, textos de correo y
despliegue.

Compartir código de autenticación nunca debe convertirse silenciosamente en un sistema de cuentas
compartidas. Auth es público como paquete experimental `0.x` mientras sus migraciones, el
comportamiento de sus claves de acceso y su contrato de integración se validan con orígenes y
consumidores reales.

## Los proyectos reales deciden si una herramienta compartida merece existir

No quiero extraer un paquete porque dos archivos se parecen. Quiero extraer una decisión solo
después de que varios proyectos demuestren que es estable y que de verdad la comparten.

El proceso suele ser así:

1. Resolver el problema dentro de un producto real.
2. Identificar qué parte es política o mecanismo, en lugar de comportamiento del producto.
3. Probar ese límite con un segundo consumidor.
4. Extraer el contrato útil más pequeño.
5. Seguir validando el paquete mediante las aplicaciones que dependen de él.

El último paso importa. Un paquete puede compilar sin problemas, tener pruebas completas y
documentación pulida, y aun así resultar incómodo en un producto real. Los proyectos que lo consumen
exponen detalles que su propio entorno de demostración suele pasar por alto: restricciones de
composición, orden de los lanzamientos, riesgo de las migraciones, comportamiento de las plataformas
nativas y costo de cambiar una API después de su adopción.

Este sitio web es un ejemplo. Usa Lumen, Theme, ESLint Config Basic, Commitprompt y OG en el mismo
repositorio, pero cada herramienta se encarga de una parte acotada del flujo de trabajo. El sitio
sigue siendo un producto Astro, no una carcasa de demostración construida alrededor de los paquetes.

## Preferido no significa obligatorio

En mis propios proyectos, estas herramientas son las primeras opciones que evalúo. Eso es distinto
de instalarlas todas en todas partes.

Una aplicación sin interfaz no necesita Lumen. Un repositorio que no usa Astro no necesita Astro
Doctor. Un proyecto con un modelo de autenticación deliberadamente distinto no debería adoptar Auth
solo porque es mío. Agregar un paquete sin una necesidad real crea acoplamiento en lugar de aportar
ventajas.

El criterio es sencillo: preferir la herramienta compartida cuando satisface el requisito, encaja
con el entorno de ejecución y el límite de seguridad, y reduce el mantenimiento sin obligar al
producto a adoptar una abstracción equivocada.

El ecosistema debería hacer más independientes a los proyectos al darles mejores bases. Si hace que
sean más difíciles de cambiar, el límite está mal definido.

## Qué quiero mejorar después

La siguiente etapa consiste menos en agregar herramientas y más en aclarar las relaciones que ya
existen.

Quiero que las rutas de instalación y actualización sean más fáciles de encontrar. Quiero contratos
legibles por máquinas que ayuden a los agentes de programación a usar las API actuales en lugar de
adivinarlas. Quiero que la evidencia de los lanzamientos siga siendo rastreable desde las
comprobaciones locales hasta GitHub Actions y la verificación posterior al lanzamiento. Y quiero
que la retroalimentación de consumidores reales siga dando forma a los paquetes, en vez de permitir
que sus sitios de documentación se conviertan en los únicos ejemplos exitosos.

Ese es el ecosistema que intento construir: herramientas separadas, contratos explícitos, estándares
compartidos y productos que conservan el control de su propio comportamiento.

Explora el trabajo actual en mi [portafolio de experiencia de desarrollo](/es/developer-experience/).
Publico sin una frecuencia fija, así que puedes seguirme por [RSS](/feed.xml) para recibir la
próxima nota de campo cuando esté lista.
