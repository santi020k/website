---
title: "Programar con IA es probabilístico. Tu proceso de entrega no debería serlo."
description: "La IA acelera los cambios de código, pero ESLint, las pruebas, las instantáneas y los controles de extremo a extremo evitan que su resultado probabilístico se convierta en un riesgo para producción."
coverImage:
  alt: "Fragmentos probabilísticos de código entran en carriles de verificación determinista y salen como un artefacto estable"
---

La IA está haciendo que los desarrolladores sean más rápidos.

No está haciendo que el software sea exacto.

Esa distinción importa más ahora que hace un año. Cuando la IA sugiere código, reescribe una función, actualiza una prueba o corrige un error, no está recuperando la verdad de un modelo interno perfecto. Está generando el siguiente resultado más probable a partir de patrones.

A veces ese resultado es excelente.

A veces contiene errores sutiles mientras suena completamente seguro.

Por eso no creo que la respuesta actual al desarrollo asistido por IA sea «confiar más en la herramienta». Creo que la respuesta es «fortalecer el sistema que rodea a la herramienta».

Si la IA es probabilística, tu proceso de entrega debería ser más explícito, más automatizado y más verificable que antes.

## Por qué la IA cambia el perfil de riesgo

Antes de que la IA entrara en el trabajo diario, la mayoría de los errores también venían de las personas, pero aparecían a un ritmo más predecible. Un desarrollador tenía que escribir el código, leerlo y, por lo general, sentir la fricción de construir cada parte paso a paso.

La IA cambia ese ritmo.

Ahora un desarrollador puede:

- Generar una refactorización en minutos
- Tocar archivos que inicialmente no pensaba editar
- Aceptar patrones que resultan familiares sin volver a evaluar por completo los casos límite
- Crear un conjunto de cambios mayor del que normalmente escribiría a mano de una sola vez

Eso no es malo por naturaleza. De hecho, suele ser útil. El problema es que la misma aceleración se aplica a los errores, las regresiones y las suposiciones parcialmente correctas.

El fallo que más me preocupa no es el disparate evidente. Es el código plausible. El que compila. El que parece razonable durante la revisión. El que incluso supera una comprobación manual rápida. Pero cambia silenciosamente un comportamiento, omite un caso límite o rompe un flujo que nadie volvió a probar.

Ahí es exactamente donde la automatización se gana su lugar.

## ESLint ya no se limita a imponer un estilo

Muchos equipos todavía hablan de ESLint como si se tratara principalmente de discusiones sobre formato o preferencias personales. Esa visión es demasiado limitada, especialmente en un flujo de trabajo con mucho uso de IA.

Cuando la IA toca una base de código, el linting se convierte en un filtro estructural inmediato.

Una buena configuración de ESLint puede detectar:

- Patrones inseguros que el modelo introduce porque son estadísticamente comunes, no porque sean correctos en ese contexto
- Importaciones inválidas o ramas sin uso que quedan tras grandes ediciones generadas
- Errores de accesibilidad en el código de interfaz
- Nombres inconsistentes, código muerto y deterioro de la mantenibilidad
- Errores específicos del framework que son fáciles de pasar por alto al revisar

Esa primera capa importa porque es rápida. ESLint ofrece comentarios casi de inmediato, lo que permite rechazar resultados deficientes antes de que lleguen a un pull request, a otro integrante del equipo o a un proceso de despliegue.

Sigo valorando el linting porque elimina ruido de las revisiones, pero con la IA en el proceso lo valoro aún más como filtro de confianza. Reduce la distancia entre «esto parece estar bien» y «esto, al menos, cumple las reglas básicas de esta base de código».

