# Proposal

## Why

La ficha MINTUR no contiene un campo de zona turística. El editor muestra una
relación interna y una opción «Entorno de Guaranda» procedente de contenido de
demostración, sin una decisión institucional que la persona deba tomar.

## What Changes

- Retirar la zona del formulario, su resumen y la comparación de la ficha.
- Mantener compatibilidad con referencias existentes, sin asignar automáticamente
  una zona de demostración ni eliminar datos guardados.
- Coordinar con la API la inclusión offline por ubicación y cobertura de ciudad.

## Capabilities

### New Capabilities

- `institutional-location`: captura territorial sin relaciones internas de zona.

### Modified Capabilities

Ninguna.

## Impact

Editor MUI y sus campos de validación. La API se adapta en el repositorio hermano.
No se modifica el contrato de publicación, las respuestas del Excel ni el esquema.
El usuario autoriza implementación, commit y push de este cambio. La entrega no
incluye despliegue ni ejecución de suites.
