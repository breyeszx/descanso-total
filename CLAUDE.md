# Descanso Total

Sistema web de arriendos turísticos, transporte y tours. Ver `ROADMAP.md` para fases, estado y requisitos (RF/RNF).

## Stack
- Next.js 16 (App Router, `src/`, proxy en `src/proxy.ts`), React 19, TypeScript, Tailwind 4, shadcn/ui estilo base-nova (Base UI).
- Supabase: Auth, Postgres, Storage. Clientes en `src/lib/supabase/{client,server,proxy}.ts`. Guard por rol: `requirePerfil()` en `src/lib/auth.ts`.
- Migraciones SQL en `supabase/migrations/NNNN_nombre.sql`, numeradas y aplicadas en orden.
- Validación con zod en Server Actions. Idioma de la UI: español. Moneda CLP, zona horaria America/Santiago.

## Convenciones
- Rutas privadas bajo `src/app/(app)/`, públicas y auth bajo `src/app/(auth)/` o raíz.
- Roles: `admin`, `funcionario`, `cliente` (enum `rol_usuario` en `profiles`).
- Button de shadcn no acepta `asChild`; usar `render={<Link href="..." />}`.
- Secretos solo en `.env.local` (ignorado por git). Nunca pegarlos en el chat ni en el código.
- Commits en español, un commit por bloque funcional, push a `main`.

## Comandos
- `npm run dev` (puerto 3000), `npm run build`, `npm run lint`, `npx tsc --noEmit`.
