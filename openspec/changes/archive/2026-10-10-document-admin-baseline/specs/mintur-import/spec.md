## Purpose

Analizar una ficha MINTUR para precargar el editor institucional con valores,
advertencias y fotos admitidas, limitando el trabajo ante archivos no confiables.

## ADDED Requirements

### Requirement: Authorized file analysis

La importación SHALL exigir un token y una identidad con rol institucional
validada por la API antes de consumir el cuerpo pesado del archivo.

#### Scenario: Falta token

- **WHEN** se solicita importación sin token
- **THEN** responde 401 sin analizar el archivo

#### Scenario: Cuenta sin rol permitido

- **WHEN** la API identifica una cuenta sin rol de administrador o agente
- **THEN** responde 403 sin analizar el archivo

### Requirement: Accepted workbook boundary

La importación SHALL aceptar `.xlsx` o `.xlsm` de tamaño positivo hasta 20 MiB,
rechazando cuerpos multipart que excedan la holgura permitida.

#### Scenario: Cuerpo excesivo

- **WHEN** la longitud declarada o los bytes recibidos exceden 20 MiB más 64 KiB
- **THEN** se rechaza el cuerpo con 413

#### Scenario: Multipart inválido

- **WHEN** no se puede leer multipart o falta el campo de archivo
- **THEN** responde 400 y no produce datos importados

### Requirement: Bounded archive parsing

La importación SHALL rechazar un archivo que excede límites de expansión,
estructura o contenido, sin ejecutar macros, fórmulas ni enlaces externos.

#### Scenario: Archivo con expansión maliciosa

- **WHEN** un ZIP excede los límites reales de bytes o relación de compresión
- **THEN** se rechaza como ficha inválida con 422

#### Scenario: Estructura XML inválida

- **WHEN** una entrada requiere DTD o excede profundidad, nodos o dimensiones admitidas
- **THEN** se rechaza antes de entregar el libro al analizador de ficha

### Requirement: Bounded time and capacity

La importación SHALL limitar carga y análisis, cancelar trabajo interrumpido
y aplicar cuotas por usuario y proceso sin prometer una cuota global distribuida.

#### Scenario: Cuota o capacidad agotada

- **WHEN** no hay capacidad local o la cuenta supera la cuota de intentos
- **THEN** responde 429 con `Retry-After: 60`

#### Scenario: Análisis fuera de plazo

- **WHEN** el procesamiento no termina dentro del plazo de análisis permitido
- **THEN** se termina el procesamiento y la importación no informa éxito

### Requirement: Prefill without publication

La importación SHALL devolver formulario, secciones, sugerencias, advertencias
y fotos admitidas para revisión posterior, sin guardar ni publicar desde el endpoint.

#### Scenario: Plantilla admitida

- **WHEN** se analiza una ficha válida con catálogos autorizados
- **THEN** responde con datos de precarga
- **AND** la persona continúa el flujo de revisión y guardado del editor

### Requirement: Extracted photo boundary

La importación SHALL extraer únicamente fotos PNG/JPEG con firma válida dentro
de los límites de cantidad, tamaño por foto y tamaño total.

#### Scenario: Foto de formato o tamaño no admitido

- **WHEN** se detecta una imagen que no cumple esas condiciones
- **THEN** no se entrega como una foto válida para el flujo de subida

### Requirement: Private import responses

La importación SHALL devolver respuestas privadas sin caché compartida y errores
sin contenido del archivo, credenciales ni payloads de proveedores.

#### Scenario: Error de análisis

- **WHEN** el archivo no se puede procesar
- **THEN** se devuelve un mensaje de error seguro
- **AND** la respuesta conserva `Cache-Control: private, no-store`
