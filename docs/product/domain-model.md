# Dominio del portal

| Concepto             | Propósito y relaciones                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| Cuenta institucional | Identidad y roles emitidos por la API; no se crean sesiones locales independientes             |
| Centro turístico     | Ficha identificada por su código, clasificación, territorio, coordenadas y contenido editorial |
| Apartado de ficha    | Una de las 14 secciones de `src/lib/center-sections/definitions.ts`                            |
| Propuesta o borrador | Cambios guardados para validar y enviar a revisión; pueden coexistir con la versión publicada  |
| Catastro             | Establecimiento relacionado con localidad, actividad, tipo y categoría                         |
| Catálogo             | Opción autorizada de clasificación, accesibilidad, actividad o facilidad                       |
| Opinión              | Contenido y versiones sobre un centro o punto de interés, con estado de moderación             |
| Multimedia           | Fotografías u otros medios asociados, cuya persistencia y autorización corresponden a la API   |
| Actividad            | Resumen de cambios y decisiones devuelto por la API para consulta administrativa               |

## Estados y reglas

- Fichas: `BORRADOR`, `EN_REVISION`, `PUBLICADO`. Devolver para corregir
  conduce a Borrador y conserva el motivo.
- Catastro: incluye además `RECHAZADO`; no reutilizar automáticamente los estados
  de una ficha para ese flujo.
- Opiniones: `PENDIENTE`, `APROBADA`, `RECHAZADA`, `REEMPLAZADA`.
- Apartados: sin iniciar, incompleto, completo, con errores o no aplica. Su
  evaluación proviene de la API.
- Una propuesta de edición no reemplaza la versión pública hasta su aprobación.
- La eliminación administrativa es lógica y conserva historial y relaciones;
  difiere de la desactivación y no ofrece restauración desde el panel actual.
- Un tipo de establecimiento con categorías no se elimina antes que sus categorías.
- Un catálogo retirado puede conservarse en referencias existentes, sin permitir
  nuevas asignaciones.

## Valores y contratos

La interfaz muestra etiquetas de dominio; las peticiones pueden transportar IDs.
Las coordenadas se validan por rango y se confirman antes de incorporarse al formulario.
La versión enviada al guardar permite detectar conflictos; el cliente serializa
los guardados de cada ficha.

No existe un contrato de tenant en este portal. La API resuelve el alcance real
de usuario, rol y registro. No inventar eventos, tablas o invariantes a partir
de los ejemplos genéricos de CognitiveStack.

Referencias: [cliente administrativo](../../src/lib/admin-api.ts),
[apartados](../../src/lib/center-sections/definitions.ts) y
[comportamiento](../../openspec/specs/).
