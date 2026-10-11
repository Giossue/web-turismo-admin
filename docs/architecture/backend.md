# Next.js y contrato con la API

## Responsabilidades

La API NestJS es externa al portal. Resuelve autenticación, autorización por rol
y registro, persistencia, revisión editorial y auditoría. Los DTOs que consume
la web están en `src/lib/admin-api.ts`; no imponer un envelope nuevo porque lo
use la plantilla.

El servidor Next.js renderiza páginas y atiende
`POST /api/admin/ficha/import`. Ese endpoint prepara información para el editor:
autentica mediante `/auth/me`, obtiene catálogos autorizados, valida el cuerpo
y ejecuta el parser aislado. No guarda registros turísticos.

## Brief de operación sensible

Antes de añadir o modificar una operación, registrar en su diseño:

1. Usuario y rol que pueden ejecutarla.
2. Registro afectado y alcance que la API valida.
3. Identificadores y campos no confiables, y dónde se validan.
4. Qué ocurre con una petición repetida o con dos concurrentes.
5. Control de versión, idempotencia o transición necesario.
6. Persistencia, restricciones y auditoría que corresponden a la API.
7. Posibles fugas en respuesta, caché, logs y archivos.
8. Escenarios de rechazo y evidencia necesaria para comprobarlos.

El alcance se deriva del contexto autenticado. Este proyecto no tiene tenants;
si el contrato los incorpora, documentar su resolución y aislamiento antes de usarlos.

## Límites de implementación

- Validar ruta, consulta, cuerpo, tipo, rango, longitud y tamaño en la frontera
  que los recibe. Un tipo TypeScript no valida bytes externos.
- Construir payloads con campos explícitos; nunca convertir la respuesta completa
  de un proveedor o el estado del formulario en una escritura sin contrato.
- Autorizar en la API cada registro y referencia; un código conocido no basta.
- Usar el transporte común, plazos y cancelación. Normalizar errores para la UI.
- Respetar la paginación y las opciones reales de cada endpoint.
- No escribir SQL, abrir Redis/MinIO ni crear una segunda API de negocio en Next.js.
- No registrar cuerpos de Excel, contraseñas, cookies ni cabeceras de autorización.

La importación comprueba identidad y catálogos antes de consumir el cuerpo pesado.
Sus plazos, cuotas y límites están en [controles.md](../security/controles.md).
Un trabajo que deba persistir después de una recarga requiere una capacidad de
jobs en la API; el worker local de importación no ofrece esa garantía.

## Coordinación entre repositorios

Si falta una capacidad de backend, registrar la dependencia y el orden de
despliegue. Trabajar en la API cuando el alcance lo autorice, con sus propias
instrucciones y migraciones. No declarar que un contrato externo está desplegado
solo porque el cliente web lo consume.
