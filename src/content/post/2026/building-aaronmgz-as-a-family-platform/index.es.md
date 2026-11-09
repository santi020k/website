---
title: "Construir Aaronmgz como plataforma familiar"
description: "Cómo un sitio personal de inspiración náutica se convirtió en una plataforma familiar compartida para mensajes, invitaciones, administración y un hogar digital duradero."
coverImage:
  alt: "Un barco de papel se acerca a un puerto digital acogedor con un faro y espacios familiares conectados"
---

Algunos proyectos comienzan con una oportunidad de mercado. Aaronmgz comenzó con una persona.

Quería crear un espacio personal en la web para mi hijo, Aaron: algo lo bastante lúdico para que lo sintiera suyo, lo bastante útil para acompañar los momentos familiares de hoy y lo bastante flexible para seguir cambiando a medida que crece.

Esa misma etapa familiar inspiró después [Between Contractions](/es/blog/why-i-built-between-contractions/), un contador independiente que prioriza la privacidad y ayuda con el lado práctico de prepararnos para su llegada.

La primera versión podría haber sido una sola página estática. En cambio, la idea pronto se convirtió en una pregunta útil de arquitectura:

¿Cómo construyes una plataforma familiar sin que parezca software empresarial?

La respuesta no fue evitar la estructura. Fue ponerla debajo de una experiencia cálida y sencilla.

[Aaronmgz](https://aaronmgz.com/) ahora incluye un sitio personal de inspiración náutica, un muro público de mensajes «Para Aaron», la aplicación de invitaciones creada para su baby shower, un panel de administración y la API compartida que sostiene esas experiencias.

## Una identidad, varios trabajos

Cada parte de la plataforma sirve a un público distinto.

El sitio personal es público y se centra en las historias. El muro de mensajes permite que familiares y amigos dejen algo a lo que Aaron pueda volver más adelante. La aplicación del baby shower gestiona invitaciones, confirmaciones de asistencia, regalos e información de los invitados. El panel de administración ayuda a gestionar ese evento. La API coordina los datos y la autenticación en todo el sistema.

Estas superficies no deberían ser una aplicación gigante. Tampoco deberían convertirse en pequeños proyectos desconectados.

Usé un monorepositorio con `pnpm` y Turborepo para que cada aplicación mantuviera un entorno de ejecución específico mientras compartía lo que define al producto:

- Contratos de API
- Utilidades de base de datos
- Registros de contenido
- Localización
- Metadatos multimedia
- Tipos de mensajes
- Fundamentos de interfaz

Ese límite me da independencia y consistencia a la vez. El sitio de Astro puede priorizar lo estático. Las aplicaciones de Next.js pueden gestionar flujos autenticados más completos. El worker de Hono puede exponer un único backend tipado. Los paquetes compartidos los conectan sin obligarlos a usar un mismo modelo de despliegue.

## El sitio público prioriza lo estático

El sitio principal usa Astro 6.

La elección encaja con la parte de la plataforma que debe seguir siendo rápida, duradera y fácil de alojar. La mayor parte del sitio es contenido. Astro puede generar HTML estático y añadir islas de React solo donde la interacción se gane su lugar.

Esto evita que el sitio personal herede el costo de ejecución de la aplicación del evento. También crea una buena base a largo plazo para historias, fotos, proyectos y cualquier cosa en la que Aaron quiera convertir el sitio más adelante.

La dirección visual es náutica: aventura, exploración, colores costeros y la sensación de un viaje que apenas comienza. Quería una identidad optimista sin caer en ilustraciones infantiles genéricas. El sistema tiene espacio para madurar con él.

## La aplicación del evento necesitaba otra forma

La experiencia del baby shower usa Next.js.

Las invitaciones y los paneles de invitados tienen un perfil de comportamiento distinto al de una página personal. Necesitan rutas que reconozcan tokens, formularios, estado autenticado, interacciones con el servidor y flujos administrativos.

La aplicación admite inglés y español porque un producto familiar debe adaptarse a su familia. Los diccionarios compartidos y las utilidades de idioma mantienen un modelo de traducción consistente entre aplicaciones, en lugar de dejar que cada superficie invente su propia estructura.

El panel de administración está separado de la experiencia de los invitados. Así es más sencillo entender el límite de permisos y los controles operativos quedan fuera del paquete de la aplicación pública.

## Cloudflare es la base compartida

La API se ejecuta con Hono en Cloudflare Workers. Los datos viven en Cloudflare D1 y se modelan con Drizzle ORM. Zod valida los límites y los paquetes compartidos de TypeScript dan a los frontends el mismo vocabulario de contratos.

Es más infraestructura de la que requiere un sitio familiar de una sola página. Es la cantidad adecuada para una plataforma en crecimiento con invitaciones, usuarios, mensajes y funciones futuras.

El repositorio incluye controles para las migraciones de base de datos, las diferencias en el esquema generado, la configuración de Cloudflare, las rutas básicas de autenticación, la accesibilidad, el comportamiento de extremo a extremo, el SEO y las capas habituales de compilación, linting, tipos y pruebas.

No añado esos controles porque un proyecto personal deba imitar a una empresa. Los añado porque los datos personales y los momentos familiares también merecen confiabilidad.

## Una plataforma puede seguir siendo personal

Hay una tensión útil en este proyecto.

La implementación es un sistema real con varias aplicaciones. La experiencia nunca debería poner esa complejidad en primer plano. Una visita debería mostrar un mensaje cálido, una invitación, una foto o un pequeño fragmento de la historia de Aaron. El monorepositorio, los contratos tipados, las migraciones y los controles de despliegue deberían desaparecer detrás de ese momento.

Eso es la arquitectura cumpliendo su trabajo.

El proyecto también me recuerda que el software duradero se beneficia de una razón emocional clara para existir. Siempre habrá otra actualización de framework o algún detalle de despliegue. La razón para seguir cuidándolo es mucho más sencilla: estoy construyendo un lugar donde mi hijo pueda crecer.

Puedes [visitar Aaronmgz](https://aaronmgz.com/) y leer el [caso de estudio resumido del portafolio](/es/portfolio/aaronmgz/).
