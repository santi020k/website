---
title: "Cómo los contratos de API mantienen en marcha el desarrollo del frontend"
description: "Usa contratos de API y simulaciones realistas para desarrollar frontend y backend en paralelo, detectar comportamientos poco claros a tiempo y verificar la integración."
coverImage:
  alt: "Piezas de interfaz blanco hueso y bloques de servicio violetas conectados mediante una plantilla translúcida compartida"
---

Un equipo de frontend puede terminar una pantalla y todavía estar a semanas de saber si funciona. La distribución se ve bien, la simulación devuelve una respuesta exitosa y la demostración resulta convincente. Entonces llega el servicio real con una idea distinta de lo que significan un resultado vacío, un artículo no disponible o una solicitud fallida.

Conviene abordar esa diferencia antes de que cualquiera de las dos implementaciones avance demasiado.

Durante la [reconstrucción de la tienda de Marcone en Smith Commerce](/es/portfolio/smith-commerce/), parte de mi trabajo consistió en permitir que frontend y backend avanzaran en paralelo con simulaciones basadas en contratos OpenAPI. El frontend podía desarrollarse contra una interfaz acordada mientras avanzaba la implementación del backend.

La lección útil es que un contrato de API puede hacer visibles las decisiones de producto pendientes desde el principio. El flujo que sigue es una forma práctica de aplicar ese principio. El ejemplo de producto es ilustrativo.

## Acuerden el comportamiento antes de construir el caso exitoso

El nombre de un endpoint y una respuesta de ejemplo dejan muchas preguntas sin responder. Antes de conectar una pantalla a una simulación, acuerden el comportamiento que afecta a la persona que la usa.

Para una página de detalle de producto, esa conversación podría ser así:

**El producto existe.** Acuerden qué campos son obligatorios, opcionales o están explícitamente vacíos. Prueben la pantalla de detalle con alternativas significativas cuando falte información.

**El precio no está disponible.** Decidan si eso significa que se desconoce, que tiene acceso restringido o que no está disponible temporalmente. Expliquen el estado específico sin mostrar un precio de cero.

**El producto no se puede comprar.** Definan los estados de disponibilidad y lo que significa cada uno. Muestren un motivo claro y la siguiente acción apropiada.

**La solicitud es rechazada.** Acuerden el estado y los detalles del error en los que el cliente puede confiar. Muestren información útil sin exponer detalles internos.

**La respuesta se demora.** Establezcan el comportamiento esperado del tiempo de espera y de los reintentos. Conserven el contexto de la persona y proporcionen un estado de carga del que se pueda recuperar.

Estas son decisiones de producto y de API. Reunir a frontend, backend y producto en la misma conversación ayuda a evitar que cada equipo resuelva los vacíos de forma distinta.

