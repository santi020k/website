---
title: "Una compilación exitosa de Astro puede dejar pasar la falta de texto alternativo"
description: "Un pequeño ejemplo con una imagen muestra dónde termina la compilación, cómo ayuda Astro Doctor y por qué el criterio humano sigue decidiendo si la solución es útil."
coverImage:
  alt: "Una lente de diagnóstico de vidrio revela una pieza ámbar incrustada en una pila de bloques de páginas violetas"
---

Una página puede compilar correctamente aunque una imagen importante no tenga una alternativa textual útil.

Esa es una de las carencias que creé [Astro Doctor](/es/blog/astro-doctor-announcement/) para ayudar a detectar. Una compilación comprueba si se puede generar la aplicación. Un diagnóstico puede plantear una pregunta más específica sobre el código fuente. Ninguno reemplaza la revisión de lo que una persona experimenta en realidad.

La falta de texto alternativo es un ejemplo pequeño con un límite claro: una herramienta puede detectar un atributo ausente, pero alguien todavía debe decidir qué significa la imagen en su contexto.

## Comienza con una falla concreta

Imagina un artículo que explica cómo conectar un sensor. Este marcado ilustrativo de Astro muestra el diagrama de cableado:

```html
<img
  src="/images/sensor-wiring.webp"
  width="960"
  height="540"
/>
```

El navegador tiene información suficiente para solicitar y mostrar el archivo. Eso no le da a alguien que no puede verlo la información necesaria para conectar el sensor.

La pregunta importante es si el texto del artículo comunica las instrucciones de cableado por sí mismo. Si el diagrama es el único lugar donde se explican las conexiones, una compilación exitosa habrá dejado una carencia real.

Este ejemplo usa un elemento de imagen sencillo para aislar el problema. Tu proceso de imágenes en producción puede ofrecer validación adicional, optimización o propiedades obligatorias. Conserva también esas protecciones.

## Deja que el diagnóstico identifique la decisión pendiente

Astro Doctor incluye la regla `astro-doctor/no-missing-alt`. Sus [pruebas del escáner](https://github.com/santi020k/astro-doctor/blob/main/packages/astro-doctor/tests/scanner/index.test.ts) cubren imágenes sin texto alternativo.

Cuando aparezca ese diagnóstico, interprétalo como una solicitud de revisar el propósito de la imagen. Agregar un atributo es solo la parte mecánica de la corrección.

Para el ejemplo del sensor, un punto de partida más útil sería:

```html
<img
  src="/images/sensor-wiring.webp"
  width="960"
  height="540"
  alt="Sensor wiring diagram; the connections are listed below."
/>
```

El artículo debe incluir de verdad la lista de conexiones. El texto anterior solo es apropiado si coincide con la imagen real y con la explicación que la rodea. No sustituye la verificación del diagrama.

Una imagen compleja puede necesitar más que un atributo breve. Pon la explicación completa donde puedan usarla quienes leen, incluidas las personas que pueden ver la imagen pero encuentran difícil interpretar el diagrama.

## Elige el texto según el propósito

La [guía de imágenes del W3C](https://www.w3.org/WAI/tutorials/images/) distingue entre imágenes que transmiten información, aportan decoración o realizan una acción.

Para una imagen informativa, describe la información que importa en ese contexto. Para una imagen puramente decorativa, usa `alt=""`. Para una imagen que es el único contenido de un enlace o botón, comunica la acción o el destino. Los diagramas complejos también necesitan un equivalente textual más completo.

La misma imagen puede necesitar un tratamiento distinto en diferentes lugares. Ese contexto es la razón por la que una regla no puede inventar de forma segura la respuesta para cada imagen.

## Verifica la corrección en dos niveles

Primero, vuelve a ejecutar el diagnóstico. Eso confirma que el código fuente ahora cumple la condición que se comprueba. Conserva la compilación normal del repositorio y las demás comprobaciones en la misma ronda de validación.

Después, revisa el artículo renderizado teniendo en cuenta la información de la imagen:

- ¿Puede una persona entender las instrucciones a partir del texto?
- ¿Coincide el texto alternativo con esta imagen en particular?
- ¿Tiene una imagen enlazada un nombre accesible útil?
- ¿Respalda el texto circundante la descripción sin repeticiones innecesarias?

Una comprobación con lector de pantalla puede ayudar a verificar cómo se anuncian la imagen y el texto cercano. Debe hacerse en la página real, porque la ubicación y el contenido circundante forman parte de la experiencia.

## Mantén la evidencia específica

Después de esta corrección, es razonable decir que el diagnóstico de texto alternativo ausente está resuelto y que se revisó la explicación de la imagen.

Sería una afirmación mucho más amplia decir que toda la página es accesible. Los encabezados, el contraste, la interacción con teclado, los formularios, el movimiento y las demás imágenes todavía tienen sus propias preguntas pendientes.

Esa distinción hace más útiles las comprobaciones automatizadas. Cada una aporta evidencia sobre una condición definida; la revisión del producto conecta esas condiciones con la tarea que una persona intenta completar.

En tu próxima revisión de Astro, elige una imagen informativa y comprueba si su significado se conserva sin verla. Ese pequeño ejercicio suele marcar la diferencia entre cumplir una regla y mejorar la página.
