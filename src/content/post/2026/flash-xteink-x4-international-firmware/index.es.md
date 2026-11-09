---
title: "Cómo instalé el firmware internacional en un Xteink X4"
seoTitle: "Xteink X4: instalar el firmware en inglés por microSD"
description: "Guía probada para reemplazar el firmware chino del Xteink X4 por la versión internacional mediante microSD cuando la instalación por USB no está disponible."
coverImage:
  alt: "Una tarjeta microSD atraviesa tres controles de verificación hacia un lector compacto de tinta electrónica"
---

<!-- cspell:words diskutil unbootable unlocker Xteink -->

Si tu Xteink X4 original no aparece por USB, puedes instalar el firmware oficial en inglés con
una tarjeta microSD. Confirma el modelo y haz una copia de seguridad de la tarjeta antes de seguir los pasos de la versión corta.

Compré un Xteink X4 esperando recibir el modelo internacional. El equipo que llegó era la versión para el mercado chino.

Cambiar el idioma de la interfaz no resolvía todo. El firmware original chino y el internacional usan servicios de
actualización y recorridos distintos en la aplicación complementaria, así que quería el firmware internacional en el
dispositivo y no una traducción parcial de la versión china.

La herramienta habitual de instalación desde el navegador no detectaba mi X4. Cambiar de puerto USB y mantener el dispositivo
activo no hizo diferencia: macOS no mostraba ningún dispositivo serie USB y Chrome indicaba **No compatible devices found**.
El método con microSD funcionó.

Este es el proceso exacto que seguí en un **Xteink X4 original con ESP32-C3**, no en el X4 Pro ni en el X4C.

## La versión corta

Descargué la imagen internacional vigente del X4 desde el servicio de actualizaciones internacionales de Xteink, la guardé
como `update.bin` en la raíz de la tarjeta microSD del X4 con formato FAT, expulsé la tarjeta de forma segura, la inserté en
el lector, conecté la alimentación USB y encendí el dispositivo manteniendo presionados **Arriba + Encendido**.

El X4 reconoció la actualización e instaló correctamente el firmware internacional. Si no inicia, revisa que el archivo
se llame exactamente `update.bin` y esté en la raíz de la tarjeta. Confirma que la imagen corresponda al X4 original
antes de volver a intentarlo.

## Lee esto antes de instalar el firmware

La instalación de firmware puede borrar el estado del dispositivo o dejar el lector sin poder arrancar. Una imagen válida
para un modelo de Xteink no es automáticamente válida para otro.

Antes de empezar:

- Confirma que el dispositivo diga **X4**, no X4 Pro, X4C ni X3.
- Carga el lector y mantenlo conectado a una alimentación USB estable durante la actualización.
- Haz una copia de seguridad de los libros y de cualquier archivo que no puedas reemplazar.
- Conserva las carpetas originales de la tarjeta SD; añade el archivo de firmware en lugar de formatear la tarjeta sin necesidad.
- Usa firmware internacional original del servicio de actualizaciones internacionales de Xteink. No lo sustituyas por un `.bin` cualquiera.
- Nunca desconectes la alimentación ni retires la tarjeta mientras se mueva el indicador de progreso.

Algunas unidades X4 destinadas al mercado chino o vendidas por tiendas de terceros vienen con la instalación por USB
desactivada. Eso es distinto de un puerto USB averiado. También significa que el desbloqueador de la comunidad no es una
herramienta universal de recuperación: sus responsables advierten que instalar firmware no compatible en una unidad
bloqueada puede dejarla detenida sin una vía de recuperación.

## Por qué falló el método USB

La herramienta habitual de CrossPoint para navegador usa WebSerial para conectarse al ESP32-C3 dentro del X4. En un
dispositivo desbloqueado, el proceso es sencillo:

