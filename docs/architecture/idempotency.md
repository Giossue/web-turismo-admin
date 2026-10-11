# Repetición y concurrencia

## Controles actuales del cliente

- Botones y guardado evitan envíos duplicados mientras hay una petición pendiente.
- `centerSaveScope` serializa guardados de la misma ficha dentro del cliente,
  incluidos los apartados importados. La versión se lee al ejecutar y la
  respuesta confirmada se guarda en caché antes de la siguiente escritura.
- La versión de ficha se envía a la API y los 409 fuerzan una consulta del
  detalle vigente aunque la caché todavía se considere fresca. Si la consulta
  falla, el formulario conserva sus valores y comunica el fallo de recuperación.
- La generación de sesión evita aplicar datos o reintentos de otra identidad.
- La importación reserva capacidad antes de procesar y libera el cupo al terminar.

Estos controles no garantizan un único efecto entre pestañas, clientes o réplicas.
La API es responsable de transacciones, restricciones y transiciones atómicas.

Al importar apartados, el cliente omite los que ya existen en el detalle. Si no
hay detalle local, lo consulta antes de guardar. Tras un 409 consulta de nuevo,
comprueba otra vez la existencia del apartado y solo reintenta una vez si sigue
ausente, enviando la versión consultada. Un apartado encontrado durante esa
recuperación se conserva. Las versiones y la autorización efectiva de la
escritura siguen siendo responsabilidad de la API.

## Diseño de una nueva mutación

Definir qué ocurre ante doble clic, reintento tras timeout, repetición y escritores
concurrentes. Preferir operaciones naturalmente idempotentes: establecer un valor
o realizar una transición validada sobre estado/versión.

Si se adopta una clave de idempotencia, el contrato de la API debe definir:

- Alcance por identidad, operación y organización si el dominio la incorpora.
- Reclamación atómica antes del efecto y comparación del payload validado.
- Resultado de repetición completada, petición en curso y payload distinto.
- Retención, respuesta y relación entre efecto, resultado y auditoría.

No afirmar que los endpoints actuales aceptan `Idempotency-Key` ni añadirlo
como una garantía sin soporte verificado. La web puede generar una clave por
intención y conservarla para reintentos cuando ese contrato exista.

## Resultado desconocido

Un fallo de red no demuestra que la escritura no ocurrió. No repetir
automáticamente POSTs con efectos inciertos. Consultar el estado autorizado
o usar el mecanismo de repetición acordado con la API.

Al modificar backend, las pruebas de carrera reales y constraints se comprueban
allí. Mocks de la web sirven para el manejo del contrato, no para demostrar
atomicidad en PostgreSQL.
