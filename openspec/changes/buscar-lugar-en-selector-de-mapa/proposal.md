# Proposal

## Why

Quien registra un catastro o una ficha abre el mapa en Guaranda y debe
desplazarse a mano hasta el lugar. La API ya ofrece una búsqueda geográfica de
Ecuador que el panel no aprovecha.

## What Changes

- Añadir al selector de coordenadas un buscador de lugares que consulta
  `GET /search?kind=geographic` de la API.
- Elegir un resultado centra el mapa y coloca el punto; el operador ajusta y confirma.

## Capabilities

### Modified Capabilities

- `location-capture`: búsqueda de lugar dentro del selector de coordenadas.

## Impact

`coordinate-picker-dialog.tsx` y un cliente de búsqueda nuevo. No cambia la API,
el esquema ni el contrato de guardado: solo latitud y longitud siguen confirmándose;
la dirección inferida no se guarda.
