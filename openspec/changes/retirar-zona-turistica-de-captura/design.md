# Design

## Brief

Usuario institucional. Objetivo: identificar y ubicar el atractivo con los datos
de su ficha. Decisión: territorio y coordenadas del lugar. Información mínima:
provincia, cantón, parroquia y punto geográfico. Acción principal: guardar la ficha.

## Decisiones

Quitar el selector de zona, su fila del resumen y su inclusión en diferencias de
identificación. Retirarlo también de los campos que valida el asistente; no debe
pedirse un dato oculto. Conservar el valor interno y su contrato para no borrar
referencias de fichas anteriores al cargar, importar o guardar otros datos.

No seleccionar «Entorno de Guaranda» automáticamente. Esa opción procede del seed
`20260920_z1_seed_guaranda_zone.sql` del monorepo, no de una pregunta del Excel.
Los catálogos y el historial continúan siendo responsabilidad de la API.

La API resolverá los atractivos y rutas de las descargas mediante la cobertura
geográfica y las coordenadas publicadas, sin exigir esa relación opcional.
Desplegar ambas implementaciones para que las fichas nuevas sin zona se incluyan.

## Comprobación

Revisar edición e importación compatibles, tipos, lint, formato y OpenSpec. No
ejecutar suites ni escribir registros remotos sin solicitud. Registrar la evidencia
y distinguir la implementación local del despliegue real.
