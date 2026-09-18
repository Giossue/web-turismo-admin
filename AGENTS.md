# Web Turismo Admin

Portal separado para la landing institucional y la operación administrativa de Turismo
Vinculación.

## Límites

- La aplicación móvil es el único producto para turistas.
- Este repositorio no se conecta directamente a PostgreSQL, PostGIS, Redis ni MinIO.
- La API NestJS existente es la fuente de datos y la frontera de autorización.
- `/admin` está fuera de la navegación pública y de robots, pero esa ocultación no es
  autenticación. Antes de habilitar mutaciones se debe integrar sesión institucional,
  autorización por rol y auditoría en la API.

## Stack

- Next.js App Router, React y TypeScript.
- Material UI (MUI) v7 con `AppRouterCacheProvider` para SSR.
- Server Components para la landing y consultas públicas; Client Components solo para
  interacción del panel.

## Comandos

```bash
corepack pnpm install
corepack pnpm dev
corepack pnpm verify
```

Configura `TURISMO_API_URL` a la URL de la API NestJS. El valor predeterminado local es
`http://localhost:3000/api/v1`.
