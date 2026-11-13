---
title: "Un cuaderno de viajes en Markdown: cómo modelar lo que aún no has escrito"
description: "Cómo construí páginas por país para mi cuaderno de viajes con un esquema que distingue lo no respondido del cero, separa hechos y opiniones en archivos distintos y oculta las páginas vacías de los buscadores."
coverImage:
  alt: "Portada provisional: un panel grafito con una sola franja violeta, a la espera de la ilustración final"
---

La [página de viajes](/es/travel/) de este sitio tiene un mapa del mundo y un cuaderno con los países en los que he estado. Ahora cada país tiene su propia página.

Lo interesante no fue el mapa. Fue construir páginas para notas que todavía no había escrito, sin llenar los vacíos con contenido inventado.

## Los hechos y las opiniones viven en archivos distintos

Hay dos tipos de información sobre un viaje.

Una parte son hechos: el país, los lugares, cuántas veces lo visité, dónde viví. Eso vive en un archivo de datos tipado. Alimenta el mapa, los totales y la lista del cuaderno.

El resto es personal: una puntuación, un resumen, lo más destacado, si volvería. Eso vive en un archivo Markdown por país.

Los archivos Markdown no repiten los hechos. El archivo de un país nunca dice cuántas visitas hubo. Se enlaza con sus hechos mediante un código de país, y el esquema rechaza un código que no exista en los datos.

Un hecho, un lugar. Si corrijo el número de visitas, lo cambio una sola vez y ninguna página puede contradecir al mapa.

## Sin respuesta no es cero

Cada archivo de país empieza vacío:

<!-- eslint-skip -->
```yaml
---
code: AR
score: null
summary: ''
visitedWhen: ''
highlights: []
wouldReturn: null
language: en
---
```

El esquema distingue «sin respuesta» de «una respuesta»:

- `score` es un número de 0 a 10, o `null`. Cero es una puntuación real. `null` significa que no lo he puntuado.
- `wouldReturn` es `yes`, `maybe`, `no` o `null`.
- `highlights` es una lista. Una lista vacía está bien. Un elemento vacío no.

Esto importa más de lo que parece. Un campo numérico que por defecto vale `0` convierte «no lo he pensado» en «el peor viaje de mi vida». Un booleano para «volvería» no puede decir «tal vez» ni «sin responder».

La página muestra cada estado de forma distinta. Una puntuación sin responder se lee como sin calificar. Nunca muestra un cero.

## El esquema se niega a adivinar

El cuaderno sabe cuántas veces visité un país. No sabe cuándo.

Sería fácil dejar que una página dijera «visitado varias veces desde 2019» a partir de un conteo y una suposición. Por eso `visitedWhen` es texto libre con mis propias palabras, y permanece vacío hasta que lo escribo. Nada deriva fechas de los conteos de visitas.

La misma regla aplica al mapa. Resalta países. No pone marcadores sobre ciudades, porque di nombres de lugares y no coordenadas, y algunos de esos nombres son regiones. Un marcador afirmaría una precisión que los datos no tienen.

Un sitio personal es un lugar pequeño para practicar esto, y es la misma disciplina que en un producto: no muestres un hecho que tus datos no contienen.

## Las páginas vacías quedan fuera de la búsqueda

Todas las páginas de países existen desde el primer día. Los enlaces del cuaderno necesitan un destino.

Una página sin resumen lleva `noindex, follow` y queda fuera del sitemap. Está disponible para quien llega con un clic, y no le pide a un buscador que indexe un encabezado y un conteo de visitas.

Cuando escribo el resumen, la página pasa a ser indexable. No hay que activar nada: la presencia del contenido es la señal.

Vale la pena aclarar qué hace esto y qué no. `noindex` controla el descubrimiento mediante la búsqueda. No es privacidad. Estos archivos son código fuente público de un sitio público.

## Un idioma por nota

El sitio tiene una interfaz en inglés y otra en español. Las notas de viaje son escritura personal, y no quería traducir dos veces mis propios recuerdos ni publicar una versión que en realidad no había escrito.

Cada archivo declara el idioma en el que están escritas sus notas. Los controles de la página y los datos del país siguen el idioma de la interfaz. Las notas se quedan en el idioma en que las escribí.

Solo la ruta que coincide con el idioma de la nota puede indexarse. La otra interfaz muestra la misma nota, marcada con su idioma real, y queda fuera de la búsqueda.

## El mapa funciona sin el mapa

El mapa es un componente de [Lumen](/es/portfolio/lumen-ui/), y la geometría de los países proviene de la misma biblioteca. Al seleccionar un país se abre una tarjeta con su nombre, su contorno y sus lugares.

Algunas decisiones lo mantuvieron usable para todo el mundo:

- Un selector de país nativo aparece antes de los botones de zoom en el orden de lectura y de teclado. Nunca tienes que apuntarle a un país pequeño.
- El cuaderno completo es un elemento desplegable nativo debajo del mapa. Funciona sin JavaScript.
- En un teléfono, la tarjeta sigue al mapa en el flujo de la página y no lo cubre.
- El orden de navegación es el orden de los datos. No pretende ser una línea de tiempo.

## Editar es abrir un archivo de texto

No hay pantalla de administración. Para completar un país, abro su archivo Markdown, escribo y reviso el resultado en local.

Suena primitivo, y es el tamaño correcto. El cuaderno tiene quince entradas: mi país y otros catorce. Un formulario, una base de datos y una cuenta serían más software que contenido.

La lista de los países que aún necesitan notas también es un archivo Markdown, en la documentación del repositorio.

## Lo que volvería a usar

El contenido de viajes es específico para mí. El modelado no:

1. Mantén los hechos en una fuente tipada y las opiniones en archivos de contenido que la referencian.
2. Dale a cada respuesta opcional un estado vacío explícito, y nunca dejes que lo vacío se muestre como cero.
3. No derives hechos que los datos no contienen.
4. Deja que la presencia del contenido controle la indexación.
5. Declara el idioma del texto escrito por ti, y no lo dupliques con una máquina.

Algunos de mis archivos de países siguen esperando sus notas. Las páginas son honestas al respecto, y la estructura está lista para cuando las escriba.
