# Integraciones vigentes

| Integración             | Acceso y responsabilidad                                               |
| ----------------------- | ---------------------------------------------------------------------- |
| API NestJS              | `admin-api.ts` y `http.ts`, con token institucional y errores comunes  |
| Estilo y tiles de mapas | MapLibre, URL pública configurada y worker local                       |
| Excel MINTUR            | Endpoint Next.js con yauzl, saxes, ExcelJS y worker de Node            |
| Asistencia editorial    | Endpoint administrativo de la API; sugerencia sujeta a revisión humana |
| Multimedia              | Endpoints de la API; almacenamiento y permisos remotos                 |

## HTTP

`TURISMO_API_URL` se usa en servidor; `NEXT_PUBLIC_TURISMO_API_URL` en navegador.
Son URLs de servicio, no secretos. El access token de la cuenta permanece en
memoria; las claves de proveedor, IA y almacenamiento pertenecen a la API.

El transporte común aplica timeout de 60 segundos y combina cancelación.
Las operaciones de sesión tienen su plazo propio de 20 segundos. Las llamadas
de identidad/catálogos de importación comparten cinco segundos. Mantener sus
contratos al añadir clientes; no introducir Axios solo para igualar la plantilla.

Normalizar errores, validar payloads relevantes en la frontera y limitar volumen.
El tipado TypeScript no sustituye validación de respuestas externas.

## Mapas y ubicación

`NEXT_PUBLIC_TILESERVER_STYLE_URL` determina el estilo público. La CSP permite
orígenes configurados de API y mapa; estilos con dependencias adicionales requieren
revisión explícita. No aceptar una URL de proveedor arbitraria desde la petición.

La ubicación se solicita al pulsar el control y se confirma antes de guardarse.
No se consulta un servicio por IP ni se envía una ubicación histórica al proveedor
de IA. La API del navegador informa precisión, no garantiza que la fuente sea GPS.

## Excel MINTUR

El [contrato de importación](../../openspec/specs/mintur-import/spec.md) describe
autorización, archivos admitidos, límites y persistencia. Los límites concretos
están en [controles actuales](../security/controles.md).

El endpoint analiza el libro y devuelve datos para revisión; el editor mantiene
el formulario principal como cambios locales. Los nueve apartados importados
y las fotos se envían a la API cuando la ficha tiene código, sin publicarla.
Los apartados ya presentes se omiten y las fotos fallidas permanecen pendientes
para reintento. La API conserva la autorización y las escrituras efectivas.

Las preguntas de plan, inclusión y paquete en Promoción conservan las casillas
sin respuesta única como «Sin confirmar». Esa ausencia no obliga a responder
Sí o No para publicar ni suma puntos. Las contradicciones conocidas del archivo
se muestran sin reemplazar sus respuestas. La referencia del puntaje lee el
resultado guardado de las hojas de evaluación; no ejecuta fórmulas ni macros.
La API calcula con sus datos guardados y conserva desconocidos como NULL.
Este comportamiento requiere aplicar primero la migración de Promoción y
desplegar la API compatible del repositorio hermano.

Conservación mantiene por separado el estado del atractivo y del entorno. Si
el Excel no selecciona un estado único, se muestra Sin confirmar y se guarda
como null, conservando factores y observaciones. No se deduce el estado a partir
de los factores. Con la API compatible, esa ausencia no bloquea la publicación
y aporta cero puntos; requiere primero `20261011_conservation_unknown_state.sql`
y la nueva lectura/proyección de Conservación del repositorio hermano.

## Evoluciones

Este portal no recibe webhooks ni opera colas persistentes. Si se necesitan,
implementarlos en la API: verificar firma sobre bytes originales, frescura,
deduplicación y efectos repetidos. Documentar cuota, timeout, cancelación y
recuperación de cualquier integración nueva.
