---
title: "Authentication and Authorization in Next.js Applications with Supabase"
description: "A practical approach to authentication and authorization in Next.js with Supabase, focused on SSR, route protection, and keeping auth logic understandable."
publishDate: "2024-04-25T18:20:00.000Z"
tags: ["supabase", "authentication", "authorization", "nextjs", "typescript"]
coverImage:
  alt: "Neon illustration of a secure auth panel connected to protected access badges and role checkpoints"
  src: "./authentication-and-authorization-in-next-js-applications-with-supabase-cover.webp"
postType: "Tutorial"
seriesId: "building-a-production-nextjs-app"
seriesOrder: 7
---

[Read the Previous Post: Continuous Integration and Deployment for Next.js Projects](https://santi020k.com/blog/continuous-integration-and-deployment-for-next-js-projects/)

Once a Next.js project has linting, tests, and CI in place, another critical piece usually appears very quickly: authentication. And as soon as authentication appears, authorization follows right behind it.

That is where many frontend codebases start becoming harder to maintain. The problem is usually not signing users in. The problem is letting auth logic spread everywhere:

- Route checks in random components
- Duplicated redirects
- Permission checks mixed with UI code
- Server and client logic doing almost the same thing in different places

I prefer to avoid that from the beginning.

In this post, I want to show a practical way to handle authentication and authorization in Next.js using Supabase, while keeping the code understandable enough for a real team to maintain.

## Authentication and authorization are different problems

I like to keep these concepts separate, even when they are implemented close together.

- **Authentication** answers: who is the user?
- **Authorization** answers: what is this user allowed to do?

If those concerns are mixed too early, the code becomes confusing. A project starts with a simple "is the user logged in?" check, and a few weeks later nobody knows where access control is really enforced.

That is why I prefer a structure where:

1. the session is handled in one clear place
2. protected routes are checked consistently
3. permissions are expressed intentionally instead of hidden in UI conditions

## Why Supabase fits well here

For many Next.js applications, Supabase is a practical choice because it gives you:

- Authentication
- A Postgres database
- Row Level Security
- Client and server SDKs

That combination is useful because authentication and authorization often need to exist close to the data layer. If the frontend is the only place where access is enforced, the architecture is already too weak.

## Start with the SSR-friendly packages

The current Supabase recommendation for server-side auth uses `@supabase/ssr` together with `@supabase/supabase-js`.

Install the packages:

```bash title="terminal"
npm install @supabase/supabase-js @supabase/ssr
```

Then declare the environment variables:

```env title=".env.local"
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Keeping the setup simple here is important. I do not want a project where developers have to reverse engineer auth initialization before they can even understand the application flow.

## Create separate browser and server clients

I prefer this split from the start.

`lib/supabase/client.ts`

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

What I like about this is that the boundary stays clear:

- Browser code uses the browser client
- Server code uses the server client

That sounds obvious, but many auth bugs appear when those boundaries become blurred.

## Refresh the auth session consistently

For Next.js server-side auth, session refresh must be handled carefully. A common pattern is using `proxy.ts` so auth cookies stay updated before protected routes render.

`lib/supabase/proxy.ts`

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

The important idea is not the file name itself. The important idea is that session refresh logic should be centralized instead of improvised across pages.

## Protect routes on the server

If a page should be private, I prefer the protection to happen on the server before the page renders:

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

This is much better than rendering the page first and then hiding pieces of it on the client. If a route is private, I want the decision to be made before the user sees it.

## Authorization belongs close to the data

This is where many projects get into trouble.

Frontend authorization checks are useful for UI behavior, but I do not trust them as the real source of protection. If the data matters, I want the backend and database to enforce the rule as well.

With Supabase, Row Level Security is one of the best tools for this.

For example, if users should only read their own profile:

```sql title="sql"
alter table profiles enable row level security;

create policy "Users can view their own profile"
on profiles
for select
using (auth.uid() = user_id);
```

And if they should only update their own profile:

```sql title="sql"
create policy "Users can update their own profile"
on profiles
for update
using (auth.uid() = user_id);
```

This is the kind of authorization I trust much more than a frontend `if` statement.

## Keep UI permission checks simple

The frontend still has a role in authorization, but I prefer it to be very clear and limited:

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

This is fine for presentation. What I do not want is this component being the only place where editing is really restricted.

My rule is simple:

- UI checks improve the experience
- Backend and database checks enforce the rule

## Conclusions

- Authentication and authorization should be treated as related but separate concerns.
- In Next.js, session refresh and route protection should be handled consistently on the server.
- Supabase works well for this because auth and database access can be designed together.
- Row Level Security is one of the most important parts of real authorization.
- Frontend permission checks are useful, but they should not be the final security boundary.

[Next Post: Migrate ESLint 8 or Less to ESLint 9](https://santi020k.com/blog/migrate-eslint-8-or-less-to-eslint-9/)
