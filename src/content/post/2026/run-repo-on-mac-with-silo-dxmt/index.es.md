---
title: "Cómo logré ejecutar R.E.P.O. en Mac sin Whisky"
seoTitle: "Cómo jugar R.E.P.O. en Mac con Silo y DXMT"
description: "Una configuración probada en Apple silicon para ejecutar R.E.P.O. con Silo, Wine y DXMT, incluido el fallo gráfico de DirectX y su solución exacta."
coverImage:
  alt: "Un objeto de videojuego atraviesa un puente de traducción preciso desde los gráficos de Windows hasta un entorno renderizado con Metal"
---

<!-- cspell:words appmanifest CodeWeavers D3DMetal dxgi DXMT GPTK inspectable libraryfolders redistributables Sandboxed Steamworks userspace winemetal winetricks -->

Logré ejecutar la versión de Steam para Windows de R.E.P.O. en Apple silicon con **Silo, Wine y DXMT**. Instala
Steam dentro de Silo, descarga el juego ahí y elige DXMT en sus ajustes gráficos. Si ya instalaste el juego y
aparece el error de DirectX 11, ve a la sección sobre cómo fijar DXMT y verificar la ruta de 64 bits.

R.E.P.O. no tiene una versión nativa para Mac. Su página de Steam indica Windows 10 u 11, DirectX y una GPU dedicada para Windows.
Eso suele dejar a quienes juegan en Mac entre tres opciones: un PC con Windows, un producto de compatibilidad de pago o una guía antigua de la comunidad
cuyas herramientas quizá ya no reciban mantenimiento.

Yo quería una cuarta opción: usar el Mac que ya tengo, conservar el cliente real de Steam y sus comprobaciones de propiedad, y construir
la configuración únicamente con componentes gratuitos que pudiera inspeccionar.

Funciona. La combinación que dio resultado fue **Silo + Wine + DXMT** en un Mac con Apple silicon. Lo interesante no fue instalar
Steam, sino diagnosticar por qué el juego fallaba al principio con un error de DirectX 11 y elegir los módulos de traducción
gráfica de 64 bits correctos.

Esta guía documenta la configuración que me funcionó el 4 de septiembre de 2026. Es un experimento independiente de compatibilidad,
no una adaptación oficial para Mac ni una promesa de que todos los Mac, las actualizaciones del juego o las versiones de Silo se comporten igual.

## El resultado

Probé el juego en este equipo:

- MacBook Pro con Apple M5 Pro
- 24 GB de memoria unificada
- macOS 27.0
- Silo 0.4.10, compilado localmente desde el código fuente
- Wine CX 26.3.0
- DXMT 0.72
- una copia legítima de R.E.P.O. en Steam, con ID de aplicación `3241660`

R.E.P.O. se inició mediante el cliente real de Steam para Windows. Steamworks se cargó, Direct3D negoció el nivel de funcionalidad 11.1 y
el juego siguió ejecutándose en vez de cerrarse durante la inicialización gráfica.

Esa evidencia es más acotada que decir «R.E.P.O. es compatible con Mac». Demuestra que esta combinación funcionó en un equipo con Apple silicon.

## Por qué no usé Docker

Docker es útil para servicios de Linux y entornos de compilación reproducibles. En un Mac, es una abstracción inadecuada para
este trabajo.

Un contenedor de Linux en macOS se ejecuta dentro de una máquina virtual. No le da a un juego de Windows con DirectX la ruta nativa de GPU Metal,
la integración con el escritorio, el audio, la entrada ni el entorno de compatibilidad con Steam que necesita. Lograr que apareciera una ventana del juego desde
esa combinación añadiría capas de virtualización y visualización sin resolver el problema de DirectX a Metal.

La arquitectura útil es mucho más sencilla:

1. Wine proporciona el entorno de espacio de usuario de Windows.
2. El cliente real de Steam para Windows se ejecuta en la misma botella de Wine que el juego.
3. Un motor gráfico traduce las llamadas Direct3D del juego a Metal.
4. Silo administra esas piezas y recuerda el motor elegido para cada juego.

