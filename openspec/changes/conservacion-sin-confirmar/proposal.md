# Proposal

## Why

La ficha de Plaza 15 de Mayo marca el atractivo como Alterado, deja sin seleccionar
el estado del entorno y registra factores en ambos componentes. La importación
conserva correctamente esa ausencia, pero la publicación exige inventar el estado.

## What Changes

- Mostrar el estado vacío como Sin confirmar en Conservación.
- Explicar que se pueden conservar factores y publicar con un estado desconocido.
- Coordinar con la API la persistencia nullable del estado y su lectura posterior.
- Mantener las casillas y el puntaje del archivo, sin inferir estados de los factores.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `mintur-import`: conservar estados de conservación sin confirmar junto con sus factores.

## Impact

Interfaz existente de Conservación y documentación. Requiere la migración y API
compatible del repositorio hermano. La sesión autoriza aplicar la migración
remota y hacer commit/push en ambos repositorios; la última instrucción del usuario
excluye respaldos. No incluye despliegue manual ni aprobación de la ficha.
