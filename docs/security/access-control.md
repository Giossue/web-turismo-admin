# Acceso por identidad, acción y registro

## Frontera real

La API NestJS valida quién actúa, qué puede hacer y sobre qué registro. La web
presenta destinos y acciones según los roles de la sesión. Los gates del cliente,
IDs difíciles de adivinar y `robots.txt` no son controles de autorización.

| Pregunta                               | Autoridad                                   |
| -------------------------------------- | ------------------------------------------- |
| ¿Quién es la cuenta?                   | Sesión validada por la API                  |
| ¿Qué rol tiene ahora?                  | Contexto institucional resuelto en servidor |
| ¿Puede hacer esta acción?              | Política de la API para la operación        |
| ¿Puede operar este registro o archivo? | Consulta/política autorizada en la API      |

En la importación local, la web consulta `/auth/me` antes de cargar el archivo y
exige identidad activa con rol institucional. No decodificar roles sin verificar
el token ni aceptar identidad desde body o query como autorización.

## Escalada y campos

Todo identificador recibido se considera no confiable, incluidos los de relaciones.
Las escrituras usan campos explícitos del contrato. Cambiar un rol, propietario
o estado editorial requiere su operación autorizada; no permitir que viaje como
un atributo adicional en un guardado genérico.

La web no tiene un contrato de tenants. Aplicar alcance de rol, usuario y registro
según la API, sin inventar `tenantId`. Si se incorporan organizaciones, diseñar
aislamiento de consultas, referencias, archivos y claves de repetición en el backend.

## Respuestas y archivos

No revelar contenido de otro usuario ni existencia de recursos privados por
errores detallados. Una política de 404 para recursos fuera de alcance debe
acordarse y verificarse en la API; no cambiar códigos externos unilateralmente.
Descargas y URLs firmadas requieren autorización remota y expiración definida.

## Caché y sesión

Vaciar datos privados y cancelar/descartar respuestas al cerrar, cambiar cuenta,
cambiar permisos o perder acceso. Ninguna solicitud pendiente puede alimentar
la identidad siguiente. El estado local `active` no concede un permiso ni
demuestra vigencia de la cookie.

En revisión, considerar roles insuficientes, IDs ajenos, referencias cruzadas,
campos privilegiados y respuesta tardía. Comprobar la API real cuando se solicita
una verificación remota; los mocks web solo evidencian el manejo del cliente.