## Por qué Silo en lugar de Whisky

[Whisky](https://github.com/Whisky-App/Whisky) facilitó jugar títulos de Windows en Apple silicon, y muchos tutoriales antiguos
todavía lo recomiendan. Sin embargo, su repositorio se archivó en mayo de 2025 y sus responsables advierten expresamente que ya no
recibe mantenimiento activo y que los juegos podrían dejar de funcionar.

[Silo](https://github.com/mikaelhug/Silo) es un lanzador de código abierto más reciente, escrito en SwiftUI y construido con el mismo objetivo práctico. Ejecuta
un cliente real de Steam para Windows en una botella de Wine compartida, importa el Game Porting Toolkit de Apple, instala DXMT y permite
elegir o reemplazar el motor gráfico Metal de cada juego. Su entorno de ejecución de Wine se compila a partir del código publicado de
CrossOver de CodeWeavers, y las descargas de sus entornos se verifican mediante sumas de comprobación.

Silo todavía es un proyecto comunitario joven. La aplicación tiene una firma ad hoc, no se distribuye mediante la Mac App Store y no
usa App Sandbox porque debe ejecutar Wine y administrar su botella. Lee su código y sus notas de seguridad antes de decidir
si ese modelo de confianza te sirve.

## Qué necesitas

Antes de empezar, ten a mano:

- un Mac con Apple silicon
- una versión actual de macOS compatible con Silo
- espacio suficiente para Wine, Steam, los entornos de traducción y el juego
- una cuenta de Steam que tenga R.E.P.O.
- una cuenta gratuita de Apple Developer para descargar oficialmente Game Porting Toolkit
- una copia de seguridad de cualquier configuración de Silo que te interese conservar

La [página de R.E.P.O. en Steam](https://store.steampowered.com/app/3241660/repo/) indica 8 GB de RAM y 1 GB de almacenamiento como
mínimos para Windows. No son garantías de compatibilidad con Mac, y la configuración completa de Wine ocupa más almacenamiento que
el juego por sí solo.

No uses este proceso para eludir la propiedad en Steam, DRM, sistemas antitrampas ni restricciones multijugador. Esta configuración resulta
útil porque el cliente real de Steam y el juego se ejecutan juntos en la misma botella.

## Instala Silo

La vía más sencilla es la compilación actual de la [página de versiones de Silo](https://github.com/mikaelhug/Silo/releases). Como la
aplicación descargada tiene una firma ad hoc, macOS puede exigir **Control-clic → Abrir** la primera vez.

Yo preferí compilar el código exacto que iba a ejecutar. Silo necesita una cadena de herramientas de Swift 6; las Command Line Tools de Apple
son suficientes.

```sh
git clone https://github.com/mikaelhug/Silo.git
cd Silo
git checkout v0.4.10
./Scripts/test.sh
./Scripts/build-app.sh
ditto dist/Silo.app /Applications/Silo.app
open /Applications/Silo.app
```

El script de pruebas completó **525 pruebas distribuidas en 71 suites** antes de que instalara la aplicación. Esa cifra corresponde a la versión 0.4.10
y cambiará naturalmente a medida que el proyecto evolucione.

Compilar desde el código fuente no vuelve seguro automáticamente el código de terceros. Sí permite inspeccionar la revisión exacta y el proceso
de compilación, que era la propiedad que yo buscaba.

## Importa el kit de Apple y configura Steam

El flujo inicial de Silo solicita el Game Porting Toolkit de Apple, luego descarga sus entornos de Wine y DXMT y crea la
botella compartida de Steam.

Para una instalación limpia:

1. Descarga el [Game Porting Toolkit actual de Apple](https://developer.apple.com/games/game-porting-toolkit/).
2. En Silo, selecciona el archivo `.dmg` descargado cuando te lo pida.
3. Deja que Silo descargue Wine y sus entornos gráficos.
4. Completa ambos instaladores de los paquetes redistribuibles de Microsoft Visual C++ cuando aparezcan.
5. Inicia sesión en el cliente real de Steam para Windows que abre Silo.

Yo ya tenía un entorno GPTK 3 firmado por Apple e instalado mediante Heroic, así que reutilicé una copia para el experimento inicial. Quienes
empiecen de cero deberían seguir la importación de `.dmg` admitida por Silo, en vez de depender de la estructura privada de carpetas de otro lanzador.

Apple describe GPTK como un entorno de evaluación y adaptación para ejecutar archivos ejecutables de Windows sin modificar en Apple
silicon. Silo convierte esa capacidad de bajo nivel en un lanzador de juegos, pero ni Apple ni los desarrolladores de R.E.P.O.
respaldan oficialmente esta configuración específica.

## Instala R.E.P.O. en el cliente de Steam para Windows

Usa Steam dentro de Silo tal como lo harías en Windows:

1. Busca R.E.P.O. en tu biblioteca.
2. Instálalo y espera a que Steam termine de descargar y validar los archivos.
3. Vuelve a Silo y actualiza su biblioteca si el juego no aparece de inmediato.
4. Abre la configuración del juego en Silo y elige **DXMT** como motor gráfico.

Silo detecta los juegos instalados a partir de los archivos `appmanifest_*.acf` y `libraryfolders.vdf` de Steam. Empezar la instalación no
basta: el manifiesto completo de Steam debe existir para que la detección funcione.

## El fallo gráfico que encontré

Mi primer inicio usó la ruta automática/GPTK y falló antes de que se inicializara la ventana del juego:

```text
Failed to initialize graphics.
Make sure you have DirectX 11 installed, have up to date
drivers for your graphics card and have not disabled
3D acceleration in display settings.
InitializeEngineGraphics failed
```

El registro del fallo de Wine también contenía un error de página nula después de cargar `dxgi` y `d3d11`.

Ese mensaje parece indicar que falta un controlador de Windows, pero instalar paquetes redistribuibles de DirectX al azar no resolvería el
límite que estaba fallando. En este Mac, el error se producía mientras Wine elegía y cargaba la capa responsable de
traducir Direct3D 11 a Metal.

[DXMT](https://github.com/3Shain/dxmt) es específicamente una implementación de Direct3D 10 y 11 para Wine basada en Metal. R.E.P.O.
es un juego de Unity de 64 bits, así que necesitaba los módulos `x86_64-windows` de DXMT. Mi configuración de Silo apuntaba al directorio
vecino `i386-windows`.

## La solución: fijar DXMT y verificar la ruta de 64 bits

Primero usa la configuración por juego de Silo para establecer **DXMT** como motor gráfico de R.E.P.O. En las versiones actuales de Silo, ese debería ser
el único cambio manual necesario.

Si persiste el mismo error de inicialización de DirectX, cierra completamente tanto el juego como Silo antes de inspeccionar la configuración:

```sh
silo_support="$HOME/Library/Application Support/Silo"
cp "$silo_support/config.json" "$silo_support/config.json.before-repo-dxmt"
open -e "$silo_support/config.json"
```

Dentro del objeto `backend`, inspecciona `dxmtLibDirPath`. El directorio final para este juego de 64 bits debe ser
`x86_64-windows/`, no `i386-windows/`. La versión del entorno que aparece en el resto de la ruta dependerá de la versión de Silo instalada:

```json
{
  "backend": {
    "dxmtLibDirPath": "file:///Users/you/Library/Application%20Support/Silo/Runtimes/dxmt-.../x86_64-windows/"
  }
}
```

Después busca la entrada del juego con `"appID": 3241660` y verifica que contenga:

```json
{
  "appID": 3241660,
  "graphics": "dxmt"
}
```

No reemplaces el resto de ninguno de los objetos por estos ejemplos abreviados. Conserva las claves existentes, cambia solo el
segmento incorrecto de la ruta o el valor gráfico, guarda un JSON válido y vuelve a abrir Silo. La copia de seguridad permite revertir la edición manual.

Después, Silo creó una variante del entorno de Wine específica para DXMT e inició el juego con el ejecutable `wine64` de 64 bits.

## Cómo comprobé que realmente estaba solucionado

Que no apareciera el diálogo de error era alentador, pero el registro del juego aportó evidencia más sólida. Silo conserva un registro por ID de
aplicación de Steam. Revisé el de R.E.P.O. con:

```sh
repo_log="$HOME/Library/Application Support/Silo/Logs/3241660.log"
grep -Ei 'feature level|winemetal|InitializeEngineGraphics|Unhandled page fault' "$repo_log"
```

El inicio exitoso mostró:

```text
Maximum supported feature level: D3D_FEATURE_LEVEL_11_1
Using feature level D3D_FEATURE_LEVEL_11_1
```

Esa misma ejecución cargó `steam_api64`, siguió activa después del inicio y no contenía el fallo anterior de inicialización gráfica
ni el error de página. Junto con la ventana del juego renderizada, eso bastó para considerar que la configuración funcionaba.

## Notas para resolver problemas

### Silo no muestra R.E.P.O.

Confirma que Steam haya terminado la descarga y luego actualiza la biblioteca de Silo. Busca el manifiesto de Steam para el ID de aplicación `3241660` si
la detección sigue fallando.

### Steam abre una ventana vacía o incompleta

Cierra Steam desde Silo y vuelve a abrirlo. Silo inicia Steam con opciones de compatibilidad para su interfaz basada en Chromium; no
añadas ajustes de Wine que no estén relacionados antes de que el inicio normal haya tenido la oportunidad de completar la configuración inicial.

### Vuelve el mensaje de DirectX 11

Confirma que el juego esté fijado a DXMT y que `dxmtLibDirPath` termine en `x86_64-windows/`. Revisa también el registro más reciente del juego;
un registro de fallo antiguo puede hacer que una configuración reparada parezca averiada.

### El chat de voz no te escucha

Permite el acceso al micrófono para Silo cuando macOS lo solicite. Si rechazaste el permiso, revisa **Configuración del Sistema → Privacidad y
seguridad → Micrófono** y vuelve a iniciar el juego.

### Una actualización rompe la configuración

Trata Silo, Wine, DXMT, Steam, macOS y R.E.P.O. como piezas independientes que cambian. Anota las versiones que funcionaron por última vez, conserva una
copia de `config.json` e inspecciona el registro más reciente del juego antes de modificar varias capas a la vez.

## Qué recomendaría ahora

Para alguien con Apple silicon que ya tenga el juego y busque una vía gratuita, Silo es un punto de partida más defendible que
seguir una receta antigua de Whisky. Está activo, es de código abierto, usa el cliente real de Steam y permite elegir la opción gráfica que
hizo posible esta reparación.

No tiene el mismo nivel de acabado ni de soporte que comprar un PC con Windows o pagar por un producto comercial de compatibilidad. Algunos juegos
fallarán por sistemas antitrampas, comportamientos gráficos no admitidos, lanzadores o futuras actualizaciones. El propio R.E.P.O. podría cambiar.

Pero este resultado es útil precisamente porque es reproducible y se puede diagnosticar. La clave no fue fingir que el
juego era nativo. Fue asignar una responsabilidad clara a cada límite —Steam para la propiedad, Wine para el comportamiento de Windows, DXMT para
Direct3D 11 y Metal para la GPU del Mac— y leer el registro cuando uno de esos límites eligió la arquitectura incorrecta.

Esa es una base mucho más saludable que mantener vivo indefinidamente un envoltorio archivado.

## Referencias

- [Código, configuración, arquitectura y notas de seguridad de Silo](https://github.com/mikaelhug/Silo)
- [Código y documentación de DXMT](https://github.com/3Shain/dxmt)
- [Game Porting Toolkit de Apple](https://developer.apple.com/games/game-porting-toolkit/)
- [R.E.P.O. en Steam](https://store.steampowered.com/app/3241660/repo/)
- [Aviso de mantenimiento de Whisky](https://github.com/Whisky-App/Whisky)

Si te interesa la ingeniería detrás de facilitar la instalación de software para Mac, también escribí sobre [distribuir herramientas para macOS
con un tap personal de Homebrew](/es/blog/shipping-macos-tools-with-a-homebrew-tap/).