[OpenAPI](https://spec.openapis.org/oas/latest.html) proporciona un formato estándar para describir API HTTP, incluidas operaciones, esquemas de solicitudes y respuestas, y ejemplos. Úsenlo para registrar las partes del acuerdo que puede expresar. Mantengan claro el resto del comportamiento en la documentación complementaria y en los criterios de aceptación.

## Mantengan el acuerdo lo bastante pequeño para revisarlo

Comiencen con una interacción útil: consultar un producto, obtener un resultado de búsqueda u otra parte acotada de la experiencia. Un contrato pequeño es más fácil de discutir y probar que un intento de describir toda la tienda.

Para esa interacción, revisen:

- La solicitud, la respuesta, los campos obligatorios y el significado de los valores ausentes.
- Las respuestas de error esperadas y la información segura que se puede mostrar a la persona.
- Quién es responsable de cada regla y quién debe revisar un cambio.
- Ejemplos que cubran los estados normales, vacíos, restringidos y fallidos cuando correspondan.

El contrato debe describir algo que ambos equipos puedan implementar y verificar. Si el backend no puede proporcionar un campo de manera confiable, descubrirlo durante la revisión cuesta menos que diseñar una pantalla que dependa de él.

## Permitan que ambas implementaciones avancen con el mismo acuerdo

Una vez acordada la primera interacción, el trabajo de frontend y backend puede continuar en paralelo.

El frontend usa la simulación para construir el renderizado, los formularios, los mensajes de validación, los estados de carga y el comportamiento de recuperación. El backend implementa la operación, valida las entradas, aplica las reglas de acceso y produce las respuestas acordadas.

Ambas partes deben revisar los cambios del contrato. Un campo renombrado, una nueva condición de error o un significado diferente para un valor existente pueden cambiar la experiencia de uso aunque el transporte siga funcionando.

Mantengan la simulación en la misma ruta de solicitud que usará la integración real. Los componentes que leen directamente objetos de datos de prueba pueden omitir la serialización, el manejo de respuestas y otros comportamientos que importan cuando interviene la red. Prefieran cambiar la fuente de datos en el límite de transporte y conservar intacto el flujo de la aplicación.

El servidor sigue siendo responsable de la autorización y de las reglas de negocio. Un botón deshabilitado comunica información útil, pero no puede imponer si una operación está permitida.

## Hagan que la simulación sea útil en condiciones imperfectas

Una simulación adquiere valor cuando permite explorar un estado a voluntad.

Usen unos pocos escenarios con nombre y repetibles. Comiencen con datos normales, un resultado vacío y una falla esperada. Agreguen respuestas lentas, campos opcionales ausentes o estados relacionados con permisos cuando afecten a la funcionalidad. Mantengan los datos sintéticos y lo bastante pequeños para entenderlos durante una revisión.

Para la página de producto ilustrativa, alternar entre un artículo disponible y uno con precio desconocido debería hacer evidente la diferencia en la interfaz. Si ambos escenarios producen la misma pantalla, el contrato o la interfaz todavía necesitan trabajo.

Validen los ejemplos contra el esquema cuando las herramientas lo permitan. Eso detecta desviaciones estructurales, pero no demuestra que el comportamiento o el servicio real sean correctos. Una respuesta válida todavía puede transmitir un significado equivocado.

## Integren mientras los cambios todavía cuestan poco

El desarrollo en paralelo sigue necesitando contacto frecuente con el sistema real. Conecten la primera operación usable del backend en cuanto esté disponible y luego ejecuten contra ella los mismos escenarios importantes.

La integración real puede revelar diferencias que una simulación no reproduce: autenticación, configuración del entorno, variaciones de datos reales, latencia y la forma en que las fallas se propagan por el sistema. Para las operaciones que cambian datos, comprueben también si los reintentos son seguros antes de permitir que el cliente repita una solicitud.

Cuando la implementación y el contrato no coincidan, decidan cuál debe cambiar. Actualizar los datos de prueba hasta que la interfaz se vea correcta puede ocultar el desacuerdo y dejarle el mismo problema al siguiente consumidor.

Mantengan preciso el lenguaje sobre el avance. «La pantalla funciona con la simulación acordada» es evidencia útil. «El flujo funciona con el servicio real en el entorno de destino» es un hito distinto. Ninguna de esas afirmaciones, por sí sola, demuestra que esté listo para producción.

## Revisen la funcionalidad como un solo flujo de uso

Antes de dar por lista la funcionalidad, comprueben el recorrido completo:

1. El contrato refleja las decisiones de producto actuales.
2. Los ejemplos y la simulación coinciden con ese contrato.
3. La interfaz maneja los estados relevantes de carga, vacío, éxito y falla.
4. El servicio real aplica los permisos y las reglas de negocio independientemente de la interfaz.
5. El flujo integrado se ha probado en el entorno previsto.

Para una funcionalidad pequeña, esto puede ser una conversación breve y unas pocas comprobaciones específicas. Agreguen herramientas cuando la repetición o el riesgo lo justifiquen. El contrato se gana su lugar al reducir la incertidumbre de quienes entregan y mantienen la funcionalidad.

El [caso de estudio de Smith Commerce](/es/portfolio/smith-commerce/) muestra el trabajo más amplio de la tienda, incluida la arquitectura del frontend, el rendimiento y la accesibilidad. El desarrollo en paralelo fue una parte de ese trabajo: darle al frontend un acuerdo confiable sobre el cual construir y mantener visible la integración real durante todo el proceso.
