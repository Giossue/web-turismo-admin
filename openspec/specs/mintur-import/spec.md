# mintur-import Specification

## Purpose

Analizar una ficha MINTUR para precargar el editor institucional con valores,
advertencias y fotos admitidas, limitando el trabajo ante archivos no confiables.

## Requirements

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

La importación SHALL preparar automáticamente fotos PNG/JPEG con firma válida, hasta veinte fotografías, con máximo de salida de 5 MiB por imagen y sin imponer un límite adicional a la suma de sus bytes; SHALL conservar los límites seguros del libro, su expansión, recursos de imagen y worker.

#### Scenario: Foto grande válida

- **WHEN** una fotografía válida supera 5 MiB de origen dentro de los límites seguros
- **THEN** el sistema reduce su resolución y peso automáticamente antes de entregarla para subir
- **AND** no exige que la persona edite la fotografía fuera del panel

#### Scenario: Foto dañada o fuera de recursos

- **WHEN** la fotografía no tiene firma válida, no se puede decodificar o excede los recursos admitidos
- **THEN** se omite con explicación segura y se conservan las otras fotos preparadas

#### Scenario: Suma superior al antiguo límite

- **WHEN** las fotos preparadas cumplen el límite individual dentro de un libro admitido
- **THEN** no se omiten por el tamaño agregado de las fotografías

### Requirement: Referencia de valoración del Excel

El panel SHALL presentar el puntaje extraído como evaluación técnica del Excel, con su máximo y desglose accesible de criterios, separado de advertencias y sin sustituir la valoración calculada por la API.

#### Scenario: Puntaje presente

- **WHEN** el Excel contiene un resumen de valoración
- **THEN** se identifica qué evalúa ese puntaje y se ofrece abrir los puntos y máximo de cada criterio
- **AND** los resultados cero o sin información conservan esa distinción

### Requirement: Conteos generales y detalle de guías

El importador SHALL conservar el conteo general de guías especializados, evitar duplicarlo como otro tipo cuando coincide con su desglose y comunicar discrepancias sin atribuir especializaciones ausentes.

#### Scenario: Conteo coincidente con cultura y aventura

- **WHEN** el conteo general positivo coincide con la suma del desglose
- **THEN** se importan los tipos del desglose y se conserva el conteo general en observaciones, sin un aviso de tipo genérico inexistente

#### Scenario: Conteo discrepante sin tipo genérico

- **WHEN** el conteo general difiere del desglose y no tiene opción equivalente
- **THEN** se conserva el dato original en observaciones y se indica revisar los conteos en el apartado Planta turística

### Requirement: Revisión de respuestas de promoción importadas

El importador SHALL conservar las respuestas originales de Promoción y
representar una pregunta sin respuesta única como Sin confirmar, sin deducir No
ni exigir completarla para publicar. SHALL explicar las contradicciones entre
plan e inclusión sin reemplazar respuestas del archivo.

#### Scenario: Paquete sin selección

- **WHEN** el Excel no marca una respuesta única sobre pertenencia a un paquete turístico
- **THEN** la pregunta se precarga como Sin confirmar
- **AND** no aparece una instrucción obligatoria de completar esa pregunta antes de publicar

#### Scenario: Plan e inclusión contradictorios

- **WHEN** el Excel marca que no existe plan y que el atractivo está incluido en él
- **THEN** ambas respuestas se conservan
- **AND** se informa la contradicción como un dato del archivo que no bloquea por sí solo la publicación

### Requirement: Private import responses

La importación SHALL devolver respuestas privadas sin caché compartida y errores
sin contenido del archivo, credenciales ni payloads de proveedores.

#### Scenario: Error de análisis

- **WHEN** el archivo no se puede procesar
- **THEN** se devuelve un mensaje de error seguro
- **AND** la respuesta conserva `Cache-Control: private, no-store`

### Requirement: Editor persistence of imported data

El editor SHALL mantener el formulario principal importado como cambios locales y activar el guardado de apartados pendientes y la carga de fotos cuando la ficha tiene código. Los apartados existentes se omiten también después de recuperar un conflicto. Sin detalle local se consulta la ficha antes de guardar; la API decide las escrituras efectivas.

#### Scenario: Ficha nueva sin código

- **WHEN** termina la importación en una ficha que todavía no tiene código
- **THEN** los apartados y las fotos permanecen pendientes
- **AND** su envío se activa cuando la creación de la ficha proporciona un código

#### Scenario: Importación sobre una ficha existente

- **WHEN** termina la importación en el editor de una ficha con código
- **THEN** se activa el guardado de apartados pendientes y la carga de fotos
- **AND** esa activación no requiere una confirmación adicional de importación
- **AND** no publica la ficha

#### Scenario: Apartado presente en el detalle consultado

- **WHEN** el editor encuentra un apartado importado en el detalle consultado
- **THEN** omite ese apartado en el guardado de los pendientes

#### Scenario: Apartado añadido durante la importación

- **WHEN** el guardado entra en conflicto y la lectura vigente contiene el apartado
- **THEN** se conserva ese apartado y no se reenvía el contenido importado

#### Scenario: Conflicto con apartado todavía ausente

- **WHEN** la lectura vigente posterior al conflicto sigue sin contener el apartado
- **THEN** se permite un único reintento con la versión consultada
- **AND** un segundo conflicto se comunica sin nuevos reintentos automáticos

#### Scenario: Ficha sin detalle local

- **WHEN** se activa la importación sin un detalle local de la ficha
- **THEN** se consulta su versión y sus apartados antes de enviar una escritura

#### Scenario: Error parcial de carga de fotos

- **WHEN** no se pueden subir algunas de las fotos importadas
- **THEN** se conservan esas fotos pendientes y se ofrece reintento
- **AND** el error no se presenta como fallo de la creación ya completada de la ficha
