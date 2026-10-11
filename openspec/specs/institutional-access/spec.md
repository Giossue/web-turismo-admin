# institutional-access Specification

## Purpose

Permitir acceso institucional y conservar una identidad coherente al iniciar,
renovar o cerrar sesión, incluso con respuestas tardías o errores de red.

## Requirements

### Requirement: Institutional entry

El portal SHALL redirigir la entrada principal a `/admin` y mostrar login,
carga de sesión, acceso denegado o panel según el estado de identidad.

#### Scenario: Entrada sin sesión

- **WHEN** una persona abre la web sin sesión válida
- **THEN** se presenta el login institucional en `/admin`

#### Scenario: Rol no institucional

- **WHEN** la API devuelve una cuenta sin rol de administrador ni agente turístico
- **THEN** el portal no presenta las herramientas institucionales

### Requirement: Session credential storage

El portal SHALL conservar el access token y la identidad activa en memoria,
sin persistir tokens, contraseñas ni perfil en almacenamiento del navegador.

#### Scenario: Sesión reconstruida

- **WHEN** se renueva una sesión permitida por la API
- **THEN** el token se utiliza desde memoria
- **AND** el refresh permanece bajo gestión de la cookie de la API

### Requirement: Identity boundary

El portal SHALL descartar resultados de una identidad anterior y retirar
datos privados cuando cambia la cuenta, los permisos o la vigencia de sesión.

#### Scenario: Respuesta después de cambiar cuenta

- **WHEN** una consulta anterior termina después de cambiar la identidad
- **THEN** su resultado no se devuelve como dato de la cuenta actual

#### Scenario: Renovación después del cierre

- **WHEN** una renovación pendiente termina después de cerrar sesión
- **THEN** no restaura la identidad que se cerró

### Requirement: Pending logout

El portal SHALL retirar acceso local al solicitar cierre y mantener bloqueados
login y renovación si la API todavía no confirma la revocación.

#### Scenario: Error al revocar

- **WHEN** falla la petición de cierre
- **THEN** se muestra el fallo con una acción de reintento
- **AND** el panel privado y la restauración permanecen bloqueados

#### Scenario: Recarga con cierre pendiente

- **WHEN** se recarga la web con un cierre pendiente persistido
- **THEN** se intenta confirmar el cierre antes de permitir reconstruir sesión

### Requirement: Logout propagation

El portal SHALL comunicar el estado de cierre a las otras pestañas y retirar
su acceso local cuando reciben el cambio.

#### Scenario: Cierre desde otra pestaña

- **WHEN** una pestaña recibe el aviso válido de cierre de la misma web
- **THEN** descarta su identidad y datos privados anteriores

### Requirement: Explicit access after unavailable storage

El portal SHALL exigir login explícito después de recargar cuando no puede
persistir de forma confiable el estado de sesión.

#### Scenario: Almacenamiento del navegador bloqueado

- **WHEN** el almacenamiento no está disponible y se recarga la página
- **THEN** no se restaura automáticamente un cierre que pudo quedar pendiente
