---
title: "Autenticación y autorización en aplicaciones Next.js con Supabase"
description: "Implementa autenticación mantenible en Next.js con Supabase SSR, rutas protegidas, sesiones y patrones de autorización claros para equipos de producción."
seoTitle: "Autenticación con Supabase en Next.js: SSR y rutas protegidas"
coverImage:
  alt: "Tarjeta de identidad que atraviesa controles de verificación y autorización hacia servicios protegidos"
---

[Lee el artículo anterior: integración y despliegue continuos para proyectos Next.js](/es/blog/continuous-integration-and-deployment-for-next-js-projects/)

Cuando un proyecto Next.js ya cuenta con análisis de código, pruebas e integración continua, otra pieza crítica suele aparecer muy pronto: la autenticación. Y en cuanto aparece, la autorización llega justo detrás.

Ahí es donde muchas bases de código frontend comienzan a ser más difíciles de mantener. El problema no suele ser iniciar sesión, sino dejar que la lógica de autenticación se propague por todas partes:

- Comprobaciones de rutas en componentes arbitrarios
- Redirecciones duplicadas
- Verificaciones de permisos mezcladas con el código de interfaz
- Lógica de servidor y cliente que hace casi lo mismo en lugares distintos

Prefiero evitarlo desde el principio.

En este artículo quiero mostrar una forma práctica de manejar la autenticación y la autorización en Next.js con Supabase, manteniendo el código lo bastante claro para que un equipo real pueda darle mantenimiento.

## La autenticación y la autorización son problemas distintos

Me gusta separar estos conceptos, incluso cuando se implementan uno cerca del otro.

- **Autenticación** responde: ¿quién es el usuario?
- **Autorización** responde: ¿qué puede hacer este usuario?

Si esas responsabilidades se mezclan demasiado pronto, el código se vuelve confuso. El proyecto empieza con una simple comprobación de si el usuario inició sesión y, unas semanas después, nadie sabe dónde se aplica realmente el control de acceso.

Por eso prefiero una estructura en la que:

1. la sesión se maneje en un lugar claro
2. las rutas protegidas se comprueben de forma consistente
3. los permisos se expresen de manera deliberada, en lugar de esconderse en condiciones de la interfaz

## Por qué Supabase encaja bien aquí

Para muchas aplicaciones Next.js, Supabase es una opción práctica porque ofrece:

- Autenticación
- Una base de datos Postgres
- Seguridad a nivel de fila
- SDK para cliente y servidor

Esa combinación es útil porque la autenticación y la autorización suelen necesitar estar cerca de la capa de datos. Si el frontend es el único lugar donde se aplica el control de acceso, la arquitectura ya es demasiado débil.

## Empieza con los paquetes compatibles con SSR

La recomendación actual de Supabase para la autenticación del lado del servidor utiliza `@supabase/ssr` junto con `@supabase/supabase-js`.

Instala los paquetes:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```bash title="terminal"
npm install @supabase/supabase-js @supabase/ssr
```

Después declara las variables de entorno:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```env title=".env.local"
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Es importante mantener esta configuración sencilla. No quiero un proyecto en el que los desarrolladores deban hacer ingeniería inversa de la inicialización de la autenticación antes de entender el flujo de la aplicación.

## Crea clientes separados para navegador y servidor

Prefiero establecer esta separación desde el inicio.

`lib/supabase/client.ts`

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```typescript title="lib/supabase/client.ts"
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

`lib/supabase/server.ts`

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```typescript title="lib/supabase/server.ts"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Components may not be allowed to write cookies directly.
          }
        }
      }
    }
  )
}
```

Lo que me gusta de esta estructura es que el límite queda claro:

- El código del navegador usa el cliente de navegador
- El código del servidor usa el cliente de servidor

Parece obvio, pero muchos errores de autenticación aparecen cuando esos límites se desdibujan.

## Renueva la sesión de autenticación de forma consistente

En la autenticación de Next.js del lado del servidor, la renovación de la sesión debe manejarse con cuidado. Un patrón común es usar `proxy.ts` para mantener actualizadas las cookies de autenticación antes de renderizar las rutas protegidas.

`lib/supabase/proxy.ts`

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```typescript title="lib/supabase/proxy.ts"
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  await supabase.auth.getUser()

  return response
}
```

`proxy.ts`

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```typescript title="proxy.ts"
import { type NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
```

La idea importante no es el nombre del archivo, sino centralizar la lógica de renovación de la sesión en lugar de improvisarla en cada página.

## Protege las rutas en el servidor

Si una página debe ser privada, prefiero aplicar la protección en el servidor antes de renderizarla:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```typescript title="app/dashboard/page.tsx"
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    redirect('/login')
  }

  return <div>Private dashboard</div>
}
```

Esto es mucho mejor que renderizar primero la página y luego ocultar partes en el cliente. Si una ruta es privada, quiero que la decisión se tome antes de que el usuario la vea.

## La autorización debe estar cerca de los datos

Aquí es donde muchos proyectos encuentran problemas.

Las comprobaciones de autorización en el frontend son útiles para el comportamiento de la interfaz, pero no confío en ellas como verdadera fuente de protección. Si los datos importan, quiero que el backend y la base de datos también apliquen la regla.

Con Supabase, la seguridad a nivel de fila es una de las mejores herramientas para lograrlo.

Por ejemplo, si los usuarios solo deben leer su propio perfil:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```sql title="sql"
alter table profiles enable row level security;

create policy "Users can view their own profile"
on profiles
for select
using (auth.uid() = user_id);
```

Y si solo deben actualizar su propio perfil:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```sql title="sql"
create policy "Users can update their own profile"
on profiles
for update
using (auth.uid() = user_id);
```

Confío mucho más en este tipo de autorización que en una condición `if` del frontend.

## Mantén simples las comprobaciones de permisos en la interfaz

El frontend sigue cumpliendo una función en la autorización, pero prefiero que sea muy clara y limitada:

<!-- TODO: Rewrite this historical article snippet as a valid standalone example before enabling ESLint for the fenced block. -->
<!-- eslint-skip -->
```tsx title="components/project-actions.tsx"
interface ProjectActionsProps {
  canEdit: boolean
}

const ProjectActions = ({ canEdit }: ProjectActionsProps) => (
  <div>
    {canEdit && <button type="button">Edit project</button>}
  </div>
)

export default ProjectActions
```

Esto está bien para la presentación. Lo que no quiero es que este componente sea el único lugar donde realmente se restringe la edición.

Mi regla es sencilla:

- Las comprobaciones de la interfaz mejoran la experiencia
- Las comprobaciones del backend y la base de datos hacen cumplir la regla

## Conclusiones

- La autenticación y la autorización deben tratarse como responsabilidades relacionadas, pero distintas.
- En Next.js, la renovación de la sesión y la protección de rutas deben manejarse de forma consistente en el servidor.
- Supabase funciona bien para esto porque la autenticación y el acceso a datos pueden diseñarse juntos.
- La seguridad a nivel de fila es una de las piezas más importantes de una autorización real.
- Las comprobaciones de permisos del frontend son útiles, pero no deben ser el último límite de seguridad.

[Serie relacionada: migrar de ESLint 8 o anterior a ESLint 9](/es/blog/migrate-eslint-8-or-less-to-eslint-9/ "ESLint en la práctica")
