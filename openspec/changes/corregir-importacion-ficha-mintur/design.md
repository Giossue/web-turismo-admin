# Design

## Contexto y evidencia

Archivo local de 7,1 MiB. Se leyeron XML, relaciones, anclas y propiedades de
casillas, sin ejecutar macros o fórmulas, y se reprodujo el parser actual:

- Tres PNG en anexos: 404.916, 1.130.032 y 5.330.177 bytes. La tercera supera
  5 MiB por sí sola; la suma no explica su rechazo.
- Resumen: 10 + 4,5 + 5 + 9,5 + 0 + 0 + 2 + 0 + 0 = 31, máximo 100.
- Guías cercanos: 66 locales, 10 nacionales, 1 nacional especializado y
  desglose de 1 en cultura y 0 en aventura. El catálogo sembrado no incluye
  el nombre genérico pero sí las dos especializaciones.
- Casillas de plan: No; inclusión en plan: Sí; paquete turístico: ninguna
  marcada. El parser lee las dos primeras correctamente. La API exige Sí/No
  en `partOfPackage`; su error menciona ambiguamente «publicar el plan».

La coincidencia de conteos generales y detalle permite evitar una fila redundante;
no prueba por sí sola la identidad de las personas. Por ello también se conserva
el número original en observaciones y nunca se atribuye una especialización ausente.

## Brief

Usuario institucional; objetivo importar, revisar y publicar una ficha correcta.
Decisión: qué dato corregir; información mínima: fotografía/tamaño, referencia de
puntaje y pregunta/apartado pendiente. Acción principal: revisar la ficha y guardar.
Se conservan MUI, formularios RHF, labels flotantes y la confirmación de publicación.

## Decisiones

Eliminar únicamente el contador agregado de bytes de fotografías. El Excel continúa
limitado a 20 MiB y su expansión a 64 MiB, con hasta veinte fotos PNG/JPEG admitidas
por firma. El mensaje identifica tamaño por imagen y recomienda reducirlo; no promete
importar una foto que ya excede 5 MiB ni altera el archivo proporcionado.

El puntaje deja de emitirse como advertencia. El endpoint devuelve su resumen y el
hook lo conserva en memoria para un aviso informativo: origen Excel y máximo real
de sus criterios. No se guarda como valoración del panel ni se inventa una consulta
que el resumen actual no ofrece.

Los tipos Local, Nacional, Cultura y Aventura se resuelven normalmente. Un conteo
genérico igual al desglose positivo se conserva como nota, sin duplicarlo como fila.
Si difiere y no hay tipo genérico, se conserva como observación y se solicita revisar
el paso 5. Un tipo genérico disponible puede conservar la fila discrepante. No se
crean catálogos ni se agregan las cantidades a otras especializaciones.

Las selecciones Sí/No requieren exactamente una marca. Vacío o dos marcas es dato
ausente, no No. El parser advierte de las preguntas obligatorias de Promoción y de
plan No/inclusión Sí. Las respuestas contradictorias se conservan para revisión;
el selector de inclusión queda editable. Si no existe plan y su inclusión no tiene
información, se envía `null`, que la API admite como campo opcional. Las respuestas
obligatorias sin información siguen impidiendo publicar.

El panel adapta únicamente dos errores conocidos de la API a las etiquetas del
paso 10. El mensaje queda dentro del diálogo y permite abrir la ficha; errores
desconocidos conservan su texto seguro. Cambiar de ficha o reintentar limpia el
error anterior. La API mantiene autorización, auditoría, validación y atomicidad.

## Comprobaciones y límites

Lectura del archivo real, parser/worker, mapeo con opciones locales de catálogo,
tipos, lint, formato, build y validación OpenSpec. No ejecutar suites no solicitadas.
No publicar ni modificar datos institucionales para comprobar el flujo. Registrar
la evidencia y distinguir opciones locales de un catálogo real consultado.
