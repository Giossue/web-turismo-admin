# web-turismo-admin

Portal administrativo de Turismo Vinculación con acceso directo al login. La app móvil
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

Abre `http://localhost:3002`: la ruta principal redirige a `/admin` y muestra el login
institucional. Si ya tienes una sesión válida, se abre directamente el panel. Inicia sesión
con una cuenta institucional creada en la API. El portal queda excluido del rastreo de
buscadores. El navegador solo recibe un access token en memoria y mantiene el refresh token en
una cookie HttpOnly. Al recargar, el panel llama a `/auth/refresh` para reconstruir la
sesión sin usar `localStorage`.
El diseño adapta las plantillas oficiales de MUI
[Sign-in](https://mui.com/material-ui/getting-started/templates/sign-in/) para el login y
[Dashboard](https://mui.com/material-ui/getting-started/templates/dashboard/) para el panel,
con tipografía Inter, la paleta verde original, superficies con bordes y botones de alto contraste.
El portal usa los `colorSchemes` de MUI, abre en tema claro por defecto y permite alternar
entre claro y oscuro tanto en el login como en el popover del perfil, al pulsar la cuenta
en el pie del menú lateral. Ese popover también contiene Configuración y Cerrar sesión.
El panel no tiene barra superior; en móvil, el botón junto al
título abre la navegación. La preferencia visual se conserva en el navegador. La fuente y
los estilos se sirven desde la propia web.
La atribución del código adaptado está en
[`docs/third-party-notices/mui-templates.md`](docs/third-party-notices/mui-templates.md).

### Filtros del panel

Centros turísticos, Catastro, Catálogos, Opiniones y las colas de revisión de fichas y
catastros usan el componente compartido `AdminDataGrid`, basado en MUI X DataGrid Community
v8 y compatible con MUI v7. Comparten el estilo de encabezados, filas, acciones y paginación,
con controles en español. Cada fila presenta un único botón de tres puntos sin borde en
**Acciones**, que abre un menú con las opciones disponibles según el rol y estado.
Las opciones incluyen etiquetas accesibles y siguen el foco del grid al usar el teclado;
**Eliminar** abre la confirmación existente antes de enviar la solicitud.

La sesión, el resumen, las tablas, las fichas y los diálogos usan el mismo indicador
circular de carga. Los listados mantienen ese estilo con y sin filas; los botones usan
su versión compacta, con el color del texto para conservar el contraste.

Centros y Catastro conservan el buscador y agrupan los criterios detrás de **Filtros**,
con un contador de criterios activos. Los catálogos básicos buscan localmente entre las
opciones cargadas; **Tipos y categorías** ofrece únicamente el selector **Actividad**.
El número de categorías se muestra en la tabla y **Ver categorías** se abre desde el menú
de acciones del tipo. Las categorías también agrupan Editar y Eliminar en tres puntos.
Los listados de la API conservan su paginación y los controles admitidos por cada consulta.

Centros muestra una columna y un selector de **Estado de la ficha**. La búsqueda,
el estado y la página se conservan en la URL. Catastro agrupa los siete criterios
admitidos por la API en campos
con nombres de uso diario: ubicación, tipo de establecimiento y estado. Ambos paneles
incluyen Limpiar filtros y Ver resultados. Cambiar un criterio reinicia la
página y conserva las dependencias entre ubicación, actividad, tipo de establecimiento y categoría.
Los filtros y la paginación se ejecutan en la API; el grid no filtra únicamente las filas
de la página actual ni ofrece operadores u ordenaciones que la API no admite.

Las fichas usan tres estados: Borrador, En revisión y Publicado. **Aprobar y publicar**
publica la propuesta en una sola operación; **Devolver para corregir** la devuelve a
Borrador y conserva el motivo. Ambas decisiones retiran la ficha de la cola de revisión.
Si se edita un centro ya publicado, su versión anterior sigue visible en la app hasta
aprobar y publicar los cambios.

El inventario, los filtros, el editor y el resumen de centros muestran únicamente el
estado editorial; no presentan controles ni indicadores de activación.
En Catastro, el interruptor de **Editar** se aplica al pulsar **Guardar** y sigue siendo
exclusivo del administrador; su flujo de revisión conserva el estado Rechazado.

En **Nuevo establecimiento** y **Editar establecimiento**, Localidad permite escribir para
buscar por nombre, cantón o provincia, sin distinguir mayúsculas ni tildes. Las opciones
muestran su cantón y provincia para distinguir nombres repetidos; se debe seleccionar una
opción del catálogo antes de guardar. El catálogo nacional de cabeceras cantonales y
localidades rurales procede del INEC 2026 y se carga en la API mediante la migración
`20261002_seed_national_localities.sql` del monorepo. Las localidades nuevas no reciben
coordenadas aproximadas: la ubicación del establecimiento se captura en su formulario.

Los formularios de fichas y catastros comparten el selector de ubicación en el mapa.
Con coordenadas completas y válidas, abre sobre el punto indicado. Si están vacías,
incompletas o fuera de rango, abre en Guaranda y requiere seleccionar un punto antes
de confirmar. **Usar esta ubicación** actualiza únicamente latitud y longitud en el
formulario; **Cancelar** conserva sus valores anteriores.

Las tablas de Centros turísticos, Catastro, Opiniones y Catálogos ofrecen **Eliminar**
al administrador, con confirmación del registro. La eliminación retira el registro del
panel y de la aplicación, conserva sus relaciones e historial y es distinta de la
desactivación reversible. Eliminar una opinión retira todas sus versiones y su aportación
a las calificaciones. Un tipo de establecimiento con categorías debe eliminar sus
categorías primero. Requiere la migración `20261002_admin_logical_deletion.sql` y la API
actualizada del monorepo, desplegadas antes de esta web.

Las fichas que ya usan un catálogo retirado lo muestran como «ya no disponible» y pueden
conservarlo al editar otros campos; no se ofrece para nuevas asignaciones.

La edición Community tiene licencia MIT y admite un criterio en su modelo nativo;
el filtrado combinado nativo pertenece a Pro. Los filtros combinados de Catastro usan
el estado de dominio y las consultas existentes de la API, con un panel personalizado.
Referencia: [filtrado de MUI X v8](https://v8.mui.com/x/react-data-grid/filtering/).

### Catálogos de tipos y categorías

La pestaña **Tipos y categorías** muestra una tabla de tipos de establecimiento con el
filtro opcional **Actividad** y la acción **Agregar tipo**. Al consultar todas las actividades,
cada tipo muestra su actividad como texto secundario. Se señalan sólo los registros inactivos;
la paginación aparece cuando hay más de 20 tipos.

**Ver (n)** abre las categorías del tipo en un diálogo. Allí se pueden editar, eliminar o
**Agregar categoría**; el título del editor identifica el tipo padre y conserva esa relación
fija. Gestionar categorías mantiene el filtro y la página del listado principal. Un tipo
inactivo debe activarse desde **Editar** antes de agregar nuevas categorías.

La relación es actividad de catastro → tipo de establecimiento → categorías del tipo,
por ejemplo, Alojamiento → Hotel → 3 Estrellas. El tipo define el servicio y su pin; la
categoría conserva el sistema registrado, como estrellas, tenedores, tazas o categoría única.

La pestaña **Actividades de fichas** administra las actividades de centros y atractivos
turísticos. Es un catálogo distinto de las actividades de catastro, como Alojamiento o
Alimentos, bebidas y entretenimiento.

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
