# Spec Delta

## ADDED Requirements

### Requirement: Fresh administrative lists

El portal SHALL aplicar una política compartida de frescura a los listados de centros, catastro, revisión, opiniones, usuarios y actividad y a su resumen; consultar datos antiguos al recuperar foco o conexión y permitir actualizar explícitamente esos listados sin perder filtros ni página.

#### Scenario: Regresar al portal con datos antiguos

- **WHEN** una persona vuelve a la pestaña de un listado con datos antiguos
- **THEN** el portal consulta su versión vigente con los mismos filtros y página

#### Scenario: Actualizar un listado

- **WHEN** la persona activa Actualizar
- **THEN** el portal consulta de nuevo el listado e indica que se está actualizando
- **AND** conserva búsqueda, filtros y página

#### Scenario: Catastro en distintas superficies

- **WHEN** el mismo listado de catastros se consulta desde gestión o revisión
- **THEN** ambas superficies aplican la política compartida de frescura

#### Scenario: Edición local al regresar

- **WHEN** la persona vuelve a la pestaña mientras edita una ficha
- **THEN** la actualización de listados no descarta ni reemplaza sus cambios locales

### Requirement: Visible list transitions

El portal SHALL identificar la actualización de filtros y páginas conservando las filas previas y bloquear sus acciones mientras los resultados pertenecen a la consulta anterior, tanto en tabla como en tarjetas.

#### Scenario: Cambio de filtro con respuesta pendiente

- **WHEN** cambia un filtro y la nueva respuesta todavía no llega
- **THEN** se comunica la actualización y se conservan las filas anteriores
- **AND** sus acciones no pueden iniciarse hasta recibir los nuevos resultados

#### Scenario: Cambio de página en móvil

- **WHEN** la persona solicita otra página desde las tarjetas
- **THEN** las tarjetas anteriores indican actualización y bloquean sus acciones
- **AND** el total anterior se conserva durante la transición

### Requirement: Cancelled administrative reads

El portal SHALL cancelar el transporte de lecturas que se cancelan o quedan sin consumidores, conservando la exclusión de caché HTTP privada y el descarte de respuestas de otra sesión.

#### Scenario: Consulta reemplazada por otro filtro

- **WHEN** una lectura pendiente queda sin consumidores al cambiar filtros
- **THEN** se interrumpe su transporte y sus resultados no reemplazan la consulta actual

#### Scenario: Cierre durante una consulta

- **WHEN** se cierra sesión mientras hay lecturas pendientes
- **THEN** se vacían los datos privados y se cancelan esas lecturas
- **AND** una respuesta anterior no reconstruye el acceso ni sus datos

#### Scenario: Lectura rechazada por permisos

- **WHEN** la API rechaza la lectura por permisos o alcance del registro
- **THEN** el portal conserva el rechazo y no ofrece datos de una consulta anterior como respuesta autorizada