1. Abre la [herramienta de instalación de CrossPoint](https://crosspointreader.com/#flash-tools) en Chrome o Edge.
2. Selecciona **Xteink X4**.
3. Selecciona **Xteink Factory Firmware → Stock English**.
4. Elige **Flash English Firmware** y conecta el dispositivo serie.

En mi caso no había ningún dispositivo serie que seleccionar. Lo comprobé directamente en el Mac y también en Chrome.
Cambiar de puerto y activar el lector no hizo que apareciera.

Esa evidencia importa. Presionar repetidamente el botón de instalación no puede reparar un dispositivo que el sistema
operativo nunca detecta. Después de probar un puerto que sabía que funcionaba y asegurarme de que el X4 estuviera activo,
pasé al mecanismo de actualización por tarjeta SD compatible con el X4.

Si tu lector sí aparece en Chrome, el recorrido del navegador es más sencillo. El resto de esta guía es para un X4 original
que no expone una conexión serie USB utilizable.

## Qué utilicé

- El Xteink X4 original
- Su tarjeta microSD y un lector de tarjetas
- Un Mac
- Alimentación USB estable para el lector
- El firmware internacional original del X4

La tarjeta incluida se montó como un volumen FAT de 15 GB. Ya contenía los libros de muestra en chino, fuentes externas y
carpetas de caché del X4. Dejé esos archivos donde estaban.

## Obtén el firmware internacional de Xteink

El proyecto de herramientas de CrossPoint obtiene el firmware original de Xteink desde las API de actualización del
fabricante. Para el X4 original, el canal internacional es `api-prod.xteink.cc`; el canal chino usa el servicio `.cn`.

En el momento de esta instalación exitosa, el 3 de septiembre de 2026, el servicio internacional devolvía **V6.2.4** para
el tipo de dispositivo `ESP32C3`. La respuesta apuntaba a este archivo versionado:

[`V6.2.4-X4-EN-PROD-0728_210023.bin`](https://overseas-static-file.oss-ap-southeast-1.aliyuncs.com/admin_uploads/firmware/202607/28/b9dced8c-45d7-4a2b-a13a-aed22e9e0bc0/V6.2.4-X4-EN-PROD-0728_210023.bin)

No supongas que V6.2.4 seguirá siendo la versión actual. Consulta el [endpoint internacional de actualizaciones del
X4](https://api-prod.xteink.cc/api/v1/check-update?current_version=V5.1.0&device_type=ESP32C3&device_id=12345&lng=en)
y revisa sus campos `version` y `download_url` antes de descargar. Confirma que el nombre del archivo identifique X4,
inglés y firmware de producción.

Descargué la imagen versionada, renombré la copia local a `update.bin` y verifiqué que tuviera la apariencia de una imagen
de aplicación ESP32 antes de copiarla a la tarjeta:

```sh
curl --fail --location \
  --output update.bin \
  'https://overseas-static-file.oss-ap-southeast-1.aliyuncs.com/admin_uploads/firmware/202607/28/b9dced8c-45d7-4a2b-a13a-aed22e9e0bc0/V6.2.4-X4-EN-PROD-0728_210023.bin'

stat -f 'size=%z bytes' update.bin
shasum -a 256 update.bin
xxd -l 16 update.bin
```

Para la imagen que instalé, los resultados fueron:

```text
size=5665376 bytes
SHA-256 eb345d59068ad9a2a14164134cfc521444f9fd295ca05d8164f78d17a46a44f0
first byte e9
```

Esa suma de verificación solo corresponde al archivo V6.2.4 enlazado. Una versión legítima más reciente debería tener
una suma de verificación diferente.

## Prepara la tarjeta microSD

Inserta la tarjeta del X4 en el computador y confirma qué volumen apareció. En macOS, estos comandos ayudan a
identificarlo sin modificar nada:

```sh
diskutil list external physical
ls -1 /Volumes
```

Mi tarjeta se montó en `/Volumes/NO NAME`, pero la tuya puede tener otro nombre. Verifica el volumen comprobando su
capacidad y las carpetas existentes de Xteink antes de copiar cualquier archivo.

Coloca `update.bin` en el nivel superior de la tarjeta. No debe estar dentro de las carpetas de libros, fuentes, caché
ni descargas. Puedes usar Finder. Desde Terminal, escribe entre comillas cualquier nombre de volumen que contenga espacios:

```sh
cp update.bin '/Volumes/NO NAME/update.bin'
shasum -a 256 '/Volumes/NO NAME/update.bin'
```

La segunda suma de verificación debe coincidir con la del archivo descargado. Si no coincide, borra la copia incompleta
e inténtalo de nuevo antes de poner la tarjeta en el lector.

Por último, expulsa la tarjeta correctamente desde Finder o con `diskutil eject`, usando el identificador real del disco
que se haya mostrado para tu tarjeta. No deduzcas el identificador a partir de este artículo.

## Instálalo en el X4

Una vez que hayas expulsado la tarjeta del computador de forma segura:

1. Inserta la tarjeta microSD en el X4.
2. Conecta el X4 a una alimentación USB estable.
3. Mantén presionados **Arriba + Encendido** al iniciar el lector.
4. Espera la pantalla de actualización del firmware y el indicador de progreso.
5. Mantén la alimentación conectada y la tarjeta insertada hasta que termine el proceso y el dispositivo se reinicie.

Después de esta secuencia, el dispositivo arrancó correctamente con el firmware internacional original.

Cuando inicie, confirma la versión de firmware indicada en Ajustes y completa la configuración internacional. Si usas
la aplicación complementaria de Xteink, trata el dispositivo recién actualizado como un registro nuevo, en lugar de suponer
que se conservará la vinculación anterior con la cuenta china.

## Qué no hace este proceso

Este procedimiento cambia el canal del firmware original en el X4 original. No demuestra que se haya desbloqueado la
instalación por USB ni es una instrucción para instalar CrossPoint, CrossInk u otro firmware de terceros.

Tampoco se aplica sin cambios al X4 Pro. El Pro usa una plataforma ESP32-S3 distinta y un formato de firmware cifrado,
y la documentación actual de CrossPoint indica que no tiene un mecanismo equivalente de instalación del firmware original
mediante SD. Trata cada nombre de modelo y formato de imagen como un límite estricto de compatibilidad.

## La lección útil de diagnóstico

Lo importante de esta reparación no fue un comando ingenioso para instalar firmware. Fue detenerme cuando cambió la evidencia.

Chrome no detectaba un dispositivo serie. macOS tampoco. Un puerto nuevo y un dispositivo activo no cambiaron eso.
Insistir con el método USB solo habría repetido el mismo fallo. La tarjeta SD entregó una imagen de firmware al actualizador
de fábrica existente del X4 mediante un canal que todavía podía leer.

Cuando trabajar con firmware implica un riesgo real de dejar el equipo inutilizable, diagnostica primero el transporte,
verifica después el hardware y la imagen exactos, y escribe solo cuando ambos coincidan.

## Referencias

- [Actualizaciones del sistema Xteink X4](https://www.xteink.com/pages/xteink-x4-system-update)
- [Herramientas de navegador y firmware original de CrossPoint](https://github.com/crosspoint-reader/crosspoint-tools)
- [Advertencia de CrossPoint para dispositivos Xteink con USB bloqueado](https://github.com/crosspoint-reader/crosspoint-reader#usb-locked-devices-xteink-unlocker)

CrossPoint es un proyecto comunitario y no está afiliado a Xteink. Utilicé sus herramientas públicas y su código fuente
para entender el transporte y los límites de seguridad; la imagen instalada provino del servicio de firmware internacional
de Xteink.
