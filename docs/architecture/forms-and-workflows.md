# Formularios y flujos

## Contratos existentes

React Hook Form y los campos compartidos gestionan estado, labels flotantes y
errores. Reutilizar `rules.ts`, mappers y tipos de dominio. Zod está disponible
para contratos que necesiten un esquema, pero no afirmar que todos los
formularios existentes lo utilizan.

Pedir datos que la persona necesita aportar. Las relaciones se eligen por
etiqueta, no escribiendo IDs. Cargar catálogos de la API, limpiar dependencias
incompatibles y permitir conservar referencias retiradas según el contrato.

## Superficies y recuperación

Un registro corto utiliza un diálogo; una ficha extensa conserva el asistente
por apartados y resumen. Volver a un paso no debe borrar valores. Errores
recuperables mantienen el formulario; los errores de campo explican cómo corregirlo.
Las peticiones pendientes bloquean envíos repetidos sin mover los controles.

La API valida formatos, permisos y consistencia aunque el cliente refleje esas
reglas. El estado de publicación no se deduce del avance visual del asistente.

## Guardado de fichas

`centerSaveScope` serializa guardados de formulario principal y apartados por
ficha. La versión se obtiene de los datos actuales y se envía al guardar.
Manejar un 409 como conflicto, no como permiso para sobrescribir silenciosamente.
Conservar la protección de la sesión del editor contra un resultado tardío.

## Diálogos

Título asociado, cancelación visible, gestión de foco, cuerpo que pueda hacer
scroll y límites de viewport. Usar la interacción MUI para teclado y overlays.
Cerrar después del éxito, invalidar datos afectados y mostrar feedback.
Conservar valores y error cuando no se complete la operación.

## Confirmación proporcional

La eliminación actual es lógica y usa `DeleteRecordAction`: identifica registro,
explica consecuencias, bloquea repetición y conserva historial. El panel no
ofrece undo ni restauración; no inventarlos porque la operación sea lógica.

Una futura operación de borrado físico o pérdida permanente necesita salvaguarda
adicional, como escribir el nombre visible, y un contrato de API específico.
Cambios reversibles solo ofrecen deshacer si el backend puede revertirlos.

## Archivos e importación

Explicar formatos y tamaño antes de seleccionar. El servidor valida contenido;
el navegador aporta feedback temprano. El endpoint Excel devuelve valores,
apartados, sugerencias y fotos admitidas sin escribir en la API. El formulario
principal queda como cambios locales; el editor guarda los apartados pendientes
y sube las fotos cuando la ficha tiene código, también al importar sobre una
existente. La publicación sigue su revisión institucional.

Las fotos tienen un límite de 5 MiB por imagen, sin un límite adicional para su
suma; los límites del libro y del worker se conservan. El puntaje del Excel se
presenta como referencia informativa con su máximo, sin copiarlo como valoración
de la API. Los conteos generales de guías coincidentes con su desglose se conservan
en observaciones y no generan filas duplicadas. Las respuestas de Promoción vacías,
ambiguas o contradictorias se señalan para revisión en el paso 10, sin inventar No.
Un rechazo de publicación permanece visible en el diálogo y ofrece revisar la ficha;
la autorización y la decisión siguen perteneciendo a la API.

Detalle: [importación MINTUR](../../openspec/specs/mintur-import/spec.md) y
[controles actuales](../security/controles.md).
