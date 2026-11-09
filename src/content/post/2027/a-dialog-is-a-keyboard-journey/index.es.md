---
title: "Un diálogo es un recorrido con el teclado"
description: "Abrir un diálogo es solo el primer paso. Una revisión práctica de la entrada, contención, salida y retorno del foco en un producto basado en componentes."
coverImage:
  alt: "Un anillo de foco cian resalta una piedra dentro de un marco de vidrio conectado a otra piedra que representa el control de apertura"
---

Un diálogo puede parecer completo en una captura de pantalla antes de que se haya considerado su recorrido con el teclado.

La interfaz visual muestra el título, los campos y las acciones. La interacción también tiene un principio y un final: adónde se mueve el foco al abrir el diálogo, qué sucede mientras está abierto y desde dónde continúa la persona después de cerrarlo.

Esa es la clase de responsabilidad compartida que hay detrás de [Lumen UI](/es/portfolio/lumen-ui/). Una biblioteca de componentes puede llevar el comportamiento de interacción a distintos productos. El producto todavía debe decidir qué significa el diálogo y qué debería pasar después.

## Comienza con una tarea pequeña del producto

Imagina una página de configuración con un botón «Editar nombre para mostrar». Al activarlo, se abre un modal que contiene un campo con su etiqueta y los botones Guardar y Cancelar.

La captura de pantalla puede mostrar esa distribución con claridad. No puede mostrar si la persona que usa el teclado llegó al campo, sigue detrás de la capa superpuesta o perdió su ubicación después de guardar.

Para este ejemplo, escribe el recorrido previsto antes de elegir los detalles visuales:

1. Llegar al botón de edición desde la página de configuración.
2. Abrir el diálogo y entender su propósito.
3. Editar el valor o cancelar.
4. Volver a un lugar útil de la página de configuración.

Esos pasos les dan a diseño, implementación y revisión una tarea compartida que verificar.

## Usa el patrón de diálogo modal como punto de partida

El [patrón de diálogo modal de WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) describe el comportamiento fundamental: el foco entra al diálogo; Tab y Shift+Tab permanecen dentro de él; Escape lo cierra; y el contenido del fondo queda inerte. El diálogo necesita un nombre accesible y un control de cierre visible.

El foco inicial depende del contenido. Un campo de entrada puede ser adecuado para una tarea de edición sencilla. Un contenido más largo puede necesitar el foco cerca de su inicio. Una acción difícil de revertir puede requerir que se enfoque la opción menos destructiva.

Después de cerrar, el foco normalmente vuelve al control que abrió el diálogo. Si ese control desapareció o la tarea completada lleva lógicamente a otro lugar, elige un destino significativo.

Estas son expectativas sobre la interacción renderizada. Agregar únicamente un atributo modal no establece ese comportamiento.

## Divide las responsabilidades del componente y del producto

Usa el contrato de interacción documentado del componente en lugar de agregar a su alrededor un segundo sistema de foco personalizado. Los manejadores que compiten entre sí pueden hacer difícil entender una acción de cierre que, de otro modo, sería sencilla.

El producto es responsable de la etiqueta del campo de nombre para mostrar, del mensaje de validación, de la solicitud de guardado y del resultado. También es responsable de cualquier flujo que elimine el control de apertura original.

Conviene revisar esa división cada vez que se adopta un componente compartido. La biblioteca no puede decidir si «Continuar» es una etiqueta de botón significativa para tu tarea o si un guardado fallido debería conservar el valor ingresado para poder corregirlo.

Para una implementación con Lumen, comienza con la [documentación actual de los componentes](https://lumen.santi020k.com/) y verifica la composición en la aplicación que los consume. Un ejemplo de biblioteca no puede representar la distribución circundante ni los cambios de estado de cada producto.

## Comprueba la tarea completa con el teclado

Deja el puntero a un lado y realiza la tarea del nombre para mostrar desde la página de configuración real. Sigue el indicador visible de foco durante todo el recorrido.

Prueba primero una edición exitosa y luego repite con un valor vacío y con un guardado fallido. La ruta de error importa porque puede reemplazar contenido, insertar un mensaje de error o dejar una acción deshabilitada.

Comprueba si la explicación aparece donde se puede entender y si la persona puede corregir el valor sin volver a abrir el diálogo. Revisa la ubicación final del foco tanto después de Guardar como de Cancelar.

Prueba también la página con un área de visualización estrecha y con el texto ampliado. Una acción visible en el diseño original puede quedar fuera de la vista cuando el mensaje de validación ocupa varias líneas.

Usa comprobaciones con un lector de pantalla para revisar cómo se anuncian el título, la etiqueta del campo, el error y el resultado. La operación con teclado y los anuncios aportan evidencias distintas; ambas contribuyen a entender la tarea completa.

## Conserva el comportamiento a medida que cambia el producto

Una prueba de interacción resulta más útil cuando representa ese recorrido de la persona: abrir la configuración, editar un valor, manejar el resultado y continuar desde una ubicación significativa.

Una comprobación que solo confirma que el diálogo se volvió visible pasa por alto el principio y el final que lo hicieron usable.

La próxima vez que revises un diálogo, sigue el recorrido hasta cerrarlo. Ese último paso es fácil de pasar por alto en una captura de pantalla y se nota de inmediato cuando alguien intenta continuar.
