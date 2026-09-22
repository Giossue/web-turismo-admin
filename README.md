# web-turismo-admin

Landing institucional y futuro panel administrativo de Turismo Vinculación. La app móvil
es el único cliente para turistas; este repositorio no contiene una versión web turística.

## Arranque local

La forma recomendada es arrancar todo desde el monorepo principal:

```bash
cd ../app-turismo-vinculacion
corepack pnpm dev:local
```

El comando levanta PostgreSQL/PostGIS, aplica las migraciones, inicia la API y arranca esta
web con las variables `TURISMO_API_URL` y `NEXT_PUBLIC_TURISMO_API_URL` correctas.
Abre `http://localhost:3002/admin`.

Para arrancar solo esta web manualmente:

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

## Módulos compartidos

Antes de duplicar lógica en un componente, usa estos módulos. `src/lib` nunca importa
desde `src/components`.

| Módulo                                         | Propósito                                                                                                                                                                                                 |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/config.ts`                            | URL de la API: `getApiUrl()` (servidor `TURISMO_API_URL`, navegador `NEXT_PUBLIC_TURISMO_API_URL`) y `publicApiUrl` para enlaces renderizados.                                                            |
| `src/lib/http.ts`                              | `fetch` común (sin `Content-Type` en GET, errores de red en español), `ApiError` con `status` y `toQueryString`.                                                                                          |
| `src/lib/admin-api.ts`                         | Único cliente de la API administrativa (token, renovación ante 401, `importFichaFile`) y tipos compartidos (`Page`, `ReviewAction`, `EstablishmentReviewStatus`, …).                                      |
| `src/lib/admin-queries.ts`                     | Claves `adminKeys`, fábricas `queryOptions`, `centerSaveScope` y `getCachedCenterVersion` para serializar guardados de una ficha.                                                                         |
| `src/lib/admin-labels.ts`                      | Etiquetas y tonos (`StatusTone`) de estados de fichas, catastro, opiniones, multimedia y activo/inactivo.                                                                                                 |
| `src/lib/errors.ts`, `format.ts`, `values.ts`  | `errorMessage`, `formatDate`/`formatDateTime` (es-EC) y utilidades de valores (`isRecord`, `toNullableNumber`, `findCatalogOption`, …).                                                                   |
| `src/lib/center-sections/`                     | Fuente única de los 14 apartados (`definitions.ts`, `sectionTitle`) y de sus opciones cerradas (`options.ts`: respuestas, políticas, conservación, higiene).                                              |
| `src/components/ui/form/`                      | Campos conectados a react-hook-form (`RhfTextField`, `RhfNumberField`, `RhfDateField`, `RhfSelect`, `RhfCatalogSelect`, `RhfResponseSelect`), `EditableContext`, `rules.ts` y `SelectField` para filtros. |
| `src/components/admin/coordinate-fieldset.tsx` | Latitud, longitud y selector en mapa con `latitudeRules`/`longitudeRules`.                                                                                                                                |

## Despliegue en Dokploy

El repositorio incluye un `Dockerfile` standalone para producción. Usa el contexto raíz,
puerto de contenedor `3000` y estos valores de build/runtime:

```text
TURISMO_API_URL=https://api.maps.devs-ueb.tech/api/v1
NEXT_PUBLIC_TURISMO_API_URL=https://api.maps.devs-ueb.tech/api/v1
```

`NEXT_PUBLIC_TURISMO_API_URL` debe estar disponible como argumento de build porque Next.js
lo incorpora al bundle del navegador. `TURISMO_API_URL` también debe quedar como variable
de runtime para las solicitudes realizadas desde el servidor.

## Verificación

```bash
bun run format
bun run lint
bun run typecheck
bun test
bun run build
```
