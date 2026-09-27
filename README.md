# web-turismo-admin

Landing institucional y futuro panel administrativo de Turismo Vinculación. La app móvil
es el único cliente para turistas; este repositorio no contiene una versión web turística.

## Arranque local

Para abrir la app Android y el admin al mismo tiempo en Kitty desde este repositorio:

```bash
./iniciar-turismo-admin-local.sh
```

El lanzador abre tres pestañas: API y admin, Metro y Android. Usa `scripts/dev-local.sh`
del monorepo vecino para iniciar PostgreSQL/PostGIS local, aplicar migraciones y datos de
demostración, y arrancar la API y esta web. La pestaña Android espera un dispositivo USB
autorizado, configura `adb reverse`, compila la variante de desarrollo y la abre sin
reemplazar la app publicada. Si el proyecto Android generado corresponde a otra variante,
lo regenera para desarrollo y comprueba los plugins de Gradle antes de compilar. Necesitas Android SDK, JDK 17 y
`apps/mobile/.env` en el monorepo. Usa `TURISMO_MONOREPO_DIR` si está en otra ruta.
Comprueba los requisitos sin arrancar nada con `./iniciar-turismo-admin-local.sh --check`.

La app móvil instalada localmente usa `EXPO_PUBLIC_API_URL` de
`apps/mobile/.env`. Si apunta a la API remota, la app trabaja con los datos de
producción mediante esa API; nunca se conecta directamente a PostgreSQL. El admin
del lanzador sigue usando la API y la base locales. Para cambiar solo la API móvil
en una ejecución, define `TURISMO_MOBILE_API_URL`.

Si la API ya está disponible y solo necesitas esta web, usa
`./iniciar-turismo-admin-local.sh --web-only`. Este modo respeta las variables de entorno
de Next.js; por defecto, la API se espera en `http://localhost:3000/api/v1`. Cierra la
ventana de Kitty para detener la sesión completa; Ctrl+C detiene solo la pestaña activa.

El mismo entorno también se puede arrancar desde el monorepo principal:

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

| Módulo                                                       | Propósito                                                                                                                                                                                                               |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/config.ts`                                          | URL de la API: `getApiUrl()` (servidor `TURISMO_API_URL`, navegador `NEXT_PUBLIC_TURISMO_API_URL`) y `publicApiUrl` para enlaces renderizados.                                                                          |
| `src/lib/http.ts`                                            | `fetch` común (sin `Content-Type` en GET, errores de red en español), `ApiError` con `status` y `toQueryString`.                                                                                                        |
| `src/lib/admin-api.ts`                                       | Único cliente de la API administrativa (token, renovación ante 401, `importFichaFile`) y tipos compartidos (`Page`, `ReviewAction`, `EstablishmentReviewStatus`, …).                                                    |
| `src/lib/admin-queries.ts`                                   | Claves `adminKeys`, fábricas `queryOptions`, `centerSaveScope` y `getCachedCenterVersion` para serializar guardados de una ficha.                                                                                       |
| `src/lib/admin-labels.ts`                                    | Etiquetas y tonos (`StatusTone`) de estados de fichas, catastro, opiniones, multimedia y activo/inactivo.                                                                                                               |
| `src/lib/errors.ts`, `format.ts`, `values.ts`                | `errorMessage`, `formatDate`/`formatDateTime` (es-EC) y utilidades de valores (`isRecord`, `toNullableNumber`, `findCatalogOption`, …).                                                                                 |
| `src/lib/center-sections/`                                   | Fuente única de los 14 apartados (`definitions.ts`), sus opciones cerradas (`options.ts`), tipos y valores vacíos del formulario, lectores (`readers.ts`) y escritura (`to-section-content.ts`) del contenido guardado. |
| `src/lib/center-form.ts`, `center-form-mappers.ts`           | Valores del formulario principal de la ficha (`CenterFormValues`, campos por paso) y conversiones con la API (`toFormValues`, `toPayload`, opciones dependientes de catálogos).                                         |
| `src/components/ui/form/`                                    | Campos conectados a react-hook-form (`RhfTextField`, `RhfNumberField`, `RhfDateField`, `RhfSelect`, `RhfCatalogSelect`, `RhfResponseSelect`), `EditableContext`, `rules.ts` y `SelectField` para filtros.               |
| `src/components/admin/coordinate-fieldset.tsx`               | Latitud, longitud (con validación de rango) y selector en mapa.                                                                                                                                                         |
| `src/components/admin/center-sections/shared/`               | Bloques de los apartados de la ficha: `RepeatableFieldArray`, `CatalogOrFreeText`, `FieldGroup`, `RemoveRowButton`, `MonthMultiSelect`.                                                                                 |
| `src/components/admin/admin-feedback.tsx`                    | `AdminFeedbackProvider`/`useAdminFeedback` para avisos y errores globales del panel.                                                                                                                                    |
| `src/components/admin/review-decision-dialog.tsx`            | Diálogo común de aprobar/rechazar fichas, catastro y opiniones.                                                                                                                                                         |
| `src/components/ui/detail-list.tsx`, `color-mode-button.tsx` | Lista etiqueta/valor y alternador de tema claro/oscuro.                                                                                                                                                                 |

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
