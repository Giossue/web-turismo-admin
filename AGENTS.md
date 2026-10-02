# Web Turismo Admin

Portal separado para la operación administrativa de Turismo Vinculación. La ruta principal
`/` redirige a `/admin`, que muestra el login institucional o el panel si existe una sesión.

## Límites

- La aplicación móvil es el único producto para turistas.
- Este repositorio no se conecta directamente a PostgreSQL, PostGIS, Redis ni MinIO.
- La API NestJS existente es la fuente de datos y la frontera de autorización.
- El portal está excluido del rastreo de robots, pero esa ocultación no es
  autenticación. Antes de habilitar mutaciones se debe integrar sesión institucional,
  autorización por rol y auditoría en la API.

## Stack

- Next.js App Router, React y TypeScript.
- Material UI (MUI) v7 con `AppRouterCacheProvider` para SSR.
- Tema compartido adaptado de las plantillas oficiales Dashboard y Sign-in, con Inter y
  modos claro/oscuro. Conservar etiquetas flotantes y estados de los formularios del panel.
- Server Components para las rutas y metadatos; Client Components solo para
  interacción del panel.

## Comandos

```bash
bun install
bun run dev
bun run verify
```

Configura `TURISMO_API_URL` a la URL de la API NestJS. El valor predeterminado local es
`http://localhost:3000/api/v1`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
