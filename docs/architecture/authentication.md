# Autenticación institucional

## Autoridad y almacenamiento

La identidad se obtiene de la API con `/auth/login`, `/auth/refresh`,
`/auth/logout` y `/auth/me` según la operación. El access token se conserva
en memoria. La API gestiona la cookie de refresh HttpOnly, sus atributos de
producción, rotación y revocación. El portal no implementa hashing ni tablas
de sesión.

`AdminSession` es el controlador del estado del cliente, no un proveedor de
autenticación. `auth.tsx` lo integra en React y `auth-browser.ts` comunica
estado entre pestañas. Los roles conocidos son `ADMINISTRADOR`,
`AGENTE_TURISTICO` y `TURISTA`; solo los dos primeros tienen acceso institucional.

## Invariantes del cliente

- Login, cierre y cambio de identidad invalidan respuestas pendientes.
- Cambio de permisos o pérdida de sesión vacían la caché privada.
- El cliente administrativo compara generación y controlador antes de devolver
  una respuesta o reintentar tras un 401.
- El cierre retira inmediatamente identidad y token locales.
- Si la API no confirma el cierre, permanece `logout-pending`: se muestra el error
  y se bloquean renovación y login hasta confirmar la revocación.
- Se reintenta el cierre al recargar, recuperar conexión o pulsar la acción.
- BroadcastChannel, almacenamiento como alternativa y Web Locks disponibles
  coordinan pestañas. No relajar el cierre en navegadores sin estas APIs.

`localStorage` conserva estado de sesión, preferencias visuales y fechas de
lectura de avisos por cuenta. No conserva tokens, contraseña ni perfil. Si no
puede persistir el estado, una recarga exige login explícito.

## Frontera del backend

Permisos y propiedad se validan en cada endpoint de la API. El endpoint local
de importación consulta identidad actual y no acepta roles enviados por el
navegador. CORS, cookies y revocación remota se verifican en el entorno que se
vaya a operar; no se deducen de una prueba simulada.

Referencia normativa: [acceso](../security/access-control.md).
Detalle implementado: [controles actuales](../security/controles.md).
Evidencia existente: `tests/admin-session.test.ts`,
`tests/admin-deletion-api.test.ts` y `e2e/security.pw.ts`.
