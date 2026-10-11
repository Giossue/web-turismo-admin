# Design

## Context

La base inicial describe correctamente que el endpoint de importación no escribe.
El editor, en cambio, guarda los apartados pendientes y sube fotos cuando tiene
código. La guía antigua confundía esa persistencia con trabajo pendiente.

## Goals / Non-Goals

Documentar el estado existente y corregir las fuentes que lo contradicen.
El alcance es knowledge de `web-turismo-admin`; no cambia el flujo del producto.

## Decisions

- Separar en el texto los datos devueltos por el endpoint y las escrituras del editor.
- Explicar la diferencia entre una ficha nueva sin código y una existente.
- Nombrar los nueve apartados mapeados y el contrato actual de fotos y errores.
- Limitar la omisión de apartados existentes al detalle consultado por el cliente.
  La relectura y el reintento de un 409 no demuestran protección atómica en la API.

## Risks / Trade-offs

Las escrituras descritas proceden del código, no de una comprobación contra
producción. No se certifica la autorización ni la concurrencia de la API real.

## Evidence

Se leyó el endpoint, el mapper y el hook completos, y el efecto del editor que
desencadena las escrituras. La validación es documental y de OpenSpec; no se
ejecutan tests de producto ni se importan archivos contra una API real.
