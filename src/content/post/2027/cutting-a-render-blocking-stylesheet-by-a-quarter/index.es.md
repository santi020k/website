---
title: "Cómo reduje una cuarta parte de una hoja de estilos que bloqueaba el renderizado"
description: "El archivo CSS compartido de este sitio pesaba 79 KB comprimido en cada página. Mover las reglas de una sola ruta a su ruta lo redujo a 62 KB, con dos efectos secundarios que conviene conocer."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

Cada página de este sitio cargaba una hoja de estilos antes de poder mostrarse: 490 KB sin comprimir, 79 KB comprimida.

Una hoja de estilos en el head bloquea el renderizado. El navegador no pinta hasta que la descarga y la analiza. En una ejecución móvil de Lighthouse, este archivo era la principal solicitud que bloqueaba el renderizado, y el mayor elemento visible se pintaba entre los 3,0 y los 3,7 segundos.

Reduje el archivo cerca de una cuarta parte sin cambiar un solo estilo calculado. Aquí estaba el peso.

## Mide lo que hay en el archivo

Antes de mover nada, medí qué contenía el archivo. Dos cosas componían la mayor parte:

- Cerca del 43 % era la hoja de estilos completa de la biblioteca de componentes: todos los componentes, en todas las páginas.
- Unos 86 KB de CSS minificado pertenecían a una sola página cada uno. La página Sobre mí, la de Historia, la portada, la de Trabajo, la de Proyectos y la prosa de los artículos se importaban desde la hoja de estilos global.

Una revisión aproximada encontró que 656 de los 1347 selectores de clase del archivo no aparecían en ninguna parte del HTML ni del JavaScript compilados.

El segundo punto era el más sencillo. Quien leía un artículo descargaba la composición de la página Sobre mí, la línea de tiempo de Historia y la portada.

## Mueve el CSS de cada ruta a su ruta

El cambio es mecánico. Los estilos que necesita una sola ruta salen de la hoja de estilos global hacia un archivo que solo importa esa página:

```text
src/styles/
  global.css        tokens, base rules, shared partials
  partials/         styles every page may need
  pages/
    about.css
    history.css
    home.css
    work.css
  prose.css         articles and case studies only
```

Cada archivo de ruta empieza con una referencia a la hoja de estilos global, para que los tokens del tema y las utilidades se resuelvan sin emitirse por segunda vez:

```css
@reference "../global.css";
```

La prosa de los artículos fue el mayor traslado individual. Los estilos de prosa cubren encabezados, bloques de código, tablas, notas destacadas y figuras. Solo los layouts de artículos y casos de estudio los necesitan, y en ese momento eran 71 de las 453 páginas del sitio.

El archivo compartido pasó de 490 KB a 364 KB sin comprimir, y de 79 KB a 62 KB comprimido.

## Efecto secundario uno: el orden de origen deja de ser confiable

En una sola hoja de estilos grande, el orden está bajo tu control. La regla posterior gana.

Cuando los estilos se dividen, el empaquetador decide el orden de las etiquetas link a partir del grafo de importaciones. La hoja de estilos de una ruta puede enlazarse antes o después del paquete compartido, y eso puede variar entre páginas.

Cualquier regla que dependiera de aparecer después queda frágil. Resolví esos conflictos con especificidad. Si una regla de ruta debe ganarle a una compartida, lo expresa en su selector, y ya no importa qué archivo se carga primero.

Verifiqué el resultado comparando los estilos calculados antes y después, no mirando capturas de pantalla. Las capturas no detectan un margen que cambió en un estado que no abriste.

## Efecto secundario dos: Safari y la navegación del lado del cliente

Este sitio usa navegación del lado del cliente. Cuando sigues un enlace, el enrutador inserta la nueva página en el documento actual y agrega las hojas de estilos que la nueva página necesita.

Safari aplica una hoja de estilos enlazada durante ese intercambio solo después de que la nueva página se ha pintado. Durante un fotograma, una página con su propia hoja de estilos aparecía sin su composición.

La solución está en el hook del enrutador. Antes del intercambio, cada hoja de estilos que agrega la siguiente página se copia en un elemento `<style>` del documento entrante. Los estilos en línea se aplican junto con el intercambio. Los archivos ya están precargados, así que la copia es una lectura de caché.

Una carga completa de la página nunca se vio afectada. Solo aparecía durante la navegación, en un motor, durante un fotograma: justo el tipo de error que una suite de pruebas de un solo navegador nunca informa.

## El HTML también pesaba

Mientras medía el CSS revisé los documentos mismos. Dos patrones resaltaron.

**Resaltado de sintaxis.** El resaltador escribía un atributo `style` en línea en cada token. Un tutorial largo tenía unos 1580, con solo 24 valores distintos. Emitir una clase por color y una hoja de estilos pequeña eliminó la repetición.

**Íconos repetidos.** Una página de listado tenía 555 SVG en línea, y solo 16 eran distintos. Un mismo ícono de flecha aparecía 510 veces. Definirlo una vez y referenciarlo en los demás lugares eliminó las copias.

En conjunto, eso recortó el HTML de los artículos entre un 17 y un 19 por ciento.

## Después también se movió la biblioteca

La mayor parte del archivo era la biblioteca de componentes, y eso no podía arreglarlo desde el sitio.

Se arregló en el origen. La siguiente versión mayor de [Lumen](/es/portfolio/lumen-ui/) permite que cada componente traiga sus propios estilos, y adoptarla llevó el archivo compartido de 62 KB a unos 30 KB comprimido.

No es una ganancia pura. Ahora una página enlaza varias hojas de estilos más pequeñas donde antes enlazaba una, y el total de una sola página bajó menos que el archivo compartido. Lo que cambió para bien es el principio: una ruta paga por lo que muestra.

## Los presupuestos evitan que vuelva a crecer

Una limpieza única se deteriora. La siguiente funcionalidad agrega una regla al archivo global porque es el lugar más fácil.

Lighthouse se ejecuta en CI contra la compilación de producción, con una puntuación de rendimiento de al menos 0,90 en cada ruta medida, un tope para el tamaño del DOM y un límite para el mayor elemento visible. La comprobación se ejecuta tres veces por ruta para suavizar el ruido.

## Si quieres intentarlo

1. Abre tu hoja de estilos más grande y averigua qué parte pertenece a una biblioteca, a una sola página y a todo el sitio.
2. Mueve primero las reglas de una sola página. El riesgo es bajo y el efecto es inmediato.
3. Reemplaza las reglas que dependen del orden por especificidad explícita antes de dividir cualquier otra cosa.
4. Prueba la navegación del lado del cliente en Safari.
5. Agrega un presupuesto, para que el archivo no pueda volver en silencio a su tamaño anterior.