Si buscas un punto de partida práctico para esa capa, construí [`@santi020k/eslint-config-basic`](https://www.npmjs.com/package/@santi020k/eslint-config-basic) como paquete base de un conjunto más reciente de herramientas de ESLint componibles. La idea es facilitar la adopción de buenas reglas iniciales en proyectos reales de JavaScript y TypeScript sin convertir la configuración en una tarea aparte. La documentación completa está en [eslint.santi020k.com](https://eslint.santi020k.com/).

Si ya estás pensando en los estándares del equipo, mi artículo [Estándares de código que escalan con un equipo](/es/blog/code-standards-that-scale-with-a-team/) desarrolla el argumento de por qué las herramientas deberían encargarse de los controles de calidad repetitivos.

## Las pruebas unitarias y de integración protegen el comportamiento, no solo el código

La siguiente capa son las pruebas.

La IA es muy buena produciendo código que se parece al patrón que le pediste. Es mucho menos confiable a la hora de preservar cada supuesto de comportamiento que rodeaba ese código antes del cambio.

Por eso no quiero presentar las pruebas como papeleo o ceremonia. Quiero presentarlas como expectativas ejecutables.

Las buenas pruebas responden preguntas como estas:

- ¿La lógica de las ramas sigue comportándose igual?
- ¿La corrección realmente solucionó el error?
- ¿La refactorización conservó el contrato público?
- ¿Acaba de desaparecer silenciosamente el caso límite que importaba el mes pasado?

Esto cobra aún más importancia cuando se le pide a la IA «limpiar», «simplificar» o «hacer más reutilizable» algo. Esas instrucciones suelen producir código que parece más limpio, pero que cambia sutilmente el comportamiento original.

Las pruebas unitarias y de integración reducen la necesidad de adivinar. Convierten «creo que esto sigue funcionando» en «se ejecutó y verificó el comportamiento esperado».

Por eso también prefiero probar el comportamiento en lugar de los detalles de implementación. Si las pruebas son frágiles, los cambios generados por IA provocarán trabajo innecesario. Si se alinean con el comportamiento observable, se convierten en una protección estable para los cambios escritos tanto por personas como por IA.

Como ejemplo práctico de esa mentalidad, [Pruebas de componentes React con Vitest y React Testing Library](/es/blog/testing-react-components-with-vitest-and-react-testing-library/) explica por qué prefiero una cobertura centrada en el comportamiento en lugar de aserciones guiadas por la implementación.

## Las instantáneas son útiles cuando observan la superficie correcta

Las pruebas de instantáneas se usan mal todo el tiempo, pero sigo creyendo que tienen valor.

El error es tratarlas como un reemplazo universal de las pruebas bien pensadas. Cuando un equipo toma instantáneas de todo sin una intención clara, el resultado suele ser ruido. Las personas dejan de leer los diffs y empiezan a aprobar cambios mecánicamente.

Eso no es un problema de las instantáneas. Es un problema de disciplina.

Bien utilizadas, son una alarma rápida de regresiones para resultados estables, como:

- Respuestas serializadas de API o resultados de transformaciones
- Objetos de configuración generados
- La salida de componentes que debería mantener una estructura consistente
- Referencias visuales en estados controlados de la interfaz

En un flujo asistido por IA, las instantáneas son especialmente útiles porque los modelos suelen introducir pequeños cambios estructurales que parecen inofensivos en el momento. Un contenedor renombrado, una estructura de salida reordenada o un campo adicional pueden pasar inadvertidos si nadie mira con suficiente atención.

Las instantáneas hacen visibles esos cambios.

No las quiero en todas partes. Sí las quiero donde una desviación inesperada resulte costosa.

## Las pruebas de extremo a extremo protegen los flujos más importantes

ESLint es rápido. Las pruebas unitarias son específicas. Las instantáneas son alarmas útiles. Pero ninguna sustituye por completo las pruebas de extremo a extremo.

La razón es sencilla: los usuarios no experimentan tu sistema una función a la vez.

Experimentan flujos.

Inician sesión. Envían un formulario. Recuperan una contraseña. Completan una compra. Publican contenido. Conectan dos partes del producto que tu arquitectura quizá trata como responsabilidades separadas.

La IA puede generar fácilmente código que parece correcto dentro de un archivo mientras rompe el flujo entre rutas, estado, API, permisos o comportamiento del navegador.

Por eso las pruebas de extremo a extremo importan tanto ahora. Verifican que el sistema siga comportándose como espera un usuario después de que una máquina haya ayudado a reescribir una parte.

No intentaría cubrir cada pantalla con pruebas E2E. Eso se vuelve lento y costoso. Pero sí las quiero alrededor de los caminos críticos:

- Autenticación
- Flujos de compra o conversión
- Creación y edición de contenido
- Acciones sensibles a los permisos
- Regresiones de errores de alto impacto

Ahí es donde un «pequeño» error generado por IA se convierte en un problema real para el negocio.

## La automatización aumenta la seguridad y la velocidad al mismo tiempo

Algunos equipos todavía tratan la automatización como si fuera un impuesto a la velocidad.

Creo que lo ven al revés.

Las automatizaciones correctas aumentan la velocidad porque reducen las dudas. Cuando sé que ESLint se ejecuta, que las pruebas tienen sentido, que las instantáneas señalarán cambios inesperados y que los controles de extremo a extremo protegen los flujos de mayor riesgo, puedo avanzar más rápido y con menos ansiedad.

Esto importa todavía más al corregir errores.

Las correcciones son precisamente donde la confianza puede convertirse en una falsa confianza. El cambio suele ser urgente, el alcance parece pequeño y la IA puede producir un parche plausible rápidamente. Es un buen escenario para publicar una corrección que introduce un segundo error junto al primero.

La automatización reduce ese riesgo al ofrecerle al equipo evidencia rápida:

- El código sigue cumpliendo los estándares básicos
- El comportamiento previsto sigue funcionando
- La salida no cambió de una forma inesperada
- El flujo crítico del usuario sigue completándose correctamente

Eso no es burocracia. Es una ventaja práctica.

## El flujo de trabajo que quiero que los equipos automaticen ahora

Si un equipo usa IA con regularidad, creo que una configuración mínima saludable debería parecerse a esto:

1. Ejecutar ESLint y pruebas específicas localmente mientras los cambios siguen siendo pequeños.
2. Ejecutar en CI el proceso completo de linting, pruebas, instantáneas y verificación de tipos.
3. Ejecutar controles de extremo a extremo para los flujos críticos antes de integrar o publicar.
4. Mantener los resultados de la automatización lo bastante visibles como para que nadie tenga que adivinar qué se verificó realmente.

También me gustan las protecciones locales, como los hooks pre-commit o pre-push, para obtener comentarios rápidos, siempre que sigan siendo prácticos. [Flujo de desarrollo con Husky para integrar Next.js, ESLint y Vitest](/es/blog/development-workflow-with-husky-for-next-js-eslint-and-vitest-integration/) sigue siendo un buen ejemplo de cómo incorporar esa verificación al trabajo diario en lugar de dejarla como una limpieza de último minuto.

## La IA acelera el trabajo, pero no sustituye el criterio de ingeniería

Uso IA. Espero que la mayoría de los equipos la sigan usando. No creo que la respuesta sea resistirse a ella.

Sí creo que debemos ser honestos sobre lo que es.

Es un asistente probabilístico que puede resultar increíblemente útil y equivocarse de vez en cuando con una apariencia lo bastante pulida como para ser peligrosa.

Eso significa que la verdadera ventaja competitiva no consiste solo en generar más código. Consiste en construir un sistema de entrega capaz de absorber esa velocidad sin volverse frágil.

ESLint, las pruebas, las instantáneas y los controles de extremo a extremo no son costumbres antiguas que la IA volvió irrelevantes. Son la razón por la que podemos usar IA de forma responsable desde el principio.

Si tus herramientas hacen que el buen comportamiento sea el camino más fácil, la IA se vuelve mucho más útil. Si no, solo te ayuda a crear regresiones más rápido.
