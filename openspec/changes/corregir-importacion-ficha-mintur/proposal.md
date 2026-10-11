# Proposal

## Why

La importación de «Plaza 15 de mayo.xlsm» muestra un límite agregado de fotografías
que no corresponde a la regla del producto, confunde el puntaje del archivo con
una advertencia y busca como tipo independiente un conteo general de guías
especializados cuyo desglose ya está informado. La publicación falla con un mensaje
genérico cuando falta una respuesta en Promoción.

## What Changes

- Mantener 5 MiB por fotografía, sin un límite adicional de bytes para su suma.
- Identificar tamaño y acción cuando una fotografía excede ese límite.
- Mostrar el puntaje del Excel como referencia informativa con su máximo.
- Conservar el conteo general de guías en observaciones y evitar duplicarlo como
  tipo cuando coincide con el desglose de cultura y aventura; avisar de discrepancias.
- Avisar de respuestas ausentes/ambiguas y contradicciones de Promoción durante
  la importación, sin inventar Sí/No ni corregir el archivo automáticamente.
- Mantener el error de publicación dentro del diálogo, con campos, apartado y
  acceso a revisar la ficha; traducir los mensajes genéricos de la API vigente.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `mintur-import`: límites individuales, referencia de valoración y revisión de
  guías y promoción.
- `review-and-moderation`: diagnóstico recuperable de publicación incompleta.

## Impact

Solo el portal Next/MUI y su endpoint interno de importación. Respuesta compatible
con un campo opcional `resumenValoracion`; la API NestJS sigue calculando valoración,
autorizando guardado y publicación. No se cambian catálogos, esquema, datos guardados
ni estados de producción. Se conservan cantidad máxima de fotos, límites del Excel,
descompresión, aislamiento del worker, sesión y protección de respuestas tardías.

El usuario autorizó corregir el flujo y proporcionó el archivo para leerlo y
comprobar sus valores. No se solicitó publicar esa ficha, desplegar ni ejecutar suites.
