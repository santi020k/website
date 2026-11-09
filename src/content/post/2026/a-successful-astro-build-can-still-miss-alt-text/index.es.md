---
title: "Cómo detectar y corregir la falta de texto alternativo en Astro"
description: "Detecta imágenes sin texto alternativo en Astro, elige el texto adecuado para diagramas e imágenes decorativas y comprueba la página en el navegador."
coverImage:
  alt: "Una lente de diagnóstico de vidrio revela una pieza ámbar incrustada en una pila de bloques de páginas violetas"
---

Una página de Astro puede compilar correctamente y publicar una etiqueta `<img>` sin el atributo `alt`. [Astro Doctor](/es/blog/astro-doctor-announcement/) puede detectar el atributo ausente en el código fuente. Para corregirlo, decide qué aporta la imagen y comprueba que la página ofrezca la misma información a quienes no puedan verla.

## Detecta imágenes sin texto alternativo

Imagina un artículo que explica cómo conectar un sensor. El diagrama de cableado está en `public/images/sensor-wiring.webp` y la página lo muestra así.

```html
<img src="/images/sensor-wiring.webp" width="960" height="540" />
```

Los componentes `<Image />` y `<Picture />` de Astro requieren la propiedad `alt`. Una imagen HTML puede mostrarse sin ella. [Documentación de imágenes de Astro](https://docs.astro.build/en/guides/images/#alt-text)

Ejecuta el análisis desde la raíz de tu proyecto de Astro.

```bash
pnpm dlx @santi020k/astro-doctor@latest --no-telemetry
```

Busca el [aviso `astro-doctor/no-missing-alt`](https://doctor.santi020k.com/docs/rules/no-missing-alt/). El análisis indica dónde está la imagen en el código fuente. A partir de ahí, decide qué información necesita quien lee la página.

## Explica qué aporta la imagen

En un diagrama de cableado, lo importante es saber qué pines conectar. Describe brevemente la imagen y pon al lado las instrucciones completas para que todo el mundo pueda leerlas. El ejemplo muestra el marcado de una página en inglés.

```html
<img
  src="/images/sensor-wiring.webp"
  width="960"
  height="540"
  alt="Sensor wiring diagram. Connections are listed below."
/>
<h2>Sensor connections</h2>
<ul>
  <li>Connect sensor VCC to the board’s 3.3 V pin.</li>
  <li>Connect sensor GND to board GND.</li>
  <li>Connect sensor OUT to board GPIO 4.</li>
</ul>
```

Estas conexiones ilustran el formato. Usa los pines y el voltaje que indique tu propio diagrama.

Si la imagen es puramente decorativa, usa `alt=""` para que las tecnologías de asistencia puedan omitirla. Si la imagen es el único contenido de un enlace o botón, describe su destino o acción. En otras imágenes informativas, describe el detalle que importa en ese contexto. El [árbol de decisión del W3C sobre el atributo alt](https://www.w3.org/WAI/tutorials/images/decision-tree/) cubre cada uno de estos casos.

## Comprueba la corrección en el código y en el navegador

Vuelve a ejecutar el análisis y confirma que ya no aparece el aviso para esa imagen. Abre la página en el navegador y lee el texto que rodea la imagen como si no pudieras verla. En el ejemplo del diagrama, la lista debería indicar todas las conexiones. Si usas un lector de pantalla, comprueba cómo anuncia la imagen y el enlace que la contiene, si lo hay.

Para repetir estas comprobaciones cuando cambie la página, complementa el análisis del código con una prueba en el navegador. Mi [guía de pruebas de accesibilidad con Playwright](/es/blog/playwright-accessibility-checks-that-teams-keep-running/) muestra cómo combinar un análisis automatizado con pruebas específicas de navegación por teclado.

## Ejecuta el análisis en GitHub Actions

Añade este paso a un job existente después de descargar el repositorio. La acción hace fallar el job ante avisos como la ausencia del atributo `alt`.

```yaml
- uses: santi020k/astro-doctor@ada77ece2296778b4c9a84b26229bd0c9e52c83f # v1
  with:
    comment: 'false'
    fail-on: warning
```
