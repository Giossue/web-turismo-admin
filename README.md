# web-turismo-admin

Landing institucional y futuro panel administrativo de Turismo Vinculación. La app móvil
es el único cliente para turistas; este repositorio no contiene una versión web turística.

## Arranque local

1. Copia `.env.example` a `.env.local` si la API no está en `http://localhost:3000`.
2. Instala dependencias y arranca Next.js:

```bash
corepack pnpm install
corepack pnpm dev
```

Abre `http://localhost:3002` para la landing. El esqueleto operativo está en
`http://localhost:3002/admin`; no incluye todavía autenticación ni mutaciones.

## Integración

El portal consume la API NestJS mediante `TURISMO_API_URL`. Nunca abre conexiones directas
a PostgreSQL ni expone secretos en el navegador. Las operaciones administrativas deben
añadirse después de implementar autenticación, autorización por rol, CSRF/CORS y auditoría
en la API.

## Verificación

```bash
corepack pnpm format
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```
