---
title: "Distribuir herramientas para macOS con un tap personal de Homebrew"
seoTitle: "Distribuir herramientas para macOS con un tap de Homebrew"
description: "Cómo separé el código del producto de los metadatos de distribución y convertí versiones firmadas de la terminal en comandos conocidos de instalación y actualización con Homebrew."
coverImage:
  alt: "Una versión firmada atraviesa los metadatos de distribución y la verificación hasta convertirse en un paquete instalable"
---

Construir una herramienta de línea de comandos y hacer que instalarla sea agradable son dos trabajos distintos.

El código puede estar probado. El archivo puede estar firmado. La versión puede existir en GitHub. Aun así, una persona tiene que encontrar el archivo correcto, descargarlo, poner el ejecutable en un lugar razonable, instalar herramientas complementarias y recordar cómo actualizarlo.

Para quienes desarrollan en macOS, Homebrew ya ofrece una respuesta conocida.

Por eso creé el [tap de Homebrew de Santi020k](https://github.com/santi020k/homebrew-tap): un pequeño repositorio de distribución para mis herramientas de desarrollo.

Su primera fórmula instala [Santi020k Terminal](https://terminal.santi020k.com/), que forma parte de la familia [Santi020k Theme](/es/portfolio/santi020k-theme/).

## El comando de instalación es parte del producto

El flujo que ve la persona usuaria es deliberadamente convencional:

```bash
brew install santi020k/tap/santi020k-terminal
santi020k-terminal install
```

La fórmula instala la CLI de la terminal, las configuraciones de color, las configuraciones de Starship, una selección de ajustes de Zsh y las dependencias de Homebrew que necesitan.

Esto es mucho mejor que una página de versiones llena de instrucciones manuales. También facilita el soporte, porque la ubicación de instalación, las dependencias y la ruta de actualización siguen convenciones que la gente ya conoce.

Las actualizaciones encajan en el mismo modelo:

```bash
brew update
brew upgrade santi020k-terminal
santi020k-terminal update
```

Un comando predecible es una forma de documentación.

## El tap no debería convertirse en un segundo repositorio del producto

La decisión de diseño más importante es lo que el tap no contiene.

El código del producto, las pruebas, los archivos de las versiones, la documentación y la lógica de versionado viven en el monorepo de Santi020k Theme. El tap solo contiene los metadatos de empaquetado de Homebrew.

Así las responsabilidades quedan claras:

- el repositorio del producto construye y valida la versión
- el flujo de publicación genera el artefacto distribuible
- la fórmula apunta a ese artefacto y verifica su suma de comprobación
- el tap permite encontrar el artefacto a través de Homebrew

Duplicar el código o la lógica de publicación en el tap crearía dos lugares que pueden desincronizarse. Un repositorio de distribución pequeño es más fácil de auditar precisamente porque sigue siendo pequeño.

## Los metadatos generados evitan la desincronización entre versiones

El flujo de publicación de la terminal genera y actualiza la fórmula.

Esto importa porque los pasos manuales de empaquetado se olvidan con facilidad cuando la publicación del producto ya parece terminada. Puede salir una versión nueva mientras la fórmula sigue apuntando a un archivo anterior. Se puede copiar mal una suma de comprobación. Una dependencia puede cambiar en el producto sin cambiar en la ruta de instalación.

Generar la fórmula desde el mismo contexto de publicación reduce esas diferencias.

El tap sigue bajo control de versiones, de modo que cada cambio se puede revisar. La automatización prepara los metadatos; Git conserva el registro.

## Los repositorios de distribución tienen una responsabilidad de seguridad acotada

La fórmula de un gestor de paquetes conecta el equipo de una persona con un artefacto de una versión. Esa conexión debe ser explícita.

La fórmula identifica el archivo, la versión, la suma de comprobación, las dependencias y el comportamiento de instalación. Una persona usuaria o mantenedora puede leer todo el contrato sin entender el funcionamiento interno del producto.

Esa superficie acotada es una fortaleza. Facilita inspeccionar la ruta de distribución y limita la cantidad de código que debe cambiar en cada entrega.

El repositorio del producto sigue siendo responsable de la cadena de confianza más amplia: las pruebas, la validación de la compilación, los archivos publicados y el comportamiento de la CLI instalada.

## Homebrew también establece una relación de actualización

La instalación suele recibir casi toda la atención, pero las actualizaciones son donde una ruta de distribución demuestra su valor.

Cuando la herramienta está en Homebrew, nadie necesita recordar de dónde salió el archivo ni cómo llegó el ejecutable a su ruta. `brew upgrade` se ocupa de la capa del paquete. El comando de actualización de la CLI de la terminal se ocupa de la configuración y los recursos que le pertenecen.

Esa separación refleja el límite entre repositorios:

- Homebrew administra el paquete instalado.
- La herramienta administra su propia configuración para la persona usuaria.

Las responsabilidades claras facilitan cambiar ambos flujos más adelante.

## La infraestructura pequeña merece una entrada en el portafolio

El tap no es una aplicación grande. Es una pequeña pieza de ingeniería de publicaciones.

Aun así, lo considero un proyecto porque cambia si otro proyecto resulta utilizable. La distribución es parte de la experiencia de desarrollo. Un comando de instalación confiable, una ruta de actualización repetible y metadatos de empaquetado generados eliminan fricción cada vez que alguien prueba la herramienta.

El [caso de estudio unificado de Santi020k Theme](/es/portfolio/santi020k-theme/) cubre el producto de terminal que distribuye la fórmula, y el [repositorio del tap](https://github.com/santi020k/homebrew-tap) contiene los metadatos de empaquetado actuales.
