# Proposal

## Why

El usuario solicita que el sistema reduzca automáticamente las fotografías,
en lugar de exigir editarlas fuera del panel. También necesita comprender
paquete turístico, plan cantonal y la evaluación de 31 puntos del Excel.

## What Changes

- Optimizar fotos PNG/JPEG de anexos dentro del worker y fotos manuales antes
  de enviarlas a la API, con tamaño y calidad acotados y sin cambiar el original.
- Aplicar el máximo de 5 MiB a la foto preparada, sin límite agregado nuevo.
- Conservar conteos generales de guías sin duplicar el desglose de especializaciones.
- Mantener el rechazo de publicación dentro del diálogo con acceso a revisar la ficha.
- Explicar plan municipal y oferta organizada junto a sus preguntas y avisos.
- Sustituir el aviso de puntaje por una referencia desplegable con explicación
  de los nueve criterios y los puntos obtenidos frente al máximo de cada uno.
- Conservar respuestas sin información y contradicciones: no deducir respuestas
  institucionales de páginas web que no las acreditan.

## Capabilities

### New Capabilities

- `photo-preparation`: compresión previa automática de fotos manuales.

### Modified Capabilities

- `mintur-import`: preparación de fotos, desglose de valoración y explicación
  de preguntas de Promoción.
- `review-and-moderation`: diagnóstico recuperable de publicación incompleta.

## Impact

Portal y worker Next/MUI. Sharp 0.35.5, ya instalado por Next, pasa a dependencia
directa para el worker; su empaquetado debe incluir binarios nativos en standalone.
La API mantiene límites, permisos y normalización final WebP. No cambian reglas
de publicación, datos institucionales, catálogos ni esquema. El usuario autoriza
commit y push; no se solicita despliegue ni suites de pruebas.
