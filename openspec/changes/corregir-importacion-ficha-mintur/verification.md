# Comprobación del cambio

## Archivo y resultado actual

Se leyó `temp/Plaza 15 de mayo.xlsm` sin modificarlo ni ejecutar sus macros,
fórmulas o enlaces externos. La primera corrección conservaba dos fotos y
rechazaba la tercera por tamaño. La petición posterior del usuario sustituye
ese rechazo por preparación automática.

| Foto | Bytes originales | Bytes preparados | Dimensiones de salida |
| ---- | ---------------- | ---------------- | --------------------- |
| 1    | 404.916          | 95.209           | 1273 × 530            |
| 2    | 1.130.032        | 138.276          | 1024 × 768            |
| 3    | 5.330.177        | 502.176          | 1600 × 900            |

El worker entrega las tres fotos como JPEG, con tamaño declarado coincidente
con los bytes decodificados y formato y dimensiones comprobados con Sharp.
La tercera pasa de aproximadamente 5,08 MiB a 490 KiB. El original sigue intacto.

El worker aislado procesó el libro en 5,286 segundos. Una copia standalone
fuera del repositorio lo procesó en 4,247 segundos, cargando Sharp y sus
binarios desde esa copia. Ambos usaron el plazo de 15 segundos y heap antiguo
192 MiB, joven 32 MiB y pila 4 MiB. Una ejecución simultánea con build superó
el plazo; no se amplió el límite y el resultado no se reprodujo al ejecutar
sin esa compilación simultánea. Esto no es una comprobación de carga del servidor.

Las advertencias actuales corresponden exclusivamente a los datos de Promoción:
plan cantonal NO, inclusión SÍ y paquete sin selección. Se conservan esos datos
sin deducir la respuesta que falta. Se comprobó también la lectura previa de
firma/dimensiones de los tres PNG originales y del JPEG preparado de la tercera
foto: el archivo de 5,08 MiB pasa la validación previa para preparar en el navegador.

## Evaluación y guías

El resumen del archivo guarda 10 + 4,5 + 5 + 9,5 + 0 + 0 + 2 + 0 + 0 = 31,
con máximos que suman 100. La interfaz explica el sentido técnico de la evaluación
y muestra los nueve criterios en una tabla desplegable. No se ejecutaron las
fórmulas ni se acredita ese número como la valoración actual de la API.

La comprobación inicial del mapeo con opciones locales de catálogo, basadas en
el catálogo sembrado de la API, conservó 66 guías locales, 10 nacionales y
1 especializado en cultura. El conteo general original de 1 especializado queda
en observaciones y no genera una fila duplicada ni un aviso por tipo genérico.
Las tres entradas de medios de promoción conservaron enlaces y periodicidades.
Esas opciones locales no son una consulta a producción. La preparación posterior
no cambia este mapeo.

## Fuentes y contratos

Se consultaron extractos indexados del
[manual oficial de MINTUR](https://servicios.turismo.gob.ec/wp-content/uploads/2023/04/Manual-de-Atractivos-Turisticos_compressed.pdf):
sección 10.1 para plan turístico cantonal, 10.2 para oferta establecida y sección
4.1.2.3 para el propósito técnico de la evaluación. No se pudo abrir el PDF completo.
La búsqueda de fuentes municipales no acreditó un plan vigente que incluyera esta
plaza ni su pertenencia a un paquete concreto; no se rellenan respuestas por inferencia.

Se revisó el código local de la API: `hasPlan` y `partOfPackage` exigen Sí/No
para publicar; `includedInPlan` admite `null`. La API sigue recibiendo PNG/JPEG
hasta 5 MiB y generando la versión final WebP. La preparación cambia el archivo
enviado, sin cambiar esa validación ni el contrato de publicación.

## Comprobaciones realizadas

- `bun run typecheck`: completado sin errores.
- `bun run lint`: completado sin advertencias.
- `bun run build`: compilación, TypeScript, generación de rutas y preparación
  standalone completados, incluida la última versión de la interfaz.
- Worker standalone fuera del repositorio: procesó el archivo real y entregó
  tres fotos válidas sin depender del `node_modules` del repositorio.
- Lectura previa de dimensiones: coincide con los PNG originales y el JPEG
  preparado; no se probó la codificación canvas en un navegador.
- Formato de los archivos y `git diff --check`: comprobados.
- `bun run openspec validate --all --strict`: diez elementos válidos, ninguno
  rechazado. Se consolidó la petición posterior en este cambio para conservar
  coherencia entre deltas y especificaciones principales.

## Límites

No se añadieron ni ejecutaron suites unitarias o de navegador. No se comprobó
la interfaz en navegador ni la publicación contra la API remota; no se modificaron
registros institucionales ni se realizó un despliegue durante estas comprobaciones.
La subida manual usa las APIs de bitmap/canvas documentadas y pasó tipos/lint/build,
pero su comportamiento visual y la compresión en navegador quedan pendientes de
comprobación directa.

El archivo real no permite comprobar una suma de fotografías superior a 20 MiB:
sus tres fotos originales suman aproximadamente 6,55 MiB. La revisión confirma
que no existe contador agregado de bytes de fotos. Los límites del Excel, ZIP,
XML, worker y recursos de imagen se conservan.
