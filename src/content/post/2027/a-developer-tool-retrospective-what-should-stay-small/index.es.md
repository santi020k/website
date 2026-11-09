---
title: "Retrospectiva de una herramienta de desarrollo: ¿qué debería seguir siendo pequeño?"
description: "Una revisión de la expansión de Santi020k Theme del editor a la terminal: la fuente compartida, los límites que cambiaron y lo que revisaría después."
coverImage:
  alt: "Un núcleo compacto de color lila se ramifica en tres marcos de blanco cálido con formas distintas e interiores violetas a juego"
---

Santi020k Theme comenzó como una extensión de VS Code. Después creció para incluir superficies de navegador y terminal, tokens compartidos, recursos generados y rutas de distribución separadas.

Documenté esa expansión en [el artículo sobre el paso del editor a la terminal](/es/blog/expanding-santi020k-theme-to-the-terminal/). Revisarla plantea una pregunta distinta de la historia original de implementación: cuando una herramienta de desarrollo pequeña crece, ¿qué partes deberían seguir siendo pequeñas?

Esta revisión se centra en las decisiones detrás de esa expansión: cómo compartir decisiones de diseño, conservar productos separados y mantener comprensible el comportamiento de instalación.

## Mantén pequeña la fuente de una decisión compartida

La paleta es una decisión compartida. El formato de archivo que usa cada aplicación es una traducción de esa decisión.

El proyecto de terminal genera salidas para varias familias de terminales, en lugar de tratar cada archivo de tema como un diseño que se mantiene por separado. Así, un cambio de paleta tiene una sola fuente que revisar, mientras se conservan los distintos formatos que necesitan sus consumidores.

Esta es la parte del diseño que mantendría: una fuente pequeña con correspondencias explícitas.

Las correspondencias siguen requiriendo cuidado. Una selección en el editor, un cursor de terminal y un segmento del indicador tienen funciones distintas. Reutilizar un valor de color no demuestra automáticamente que funcione en cada contexto. Los resultados generados deben revisarse donde la gente los usa.

## Permite que la responsabilidad cambie cuando cambian las dependencias

El tema de Chrome comenzó en un repositorio separado. Más adelante lo moví al monorepo de Theme cuando su paleta, sus recursos y la coordinación de las publicaciones quedaron estrechamente ligados al sistema compartido.

Eso cambió la responsabilidad sobre el código. No convirtió la extensión del navegador, la del editor y el paquete de terminal en un solo artefacto de instalación.

Esta diferencia importa en una retrospectiva. «Consolidamos los repositorios» solo describe un movimiento. La pregunta más útil es si ese movimiento acerca los cambios, la validación y la coordinación de publicaciones a la fuente de la que dependen.

Un producto separado puede compartir repositorio y conservar sus propias personas usuarias, formato de paquete, instrucciones de instalación y necesidades de publicación.

## Revisa la instalación como parte del producto

Un tema puede parecer de bajo riesgo porque su resultado visible es principalmente color. Una herramienta que modifica la configuración del shell cruza un límite de mayor importancia.

El trabajo de terminal incluye configuración administrada, copias de seguridad de los archivos modificados, una ruta de simulación y comandos de diagnóstico y reparación. Esas funciones facilitan inspeccionar el comportamiento de instalación y recuperarse de sus cambios.

También crean obligaciones de mantenimiento. Un instalador debe manejar configuraciones existentes, ejecuciones repetidas y cambios posteriores. Una primera instalación exitosa dice poco sobre lo que ocurre cuando alguien cambia de configuración o actualiza meses después.

Para una herramienta en esta situación, revisaría el ciclo de vida de la instalación junto con el resultado visual. La captura de pantalla solo demuestra una parte de la experiencia.

## Trata los archivos generados como resultados que vale la pena verificar

La generación reduce la edición repetida. También le da a un error una vía para llegar a varios resultados a la vez.

El flujo documentado de Theme comprueba si los recursos generados se han desviado, analiza la configuración de terminal y puede renderizar comprobaciones rápidas del indicador cuando la herramienta necesaria está disponible. Estas verificaciones conectan la fuente compartida con resultados concretos.

La pregunta de revisión es si las comprobaciones cubren las promesas de la documentación. Si un comando necesita una herramienta instalada específica, su ausencia debería seguir siendo visible en la evidencia. Si una descarga se genera, debería corresponder a la fuente que se publica.

Eso le da a una retrospectiva algo más útil que contar archivos generados: muestra qué relaciones están verificadas y cuáles todavía necesitan observación.

## Haz que el siguiente paso responda una pregunta de mantenimiento

Para la próxima revisión de una herramienta de desarrollo, elegiría una pregunta como estas:

- ¿Puede una persona nueva identificar la ruta de instalación correcta?
- ¿Puede una persona que ya la usa previsualizar un cambio de configuración y recuperarse de él?
- ¿Puede quien mantiene el proyecto rastrear un artefacto publicado hasta su fuente?
- ¿Necesita un nuevo consumidor una correspondencia distinta o un contrato compartido realmente diferente?

La expansión de Theme recuerda que crecer no exige ampliar cada abstracción. La fuente compartida puede mantenerse enfocada mientras cada consumidor recibe una implementación deliberada y su propia evidencia.

Para conocer la arquitectura concreta detrás de esta retrospectiva, lee el [caso de estudio de Santi020k Theme](/es/portfolio/santi020k-theme/).
