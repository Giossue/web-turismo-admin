# Observabilidad y auditoría

## Responsabilidades

La API mantiene auditoría de acciones de negocio, roles y registros. La web
consume actividad reciente y avisos. Esa vista no sustituye una auditoría del
almacenamiento ni demuestra que cada acción remota se registró.

El servidor web debe permitir observar disponibilidad, errores, latencia y
rechazos de importación con límites. La infraestructura puede medir memoria,
CPU y presión de workers. Esta adopción no instala un proveedor de métricas.

## Datos de diagnóstico

Registrar únicamente el contexto necesario para investigar: tipo de operación,
resultado y correlación segura cuando exista. Nunca archivo Excel, contenido
completo de ficha, contraseña, cookie, token, cabecera de autorización o URL
firmada. No poner stack traces ni nombres de proveedor en mensajes del producto.

## Evolución de la API

Cuando una nueva acción requiere auditoría, definir quién, qué registro,
resultado y cuándo, junto con retención y acceso. Los efectos persistentes y
su auditoría necesitan coherencia transaccional en el backend. Los intentos
denegados relevantes deben poder investigarse sin exponer registros ajenos.

Métricas y alertas se documentan con su fuente y entorno. No afirmar cobertura
de producción a partir de logs de un build local o de la API simulada.
