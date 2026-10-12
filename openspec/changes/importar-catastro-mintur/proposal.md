# Proposal

## Why

El catastro de establecimientos se cargaba uno por uno, aunque el MINTUR publica
el consolidado nacional (unas 50.000 filas en tres hojas: activos, suspendidos e
inactivos, con 91 columnas). La base solo guardaba unos 15 campos y no distinguía
los estados del registro. Además, la ficha de atractivos mostraba como
contradicción una combinación de Promoción que el formato oficial admite.

## What Changes

- Botón «Importar catastro MINTUR» (solo administración) en Establecimientos que
  sube el consolidado, muestra el avance y resume creados, actualizados,
  ubicaciones aproximadas y filas omitidas con su motivo.
- Mostrar en el detalle del establecimiento los datos del catastro: estado del
  registro, fecha, correo, web, segundo teléfono y capacidades.
- Retirar el aviso de contradicción entre plan municipal e inclusión en el plan.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `tourism-records`: importación masiva del catastro nacional.
- `mintur-import`: sin aviso por plan inexistente e inclusión en el plan.

## Impact

Requiere la migración `20261012_establishment_mintur_registry.sql` y la API con
`POST /admin/establishments/import` en el repositorio hermano antes del panel.
