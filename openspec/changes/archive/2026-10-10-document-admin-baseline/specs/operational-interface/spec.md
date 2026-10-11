## Purpose

Ofrecer una interfaz institucional consistente para encontrar registros,
conservar contexto de trabajo y conocer el resultado de cada operación.

## ADDED Requirements

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
