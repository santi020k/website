---
title: "Un proceso de publicación que reduce el drama"
description: "Un proceso de publicación debería reducir el estrés, acortar los ciclos de retroalimentación y facilitar la confianza en los cambios de producción."
coverImage:
  alt: "Fragmentos inestables de una versión atraviesan controles y se convierten en un artefacto protegido y estable"
---

Los procesos de publicación suelen volverse más ceremoniales que útiles. Los equipos acumulan pasos de incidentes pasados, herramientas antiguas y hábitos históricos hasta que publicar se siente más pesado de lo necesario.

Prefiero un proceso que responda claramente las preguntas adecuadas y deje un registro en el que la siguiente persona pueda confiar.

## Un proceso de publicación debe responder cinco preguntas

Antes de publicar, el equipo debería poder responder:

1. ¿Qué incluye esta versión?
2. ¿Cómo se verificó?
3. ¿Quién dirige la publicación?
4. ¿Cómo sabremos si funciona bien después del lanzamiento?
5. ¿Cuál es el plan de reversión si la respuesta es «no funciona bien»?

Si esas respuestas son vagas, el proceso está incompleto, sin importar cuántos puntos tenga la lista de comprobación.

## Antes de la versión candidata

Quiero que los cambios entrantes estén organizados antes de crear siquiera la rama, el entorno o la versión candidata.

Normalmente eso significa:

- Pull requests integrados con descripciones claras
- Límites de versión entendidos
- Notas de publicación redactadas antes de la carrera final
- Cambios específicos de cada entorno señalados explícitamente
- Trabajo incompleto retenido en lugar de incorporado a escondidas

Aquí también se nota la disciplina con Git. Un historial claro de PR y etiquetas facilita enormemente la preparación de versiones.

## La verificación debe ser visible, no implícita

Mover código a QA, staging o un entorno de versión candidata debería incluir una ronda de verificación definida. No tiene que ser enorme, pero sí explícita.

Normalmente quiero:

- Controles automáticos aprobados
- Comprobaciones básicas del recorrido crítico
- Confirmación de que las migraciones o los cambios de configuración se ejecutaron correctamente
- Una nota escrita sobre lo que se haya aplazado deliberadamente

Los problemas de publicación más costosos muchas veces no son errores desconocidos. Son salvedades conocidas que nunca se documentaron con suficiente claridad.

## Los pasos en producción deben ser mínimos y deliberados

Una vez aprobada una compilación, el flujo de producción debería ser predecible:

- Promover el artefacto o commit aprobado
- Crear la etiqueta de versión
- Publicar o actualizar las notas
- Supervisar las señales de salud conocidas
- Confirmar quién responde durante la primera ventana de atención

La secuencia importa. No quiero publicaciones que dependan de recompilar código desde un estado diferente, adivinar qué commit se desplegó o escribir las notas mientras las personas ya están apagando incendios.

## Las notas forman parte del resultado de la entrega

No considero las notas de publicación un trámite. Son parte del artefacto entregado.

Unas buenas notas ayudan a soporte, QA, producto e ingeniería a responder rápidamente las mismas preguntas:

- Qué cambió
- Qué importa
- Qué hay que observar
- Qué se excluye deliberadamente

Incluso las notas breves son útiles si son claras. El silencio genera más trabajo que la concisión.

## El seguimiento posterior también importa

Una publicación no termina en el momento en que producción acepta el despliegue.

Quiero un periodo breve en el que alguien supervise de forma explícita:

- Las tasas de error
- Los registros o trazas de las áreas modificadas
- Los eventos de negocio o conversiones clave
- Los canales de soporte a clientes si el alcance es grande

No hace falta vigilar en estado de pánico. Basta con dar seguimiento de forma deliberada.

## La versión más sencilla que vale la pena conservar

Si tuviera que reducir el proceso a una lista práctica, sería esta:

- Identificar el código exacto incluido
- Verificarlo en un entorno previo a producción
- Publicar notas concisas
- Etiquetar la versión entregada
- Supervisar la publicación con una ruta de reversión lista

Eso basta para publicar con más calma. Si un proceso agrega estrés sin mejorar la claridad, debería simplificarse. Las publicaciones deberían sentirse disciplinadas, no dramáticas.

Para conocer el lado de la automatización, [Integración y despliegue continuos para proyectos Next.js](/es/blog/continuous-integration-and-deployment-for-next-js-projects/) es una buena lectura complementaria.
