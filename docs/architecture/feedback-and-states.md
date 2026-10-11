# Feedback y estados

El sistema actual usa `AdminFeedbackProvider` y `useAdminFeedback` con un
Snackbar MUI de éxito/error. Los flujos conservan pendiente e invalidación con
TanStack Query. No hay un wrapper universal que ya gestione todas las mutaciones.

| Situación                    | Superficie                                              |
| ---------------------------- | ------------------------------------------------------- |
| Guardado o cambio completado | Aviso global transitorio con lenguaje de dominio        |
| Campo corregible             | Error asociado al campo                                 |
| Carga de módulo o listado    | Indicador circular común dentro de su superficie        |
| Actualización de un listado  | Indicador compacto y estado accesible conservando filas |
| Petición iniciada por botón  | Estado pendiente compacto y bloqueo de repetición       |
| Fallo de consulta            | Estado contextual con recuperación segura               |
| Cuenta o servicio bloqueado  | Aviso persistente mientras exista la condición          |
| Eliminación o revisión       | Diálogo propio con consecuencia y error recuperable     |

No dejar banners de éxito rutinarios ni convertir una carga inicial pasiva en
un aviso de éxito. Un toast no reemplaza el error de campo ni el bloqueo de sesión.

## Resultados de acciones

Cada acción debe resolver pendiente, éxito y error. Tras éxito, actualizar o
invalidar la consulta afectada; cerrar y limpiar la superficie transitoria cuando
corresponda. Tras error, preservar trabajo y ofrecer un reintento solo si es seguro.
Un timeout de una escritura puede tener resultado desconocido en la API.

La carga inicial y la actualización en segundo plano son estados distintos.
Las transiciones de filtros/páginas y el bloqueo de acciones se describen en
[tablas](data-tables.md#estados-y-accesibilidad). Tras un conflicto de ficha, una
lectura vigente fallida comunica el fallo y conserva los valores locales; solo
una lectura completada permite adoptar el detalle del servidor.

Errores desconocidos usan un mensaje seguro. No renderizar stack traces,
payloads de proveedor, rutas de almacenamiento ni credenciales. Los helpers
de error y labels están en `src/lib/errors.ts` y `admin-labels.ts`.

## Sesión y respuestas tardías

Al cerrar o cambiar identidad, vaciar datos privados y descartar respuestas de
la generación anterior. Un `logout-pending` explica el bloqueo y ofrece reintentar;
no mostrar el panel mientras se espera una revocación.

## Trabajo largo

El análisis de Excel es una petición acotada y cancelable, con worker local.
Cerrar o abortar puede detenerlo. Un futuro importador persistente necesita
job, progreso y cancelación explícita en la API. No simular persistencia con un
spinner o una marca en almacenamiento local.
