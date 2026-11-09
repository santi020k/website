---
title: "Abrir el código de autenticación sin compartir cuentas"
description: "Por qué hice público @santi020k/auth-cloudflare, cómo reutiliza políticas de códigos por correo y passkeys entre aplicaciones, y dónde termina ese límite compartido."
cardDescription: "Una base reutilizable de autenticación para aplicaciones Cloudflare, con códigos por correo, passkeys y cuentas separadas para cada producto."
coverImage:
  alt: "Tres entradas violetas, marfil y de cristal sobre plataformas separadas, unidas por una estructura fina que traza su forma compartida"
---

Hoy hice público el repositorio [`santi020k/auth`](https://github.com/santi020k/auth) y publiqué [`@santi020k/auth-cloudflare`](https://www.npmjs.com/package/@santi020k/auth-cloudflare) como paquete experimental `0.x`.

El paquete extrae la política de autenticación que necesito en aplicaciones de un solo propietario y multiusuario construidas con Hono, Cloudflare Workers y D1. Admite códigos por correo y passkeys, pero lo más importante es el límite que los rodea: compartir decisiones de protocolo no debe convertirse en compartir el estado de identidad.

El código es abierto bajo licencia MIT. La versión es pública y se puede instalar. También está etiquetada deliberadamente como experimental mientras las integraciones en orígenes reales de aplicaciones reúnen la evidencia necesaria para un contrato estable.

## El código repetido no era el problema real

Varias de mis aplicaciones necesitan la misma estructura básica de autenticación:

- un propietario configurado o una consulta de membresía propia de la aplicación;
- un código de correo de corta duración para iniciar sesión y recuperar acceso;
- una passkey después de la comprobación inicial de identidad;
- sesiones almacenadas junto al producto que las utiliza;
- una nueva comprobación de la membresía vigente al crear o resolver sesiones multiusuario y al ejecutar operaciones autenticadas de passkeys;
- límites de solicitudes que sobrevivan a los reinicios de los isolates de Cloudflare Workers; y
- límites estrictos de origen del navegador y cookies.

Copiar esa configuración a cada repositorio duplicaría más que código. Duplicaría decisiones de seguridad, migraciones, casos límite y expectativas de prueba. Una corrección en una aplicación podría fácilmente no llegar a otra.

Centralizarlo todo crearía el problema opuesto. Una base de cuentas o un sistema de sesiones compartido acoplaría productos que deberían poder desplegarse, recuperarse y evolucionar de manera independiente.

Quería reutilizar la política sin crear una plataforma de identidad.

## Comparte la política, no el estado de identidad

`@santi020k/auth-cloudflare` se encarga de la capa reutilizable de autenticación:

- configuración de Better Auth para Cloudflare Workers y D1;
- aplicación del propietario configurado o de la membresía vigente;
- vencimiento de códigos por correo y límites de verificación;
- respuestas con apariencia de éxito que evitan revelar si una dirección está autorizada;
- passkeys detectables con verificación del usuario;
- comprobaciones del origen exacto de las solicitudes;
- requisitos de cookies de producción;
- límites de solicitudes persistentes respaldados por D1; y
- exportaciones tipadas de servidor, navegador, middleware de Hono y esquema.

Cada aplicación consumidora sigue siendo responsable de sus usuarios, base de datos D1, migraciones aditivas, secreto, prefijo de cookies, hostname, identificador de parte de confianza, passkeys, textos de correo, proveedor de entrega, reglas de autorización, política de recuperación y despliegue.

Esa distinción es el proyecto. El paquete es útil porque se detiene donde empieza la responsabilidad del producto.

## Los códigos por correo y las passkeys tienen funciones distintas

Los códigos por correo aportan la comprobación inicial de identidad y una vía de recuperación. Tienen seis dígitos, se almacenan como hash, vencen a los diez minutos y permiten cinco intentos de verificación. Las direcciones no autorizadas reciben una respuesta con la misma estructura sin recibir correo, autenticarse ni crear un usuario.

Las passkeys mejoran el inicio de sesión habitual después de esa verificación inicial. La política exige credenciales detectables y verificación del usuario, y el identificador de parte de confianza de WebAuthn es el hostname exacto de la aplicación.

Ninguno de los mecanismos elimina la necesidad de planificar la recuperación. Un producto todavía debe decidir cómo se entrega el correo, cómo se restaura el acceso, qué ocurre durante una interrupción del proveedor y cómo se puede revertir una migración de forma segura.

## La autenticación en el edge necesita límites persistentes

Los isolates de Workers son descartables, por lo que un limitador de solicitudes en memoria no es un control de seguridad significativo. El paquete persiste el estado de esos límites en D1 junto a los registros de Better Auth específicos de la aplicación.

Los límites del navegador son igualmente explícitos. Un consumidor configura el origen público de su aplicación por separado de la URL de su servidor de autenticación. Las respuestas CORS con credenciales se limitan al origen exacto de esa aplicación, se rechazan las solicitudes inseguras sin el origen esperado y los orígenes de producción requieren HTTPS con cookies seguras.

El paquete también evita modificar datos de producción en silencio. Incluye un esquema D1 canónico que el consumidor copia en una migración aditiva propia de la aplicación, revisa y despliega mediante el proceso habitual de ese producto.

## Público no significa estable

El repositorio, la documentación y el paquete npm ya son públicos. La API sigue siendo un contrato experimental `0.x`, así que los consumidores deberían fijar la versión, leer el registro de cambios y conservar sus vías actuales de inicio de sesión y recuperación durante la adopción.

Las verificaciones automáticas cubren tipos estrictos, lint, exportaciones del paquete, comportamiento de integración con D1, accesibilidad del navegador, diseños adaptables, avisos de dependencias, CodeQL y procedencia de la publicación. Son necesarias, pero no pueden demostrar que el correo transaccional de un producto concreto llegue ni que una passkey funcione en su origen HTTPS definitivo.

Esa evidencia pertenece a cada integración. Una versión publicada del paquete y un consumidor listo para producción son hitos relacionados, no el mismo.

## Qué quiero facilitar con este proyecto

El objetivo no es hacer que la autenticación parezca trivial. Es hacer revisables las decisiones compartidas e imposibles de pasar por alto las responsabilidades propias del producto.

Abrir el proyecto permite a otros desarrolladores inspeccionar el modelo de seguridad, seguir su progreso, informar vulnerabilidades por el canal privado y evaluar si su contrato acotado a Cloudflare encaja en su aplicación. Mantener visible la etiqueta experimental hace que la madurez actual quede tan clara como la disponibilidad.

Puedes [leer la documentación](https://auth.santi020k.com/), [inspeccionar el código](https://github.com/santi020k/auth), [ver el paquete npm](https://www.npmjs.com/package/@santi020k/auth-cloudflare) o leer el [caso de estudio resumido del portafolio](/es/portfolio/auth/).
