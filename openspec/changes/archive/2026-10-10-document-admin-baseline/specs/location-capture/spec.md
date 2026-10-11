## Purpose

Capturar coordenadas para fichas y catastros mediante selección manual o una
lectura del dispositivo, con permiso explícito y confirmación del formulario.

## ADDED Requirements

### Requirement: Map selection context

El selector SHALL abrir sobre coordenadas completas y válidas, o sobre Guaranda
cuando falten, estén incompletas o fuera de rango.

#### Scenario: Coordenadas vacías

- **WHEN** se abre el mapa sin un punto válido
- **THEN** se requiere seleccionar un punto antes de confirmarlo

### Requirement: Explicit device location

El selector SHALL solicitar ubicación solo al pulsar su acción, usando una
lectura nueva con precisión reportada de 100 m o menos dentro de 20 segundos.

#### Scenario: Permiso denegado o precisión insuficiente

- **WHEN** no se consigue una lectura válida dentro de las condiciones
- **THEN** se comunica el problema y permanece disponible la selección manual
- **AND** no se sustituye con una geolocalización por IP

### Requirement: Cancelable location request

El selector SHALL detener la solicitud al obtener un punto válido, elegir
manualmente, cerrar el diálogo o cambiar de pestaña.

#### Scenario: Cerrar mientras espera ubicación

- **WHEN** se cierra el diálogo con una solicitud pendiente
- **THEN** se deja de usar esa solicitud para actualizar el selector

### Requirement: Explicit coordinate confirmation

El selector SHALL modificar latitud y longitud del formulario únicamente
cuando se confirma Usar esta ubicación.

#### Scenario: Cancelar selección

- **WHEN** se cancela el selector después de mover el punto
- **THEN** el formulario conserva las coordenadas que tenía antes de abrir
