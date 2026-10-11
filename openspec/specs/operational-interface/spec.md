# operational-interface Specification

## Purpose

Ofrecer una interfaz institucional consistente para encontrar registros,
conservar contexto de trabajo y conocer el resultado de cada operación.

## Requirements

### Requirement: Role aware navigation

El portal SHALL presentar destinos según el rol institucional y mantener
el editor como parte del flujo de fichas.

#### Scenario: Navegación de agente turístico

- **WHEN** una cuenta de agente abre el panel
- **THEN** recibe los destinos de centros, catastro y configuración
- **AND** no recibe destinos exclusivos de administrador

### Requirement: Responsive record lists

El portal SHALL conservar tablas desde 600 px y presentar tarjetas de registros
en móviles con sus datos y acciones alcanzables.

#### Scenario: Listado móvil

- **WHEN** se consulta un listado en viewport menor de 600 px
- **THEN** se muestra su presentación de tarjetas
- **AND** conserva búsqueda, filtros y paginación del listado

### Requirement: Supported filters

El portal SHALL aplicar filtros y paginación con el alcance real de la consulta,
sin presentar filtrado de una página como búsqueda del inventario completo.

#### Scenario: Cambiar filtro paginado

- **WHEN** se modifica un criterio de un listado remoto
- **THEN** se reinicia la página y se consulta la API con criterios soportados

### Requirement: Center list context

El portal SHALL conservar búsqueda y página de centros al regresar desde su editor.

#### Scenario: Volver al inventario

- **WHEN** se vuelve del editor al listado de centros durante la sesión
- **THEN** se conservan su búsqueda y página en el estado de navegación

### Requirement: Record action menu

El portal SHALL agrupar las acciones de cada fila en un menú de tres puntos
con labels accesibles y disponibilidad por rol y estado.

#### Scenario: Acción destructiva de una fila

- **WHEN** se selecciona Eliminar desde el menú
- **THEN** se abre la confirmación identificando el registro
- **AND** cerrar el menú no desmonta la confirmación pendiente

### Requirement: Action feedback

El portal SHALL mostrar estado pendiente y resultado de acciones, con errores
de campo o de operación en una superficie que permite recuperación.

#### Scenario: Error de guardado recuperable

- **WHEN** una escritura no se completa
- **THEN** el formulario conserva los valores y comunica el fallo

### Requirement: Theme preference

El portal SHALL iniciar en tema claro y permitir elegir claro u oscuro,
conservando la preferencia explícita de la persona.

#### Scenario: Elegir tema oscuro

- **WHEN** se selecciona oscuro en el control del panel o login
- **THEN** se aplica ese tema y se conserva la preferencia en el navegador

### Requirement: Administrative inspection

El portal SHALL ofrecer al administrador consultas de usuarios y actividad
según el contrato disponible, sin convertirlas en una autorización de cambios.

#### Scenario: Consultar usuarios

- **WHEN** el administrador abre Usuarios
- **THEN** consulta cuentas, roles y estado por el listado disponible
- **AND** esa consulta no implica una mutación de roles o de cuentas

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
