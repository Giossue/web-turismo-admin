# web-turismo-admin

Landing institucional y futuro panel administrativo de Turismo Vinculación. La app móvil
es el único cliente para turistas; este repositorio no contiene una versión web turística.

## Arranque local

1. Copia `.env.example` a `.env.local` si la API no está en `http://localhost:3000`.
2. Inicia la API desde el monorepo principal:

```bash
cd ../app-turismo-vinculacion
corepack pnpm --filter @turismo/api dev
```

3. Instala dependencias y arranca Next.js:

```bash
bun install
bun run dev
```

Abre `http://localhost:3002` para la landing. El panel operativo está en
`http://localhost:3002/admin`; inicia sesión con una cuenta institucional creada en la
API. El navegador solo recibe un access token en memoria y mantiene el refresh token en
una cookie HttpOnly. Al recargar, el panel llama a `/auth/refresh` para reconstruir la
sesión sin usar `localStorage`.
El panel usa los `colorSchemes` de MUI y permite alternar entre tema claro y oscuro desde
el encabezado; la preferencia visual se conserva en el navegador.

## Integración

El portal consume la API NestJS mediante `TURISMO_API_URL` (servidor) o
`NEXT_PUBLIC_TURISMO_API_URL` (acciones del panel). Nunca abre conexiones directas a
PostgreSQL ni expone secretos en el navegador. La API aplica autenticación, autorización
por rol, CORS, rotación de refresh tokens y auditoría para las revisiones.

Para crear la primera cuenta institucional, ejecuta desde el monorepo de la API (con la
migración aplicada) usando variables de entorno temporales; el comando no guarda la
contraseña en el repositorio:

```bash
read -r -s AUTH_BOOTSTRAP_PASSWORD
export AUTH_BOOTSTRAP_PASSWORD
AUTH_BOOTSTRAP_EMAIL=admin@ejemplo.ec \
AUTH_BOOTSTRAP_NAME="Administrador" \
corepack pnpm --filter @turismo/api auth:create-user
unset AUTH_BOOTSTRAP_PASSWORD
```

## Verificación

```bash
bun run format
bun run lint
bun run typecheck
bun run build
```
