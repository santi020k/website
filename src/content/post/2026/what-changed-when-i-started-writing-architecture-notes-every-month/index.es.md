---
title: "Qué cambió cuando empecé a escribir notas de arquitectura cada mes"
description: "Un año de notas mensuales de arquitectura cambió cómo reviso sistemas, detecto desviaciones y explico decisiones a quienes las heredan."
coverImage:
  alt: "Notas recurrentes de arquitectura orbitan un diagrama de sistema en evolución y aportan cambios a su estructura"
startHere:
  label: "Cómo pienso"
  reason: "Un pequeño hábito de escritura que me ayuda a detectar desviaciones, explicar decisiones y dejar contexto útil para el equipo."
---

Empecé a escribir notas breves de arquitectura hace unos catorce meses. No era documentación formal. Tampoco registros completos de decisiones de arquitectura. Eran notas mensuales sobre lo que estaba revisando, lo que parecía funcionar, lo que empezaba a desviarse y aquello sobre lo que tenía dudas.

No esperaba que fueran útiles más allá de ayudarme a pensar. Resultaron más útiles que buena parte de la documentación formal que he escrito.

## Cómo son realmente las notas

El formato es deliberadamente poco estructurado. Limito cada nota a dos o tres secciones:

**Qué revisé.** Una descripción breve de la parte del sistema con la que pasé tiempo: el límite de un servicio, un modelo de datos, una configuración de despliegue o una integración modificada recientemente.

**Qué observé.** No es un resumen de cómo funciona. Eso ya está en el código. En cambio, anoto qué me sorprendió, qué se había alejado de la intención original, qué seguía funcionando bien y qué preocupación me llevaba para más adelante.

**Qué decidí o pospuse.** Si cambié algo, por qué. Si decidí esperar, qué tendría que cumplirse antes de actuar.

Escribir cada nota toma unos veinte minutos. La mayoría nunca las lee otra persona. Algunas han sido los documentos más útiles que he compartido.

## El primer cambio: empecé a detectar antes las desviaciones

La arquitectura no se deteriora de forma evidente. Los servicios no avisan cuando sus límites dejan de ser coherentes. Los modelos de datos no anuncian cuándo han acumulado suficientes casos especiales para invalidar las premisas del diseño original. Las integraciones no alertan cuando han recibido tantos parches que esos parches ya son la interfaz real.

La desviación es invisible hasta que se vuelve costosa.

Escribir notas mensuales me obliga a mirar el sistema con ojos nuevos de forma periódica. No porque alguien haya reportado un problema ni porque el sprint incluya una tarea de limpieza, sino porque me comprometí a observar. Esa rutina me permitió detectar dos casos durante el último año en los que el límite de un servicio se había erosionado gradualmente por cambios hechos por conveniencia, hasta dejar de cumplir su propósito original.

En ambos casos lo noté porque estaba escribiendo. De otro modo, no lo habría detectado hasta que el costo fuera mucho mayor.

## El segundo cambio: las decisiones se volvieron más fáciles de explicar

Una de las experiencias más incómodas en software es heredar una decisión sin entender por qué se tomó. El código expresa qué se decidió. Rara vez expresa por qué. Y ese «por qué» es exactamente lo que necesitas cuando decides si mantener, extender o reemplazar algo.

Las notas mensuales crean un registro ligero del razonamiento de ese momento.

He vuelto a mis propias notas para recordar por qué introduje cierta abstracción, por qué descarté un enfoque más sencillo y cuáles eran las ventajas y desventajas en ese contexto. El registro es imperfecto: las notas son una instantánea, no una historia completa. Aun así, resulta muchísimo más útil que no tener nada, que es como suele quedar la historia de las decisiones.

Cuando otra persona necesita entender una elección pasada, remitirla a una nota breve con el contexto original es mucho más rápido que reconstruirlo en una conversación.

## El tercer cambio: mejoré al identificar la incertidumbre

A la mayoría de los ingenieros, incluido yo, se nos da mejor describir lo que sabemos que aquello de lo que no estamos seguros. Es fácil contar qué partes de un sistema funcionan bien. Las partes que nos generan dudas son más fáciles de posponer que de nombrar.

Escribir notas mensuales me hizo más honesto respecto a las cosas que no veía con claridad. Nombrar la incertidumbre por escrito es distinto de tenerla vagamente en la cabeza. Una vez escrita, es más fácil volver a ella, compartirla con otra persona y actuar cuando cambian las circunstancias.

Varias de las conversaciones técnicas más productivas que tuve este año comenzaron al compartir una nota que decía «no estoy seguro de que este límite sea correcto» o «tengo dos preocupaciones sobre esta integración y todavía no he resuelto cuál es más importante».

## Qué ayuda a mantener el hábito

El valor de las notas solo se acumula si sigues escribiéndolas. Eso significa que el formato debe ser lo bastante fácil para que un mes ocupado no se convierta en una razón para saltárselo.

Estas cosas me han ayudado a mantener el hábito:

**No exigir que sean completas.** Una nota de dos párrafos que aborda con honestidad una preocupación es más útil que un documento exhaustivo que nunca se escribe. Lo breve y concreto gana frente a lo largo y completo cuando la alternativa es no tener nada.

**Escribir para mi yo del futuro, no para una audiencia.** Las notas más útiles al releerlas son aquellas en las que escribí lo que realmente pensaba, incluidas la incertidumbre y las preguntas sin resolver. Las notas escritas para sonar como una autoridad suelen ser menos útiles que las escritas para entender algo.

**Mantenerlas en el proyecto.** Las notas que viven junto al código son más fáciles de encontrar y tienen más posibilidades de mantenerse vigentes que las de una wiki separada. Un directorio `/notes` o un archivo fechado en el repositorio mantiene la historia cerca de aquello que describe.

## Qué le diría a alguien que empieza ahora

La primera nota parecerá poco útil. Escríbela de todos modos. El valor no está en una nota individual, sino en el patrón que aparece con el tiempo.

Después de tres meses tendrás una imagen de las partes del sistema que te siguen preocupando. Esa imagen es información. Te dice dónde está el riesgo arquitectónico real, incluso cuando todavía no se ha roto nada.

Después de seis meses notarás que escribir ha cambiado tu manera de revisar código. Empiezas a buscar desviaciones como un hábito, no como una tarea.

Ese cambio, de reaccionar a observar, es el verdadero propósito de las notas.

Si estás construyendo el argumento para convertirlo en una práctica de equipo, [Errores comunes de código que señalan riesgos de mantenimiento](/es/blog/common-code-pitfalls-that-signal-maintenance-risk/) es un buen complemento. Los problemas que describe son precisamente el tipo de cosas que aparecen en las notas de arquitectura antes de aparecer en un informe de incidente.
