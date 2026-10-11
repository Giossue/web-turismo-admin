# Proposal

## Why

La guía anterior declara pendientes apartados que el editor ya importa y guarda.
Completar la base documental evita confundir el endpoint de análisis con la
persistencia posterior que realiza el cliente, especialmente en fichas existentes.

## What Changes

- Actualizar la guía MINTUR, el glosario y las fronteras de producto y formularios.
- Documentar el comportamiento existente de guardado de apartados y carga de fotos.
- Registrar las limitaciones actuales de errores y concurrencia a partir del código.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `mintur-import`: completar la documentación del comportamiento ya implementado
  en el editor, sin introducir funciones o escrituras nuevas.

## Impact

Documentación y specs. La evidencia está en `mapear-secciones.ts`,
`use-ficha-import.ts` y `center-editor.tsx`. No se modifica su implementación.
