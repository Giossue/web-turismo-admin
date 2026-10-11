# Design

## Brief y fuentes

Usuario institucional; objetivo importar o subir fotos sin edición externa y
entender los datos de la ficha. Decisión: revisar información turística realmente
pendiente. Información mínima: resultado de preparación, significado de preguntas
y desglose de evaluación. Acción principal: guardar la ficha.

El [manual MINTUR](https://servicios.turismo.gob.ec/wp-content/uploads/2023/04/Manual-de-Atractivos-Turisticos_compressed.pdf)
describe oferta establecida por administrador/agencias/operadoras en 10.2 y
plan de promoción turístico cantonal en 10.1. Su evaluación suma criterios
técnicos hasta 100 puntos. La búsqueda no acredita un plan vigente específico
para Plaza 15 de Mayo ni que esta forme parte de una oferta organizada.

En el archivo proporcionado la foto de 5.330.177 bytes es PNG 2048×1152.
El puntaje resulta de 10 + 4,5 + 5 + 9,5 + 0 + 0 + 2 + 0 + 0. Los ceros
se muestran como valores almacenados, sin deducir su causa de esos números.

## Preparación de fotos

Política compartida: lado mayor hasta 1600 px, sin ampliar ni recortar; JPEG
con calidad inicial 82 y reducciones acotadas hasta 1024 px/calidad 70 si
necesita más compresión. Objetivo 512 KiB, máximo de salida 5 MiB. Las fotos
ya pequeñas pueden conservarse si el resultado ocupa más. La API sigue
generando su WebP y encuadre habituales. No se edita el archivo original.

El worker prepara fotos secuencialmente, valida firma y decodificación, limita
los píxeles de entrada y cada procesamiento nativo. Mantiene las restricciones
ZIP/XML/Excel, veinte fotos, cuota, concurrencia y plazo global de quince segundos.
Se omiten con explicación las fotos dañadas o que exceden recursos seguros;
superar 5 MiB de origen deja de ser por sí solo causa de rechazo.

Para subida manual, se prepara en el navegador antes del multipart, con estado
visible, tamaño de origen acotado y liberación del bitmap y canvas. No se
transporta la foto original grande a la API. No cambia autorización ni URL.

Sharp permanece externo al bundle CJS del worker; Next incluye su módulo y
dependencias nativas explícitamente. Comprobar el worker desde standalone
fuera de la raíz del repositorio para detectar dependencias ausentes.

## Comprensión de la ficha

La valoración usa un acordeón MUI con un título claro y una tabla de criterios,
obtenido y máximo. Explica qué mide y que se lee del resumen del archivo. No
mezcla ese valor con la valoración persistida ni asigna una jerarquía al registro.

Plan y paquete incluyen ejemplos y lenguaje operativo. La ausencia de respuesta
continúa siendo ausencia; no se traduce a No. La API exige respuestas binarias
para publicar. Los avisos señalan el significado del dato para que la persona
responsable pueda resolverlo sin pedirle crear un plan o paquete nuevo.

## Comprobación

Procesar el archivo real, inspeccionar firmas/tamaños/dimensiones, comprobar
tipos, lint, formato, build y worker standalone. Documentar los resultados reales.
No ejecutar suites ni publicar registros sin solicitud.

## Guías y revisión institucional

Se conserva la corrección inicial de guías: 66 locales, 10 nacionales y 1
especializado en cultura cerca del atractivo. El general de 1 especializado
se conserva en observaciones y no se añade como otra fila si coincide con
cultura más aventura. La coincidencia no acredita identidad de personas.
Una discrepancia sin tipo equivalente conserva el original y pide revisión.

El error conocido de publicación se explica dentro del diálogo, con acceso a
revisar la ficha. Nueva ficha o reintento limpian ese error. API, sesión,
versión, auditoría, catálogos y guardado institucional permanecen en sus
fronteras existentes. No se publican registros para comprobar esta interfaz.
