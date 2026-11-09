---
title: "Santi020k Theme: del editor a la terminal"
description: "Cómo una paleta de VS Code se convirtió en un sistema para terminales con seis formatos, tres estilos Starship, shells administradas, validación y Homebrew."
coverImage:
  alt: "Una paleta violeta se ramifica en temas de terminal y estilos de prompt coordinados"
---

El tema de mi editor terminaba en el borde del editor.

Eso estaba bien cuando Santi020k Theme era solo una extensión de VS Code. Cuando el navegador adoptó la misma paleta, la terminal pasó a ser la superficie que faltaba. Allí paso buena parte del día, y todavía se veía desconectada del resto del espacio de trabajo.

La primera idea era sencilla: crear presets de color oscuros y claros para iTerm2 que combinaran.

El proyecto terminado se convirtió en [Santi020k Terminal Theme](https://terminal.santi020k.com/): paletas generadas para seis familias de terminales, tres estilos de prompt de Starship, integración administrada con la shell, una CLI de configuración, validación, archivos de distribución y publicación mediante Homebrew.

## Una paleta compartida también necesita decisiones propias de cada superficie

La terminal debe sentirse relacionada con el editor. No debe copiar a ciegas sus tokens.

Un tema de editor tiene ámbitos de sintaxis, selecciones, paneles, notificaciones, estados de Git y decenas de superficies de interfaz. Una paleta de terminal tiene colores ANSI, texto y fondo, comportamiento del cursor, selecciones y segmentos del prompt que combinan esos colores en movimiento.

Los paquetes compartidos del tema aportan el lenguaje de color y los tokens de origen. El paquete de terminal traduce esas decisiones a formatos apropiados para:

- iTerm2
- Ghostty
- Kitty
- WezTerm
- Windows Terminal
- Alacritty

Esos archivos se generan. El código fuente sigue siendo lo bastante pequeño para revisarlo, y cada terminal recibe la misma actualización deliberada cuando cambia la paleta.

## Oscuro y claro son modos del producto, no descargas separadas

Santi020k Terminal incluye presets oscuros y claros coordinados.

Las funciones opcionales de la shell siguen la apariencia del sistema de macOS y seleccionan la configuración correspondiente de Starship antes de cada prompt. Una shell abierta puede seguir un cambio de apariencia o de preset sin reconstruir la configuración a mano.

Los usuarios también pueden forzar un modo con `SANTI020K_THEME=dark` o `light`.

El comportamiento automático resulta cómodo. La opción explícita lo mantiene predecible.

Ese equilibrio importa en las herramientas de temas. Un producto debe seguir al sistema cuando sea útil y respetar al usuario cuando la elección del sistema no sea la que quiere para una sesión concreta de terminal.

## Un solo estilo de prompt no sirve para todas las máquinas

Los presets rich predeterminados de Starship usan iconos de Nerd Font y espacio generoso entre segmentos. Se ven mejor en un entorno personal completamente configurado.

Pero no todos los entornos son así.

Una máquina remota puede no tener la misma fuente. Una demostración grabada puede necesitar etiquetas más sencillas. Una terminal estrecha puede funcionar mejor con menos módulos de ejecución y un espaciado más compacto.

Por eso el paquete genera tres estilos, tanto oscuros como claros:

- **Rich** usa iconos de Nerd Font y la distribución de segmentos más expresiva.
- **Portable** reemplaza los iconos de aplicaciones por etiquetas de texto y conserva una estructura compatible con Powerline.
- **Minimal** elimina módulos de ejecución y reduce el espaciado.

La CLI puede cambiar de preset sin romper la selección automática de apariencia:

```bash
santi020k-terminal preset list
santi020k-terminal preset use portable
```

El prompt también muestra su segmento SSH solo cuando está presente `SSH_CONNECTION`. El contexto remoto se hace visible sin añadir ruido a cada comando local.

## La instalación no debería adueñarse de la shell sin avisar

La configuración de la shell es personal y fácil de dañar.

La instalación administrada conserva sus archivos en `~/.config/santi020k-terminal` y mantiene intacto el resto de `.zshrc`. Se puede ejecutar de nuevo de forma segura e incluye comprobaciones de estado, reparación y migración, en lugar de suponer que la primera escritura seguirá siendo correcta para siempre.

La CLI expone las operaciones importantes:

```bash
santi020k-terminal status
santi020k-terminal doctor --fix
santi020k-terminal configure
santi020k-terminal config export
santi020k-terminal config import
```

La configuración puede ser interactiva o reproducible. `configure` acepta elecciones explícitas de shell, preset, terminal y paleta. La exportación y la importación permiten llevar esas decisiones entre máquinas.

La instalación admite Zsh, Bash y Fish. Homebrew instala autocompletado nativo para las tres.

## La instalación de colores necesita el mismo modelo de seguridad

La CLI puede listar e instalar los colores de terminal incluidos:

```bash
santi020k-terminal colors list
santi020k-terminal colors install iterm2 dark
```

Hace copias de seguridad de los archivos que modifica y admite `--dry-run`.

Puede parecer excesivo para un tema, pero la configuración generada sigue siendo configuración. Los usuarios deben poder ver qué ocurrirá, conservar el estado anterior y reparar las desviaciones.

El tema de terminal sigue el mismo principio que aplico a otras herramientas de desarrollo: la automatización se gana la confianza con visibilidad y reversibilidad.

## Los prompts personalizados pueden seguir dentro del sistema

Los presets generados cubren las elecciones habituales. La CLI también admite selecciones personalizadas de módulos de ejecución:

```bash
santi020k-terminal prompt build work nodejs,python,rust dark
```

Esto crea un prompt con nombre sin cambiar los presets generados.

Esa separación mantiene limpio el proceso de actualización del paquete. Una nueva versión puede reemplazar los archivos generados mientras las elecciones personales del prompt siguen siendo personales.

## La validación trata los archivos generados como un contrato

El paquete de terminal no considera que la generación haya tenido éxito solo porque existan archivos.

La validación analiza todos los archivos TOML, comprueba que los recursos generados y las descargas del sitio no se hayan desviado, y renderiza prompts de prueba cuando está disponible la CLI de Starship.

El flujo de publicación crea:

- un archivo de distribución versionado
- metadatos SHA-256
- una fórmula de Homebrew

Las etiquetas que siguen la convención del paquete de terminal publican el archivo y actualizan el tap separado de Homebrew cuando las credenciales de publicación están configuradas.

El [artículo sobre empaquetado con Homebrew](/es/blog/shipping-macos-tools-with-a-homebrew-tap/) explica por qué esos metadatos de distribución viven en un repositorio pequeño propio, en vez de una segunda copia del producto.

## El tema ahora es una familia

El trabajo de terminal llegó junto con una expansión más amplia de Santi020k Theme.

La extensión de VS Code ahora incluye 12 variantes: oscura, clara, oscura de alto contraste y clara de alto contraste, cada una con estilos de sintaxis base, negrita y cursiva. También funcionan en entornos compatibles como Cursor, Windsurf, VSCodium y GitHub Codespaces. El paquete público del tema exporta JSON oscuros, claros y de alto contraste listos para Shiki, para resaltar código fuera del editor.

Chrome comenzó como un repositorio separado y un proyecto independiente del portafolio. Esa separación dejó de tener sentido cuando sus manifiestos oscuros y claros, el material de la tienda, el sitio del producto y las publicaciones pasaron a depender de la paleta del editor y de los tokens compartidos.

Moví el paquete de Chrome al monorepo de Santi020k Theme y reuní su historia en el [caso de estudio principal de Santi020k Theme](/es/portfolio/santi020k-theme/). Sigue siendo un producto empaquetado de forma independiente para Chrome Web Store. La integración trata de responsabilidad y fuente de verdad: los cambios del editor pueden regenerar las correspondencias del navegador, la validación compartida puede detectar desviaciones y un único grafo de Changesets puede coordinar las publicaciones sin convertir cada superficie en el mismo artefacto.

Los paquetes compartidos ahora exponen tokens, recursos, tipografía, valores de Tailwind, funciones de mapeo para Chrome, metadatos de producto, comportamiento del sitio y temas de Shiki. Cuatro sitios de Astro especializados documentan el centro de la familia y los productos para VS Code, Chrome y terminal.

El resultado no es un archivo de tema estirado para cubrir herramientas incompatibles.

Es un lenguaje de diseño traducido deliberadamente para cada superficie y respaldado por generación, validación, documentación y automatización de publicaciones.

Puedes [explorar Santi020k Terminal](https://terminal.santi020k.com/), leer el [caso de estudio unificado de Santi020k Theme](/es/portfolio/santi020k-theme/) o recorrer el [monorepo de Theme](https://github.com/santi020k/santi020k-theme).
