# Modelo de amenazas del portal

## Activos y fronteras

Identidad institucional, token en memoria, cookie de refresh gestionada por la
API, datos privados del panel, borradores, propuestas y archivos de importación.
Fronteras: navegador/API, navegador/Next.js, archivo/parser/worker y build/runtime.
Bases, proveedores y colas se evalúan en su repositorio responsable.

| Amenaza                              | Consecuencia                             | Control o responsabilidad                                  |
| ------------------------------------ | ---------------------------------------- | ---------------------------------------------------------- |
| Manipular rol o ID                   | Lectura/escritura no autorizada          | Política por acción y registro en la API                   |
| Payload con campos privilegiados     | Escalada o cambio de estado              | Campos explícitos y validación remota                      |
| Respuesta tardía tras cambiar cuenta | Datos cruzados en caché                  | Generación de sesión y vaciado de datos privados           |
| Refresh tras cerrar                  | Sesión restaurada contra la intención    | Invalidez de generación y cierre pendiente persistido      |
| Revocación fallida                   | Cookie aún activa en servidor            | Bloqueo local, aviso y reintento; revocación en API        |
| Archivo comprimido malicioso         | Consumo de CPU/memoria                   | Límites de bytes reales, XML y worker                      |
| Cargas repetidas o lentas            | Capacidad agotada                        | Cupos, cuotas y plazos locales; límite global en proxy/API |
| Script inyectado o frame externo     | Abuso de sesión y engaño                 | CSP con nonce, escape de texto y denegación de frames      |
| `.env*` incorporado al build         | Fuga de configuración privada            | Dockerignore y limpieza standalone                         |
| Imagen de contenedor privilegiada    | Mayor impacto de un compromiso           | Usuario node y recursos restringidos por operación         |
| Repetición de una escritura          | Duplicación o conflicto                  | Bloqueo local y versión; garantía de efectos en API        |
| Dependencia vulnerable               | Compromiso o denegación de servicio      | Lockfile, upgrades revisados y parche de braces            |
| Configuración de mapas nueva         | Salida a un origen no previsto           | Revisión de URL y CSP                                      |
| Knowledge contradictorio             | Agente elimina un control o cambia stack | Procedencia, ADR, fuentes únicas y revisión                |

## Límites conocidos

No se audita aquí el estado actual de la API remota ni del proxy de producción.
Las cuotas de Excel son por proceso. El heap del worker no incluye todos los
buffers nativos. La geolocalización no certifica el origen GPS. El control de
versión local no demuestra una transacción remota.

Los detalles y límites exactos están en [controles.md](controles.md).
Actualizar este modelo cuando cambien fronteras o capacidades, con evidencia
y escenarios de rechazo proporcionales al cambio.
