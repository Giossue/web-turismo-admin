# Design

## Brief

Agente turístico que registra un catastro o ficha. Objetivo: ubicar el punto sin
recorrer el mapa a mano. Acción principal: escribir un lugar, elegirlo y confirmar.

## Decisiones

- Campo de búsqueda sobre el mapa, con consulta desde dos caracteres y espera de
  400 ms. Las respuestas anteriores se cancelan.
- Se piden solo resultados `geographic` (calles, ciudades y referencias de Ecuador).
- Elegir un resultado mueve el mapa y el marcador; no confirma ni guarda nada.
- Un fallo o la ausencia de resultados se informa sin impedir la selección manual.
- No se guarda dirección ni se rellenan provincia, cantón o localidad.
