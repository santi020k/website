---
title: "MongoDB con Homebrew en macOS: convertir una instancia independiente en un conjunto de réplicas"
seoTitle: "Conjunto de réplicas MongoDB en macOS con Homebrew"
description: "Convierte MongoDB en un conjunto de réplicas local en macOS con Homebrew: cambios en mongod.conf, configuración de replicación y verificación."
coverImage:
  alt: "Un nodo de base de datos independiente se convierte en tres nodos sincronizados en un anillo de replicación"
---

Configurar un conjunto de réplicas de MongoDB en tu entorno local puede ser esencial para las pruebas y el desarrollo, especialmente cuando necesitas reproducir una configuración similar a producción. En esta guía recorreremos los pasos para configurarlo en tu equipo.

## Procedimiento

1. **Modifica mongod.conf para habilitar la replicación**

Abre el archivo **mongod.conf** y agrega la clave **replication** para habilitar la replicación.

- Ubicación de **mongod.conf**:
- **/usr/local/etc/mongod.conf** (en procesadores Intel)
- **/opt/homebrew/etc/mongod.conf** (en [procesadores Apple M1](https://support.apple.com/en-us/HT211814))

Agrega la replicación:

```yaml title="mongod.conf"
replication:
  replSetName: rs
```

Configuración original:

```yaml title="mongod.conf (Original)"
systemLog:
  destination: file
  path: /usr/local/var/log/mongodb/mongo.log
  logAppend: true
storage:
  dbPath: /usr/local/var/mongodb
net:
  bindIp: 127.0.0.1
```

Configuración modificada:

```yaml title="mongod.conf (Modified)"
systemLog:
  destination: file
  path: /usr/local/var/log/mongodb/mongo.log
  logAppend: true
storage:
  dbPath: /usr/local/var/mongodb
net:
  bindIp: 127.0.0.1
replication:
  replSetName: rs
```

1. **Reinicia el servicio de MongoDB**

En la consola, reinicia la instancia de MongoDB con:

```bash title="terminal"
brew services restart mongodb-community
```

1. **Conéctate a la consola de MongoDB**

En la consola, conéctate al intérprete de MongoDB con el comando:

```bash title="terminal"
mongosh
```

1. **Inicializa el conjunto de réplicas**

Inicia el conjunto de réplicas con:

```bash title="terminal"
rs.initiate({_id: "rs", members: [{_id: 0, host: "127.0.0.1:27017"}] })
```

1. **Cambia a la instancia primaria (opcional)**

Cambia a la instancia primaria usando `rs.status`

1. **Comprueba el estado del conjunto de réplicas**

Verifica el estado con `rs.status()`. Si todo funciona correctamente, este comando mostrará un JSON con todas las configuraciones.

1. 🕺 **¡Eso es todo!** 😎

## Conclusión

Configurar un conjunto de réplicas de MongoDB en tu entorno local es un paso importante para reproducir escenarios reales durante las pruebas y el desarrollo. Siguiendo estos pasos sencillos, puedes prepararlo de manera fluida y eficiente, y trabajar con MongoDB de una forma más versátil y sólida.
