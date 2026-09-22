# Importar ficha MINTUR

El panel puede precargar el formulario de "Nueva ficha" a partir de la "Ficha para el
levantamiento y jerarquización de atractivos turísticos" (plantilla MINTUR 2017) en Excel.
El botón **"Importar ficha (.xlsx / .xlsm)"** está en el encabezado del editor de fichas.

El proceso **nunca guarda nada automáticamente**: solo lee el archivo, precarga los campos que
pudo resolver con confianza y muestra advertencias para los que no. El usuario revisa, corrige
y guarda con el flujo normal (borrador → revisión → publicación).

## Formatos soportados

- `.xlsx` y `.xlsm` (el mismo formato OOXML, generado desde Excel o LibreOffice).
- `.xls` y `.ods` se rechazan con el mensaje "guárdalo como .xlsx".
- Tamaño máximo: 20 MB.
- El archivo debe tener la hoja `Ficha_Jerarquia` con `B1` conteniendo "JERARQUIZACIÓN" y `B5`
  igual a "1.1 Nombre del Atractivo Turístico"; si no, se rechaza como plantilla no reconocida.

## Qué se importa hoy

- **Identificación**: nombre, categoría, tipo, subtipo, código del atractivo.
- **Ubicación y administración**: provincia, cantón, parroquia, barrio/calle/número/
  transversal, latitud, longitud, altitud, datos del administrador.
- **Características e ingreso**: clima, línea de producto, escenario, horarios de
  ingreso/salida por tipo, formas de pago, precios, meses recomendados.
- **Accesibilidad y conectividad**: ciudad más cercana, vías terrestres, tipos y detalle de
  transporte (cooperativas), accesibilidad general, estado de señalización de aproximación.
- **Actividades que se practican**: las 56 opciones de las secciones 9.1 y 9.2; las marcadas
  se resuelven contra el catálogo de actividades (acotado por categoría) y se precargan en el
  formulario principal.
- **Políticas y regulaciones**: las 4 preguntas SI/NO con sus códigos, año de elaboración y
  especificación — quedan disponibles en los datos extraídos, pendiente conectarlas a
  `saveAdminCenterSection` desde la UI (ver "Qué falta").
- **Promoción y comercialización**: medios de promoción con dato real (se descartan los
  placeholders de la plantilla), plan de promoción cantonal, paquete turístico.
- **Registro de visitantes y afluencia**: registro de visitantes, temporadas alta/baja,
  llegadas nacionales/extranjeras, informante clave.
- **Recurso humano**: conteos de administración/operación, especialización, y formación por
  grupo (educación, capacitación, idiomas).
- **Planta turística y complementarios**: conteos de alojamiento, alimentos y bebidas,
  agencias de viaje y guías (atractivo/ciudad), facilidades del entorno (con coordenadas y
  estado), y servicios complementarios.
- **Estado de conservación**: estado del atractivo y del entorno, los 21 factores de
  alteración por componente (naturales, antrópicos y "otro"), y la declaratoria asociada.
- **Descripción** del atractivo.
- **Firmas de responsabilidad** (elaborado/validado/aprobado).
- **Hoja `ficha_Accesibilidad`**: el detalle de criterios SI/NO por categoría de discapacidad
  (se muestra como referencia; el mapeo a los criterios del formulario de accesibilidad
  detallada es un trabajo posterior).
- El total de `RESUMEN DE RESULTADOS` se muestra **solo como advertencia informativa** — la
  jerarquía y el puntaje real los calcula la API a partir de las respuestas, no se importan del
  Excel.

Los catálogos (provincia, cantón, parroquia, categoría, tipo, subtipo, línea de producto,
escenario, tipo de ingreso, accesibilidad, actividades) se resuelven contra los catálogos
reales de la API institucional. Cuando el texto de la ficha no coincide con ningún valor
activo (o es ambiguo), el campo queda sin resolver con una advertencia — nunca se adivina ni
se crea un valor nuevo.

## Qué falta (documentado, no implementado)

Esta sección tiene su mapeo de celdas y su forma de `content` documentados en
`docs/plans/active/importar-ficha-mintur.md` (secciones 3 y 3.1), pero su extracción todavía no
está implementada con el mismo nivel de verificación que el resto:

- Higiene y seguridad (servicios básicos, señalética, salud, seguridad, comunicación,
  amenazas)

Además, aunque políticas, promoción, visitantes, recurso humano, planta y conservación **ya
se extraen** del Excel, todavía no hay un paso en la UI que los guarde en el centro turístico
(viajan como JSON genérico vía `saveAdminCenterSection`, no como parte del formulario
principal) — por ahora quedan disponibles en la respuesta del endpoint, pero el editor no los
usa aún para precargar esos pasos del asistente. La excepción es `actividades`, que sí llega
al formulario principal vía `activityIds`.

Estos campos del formulario quedan vacíos tras importar; el usuario los completa a mano.

## Limitaciones conocidas

- **Zona turística**: no tiene fuente en la ficha MINTUR (es un catálogo interno del sistema).
  Siempre queda sin resolver — el usuario la elige manualmente según la localidad más cercana.
- **Jerarquía**: se calcula del lado de la API a partir de las respuestas, nunca se importa.
- **Checkboxes sin verificar contra una segunda ficha real.** La plantilla no usa controles de
  formulario de Excel (no hay `ctrlProps` ni `vmlDrawing` en el archivo de referencia probado):
  marcar una opción es escribir la letra "x" en la celda contigua a la etiqueta. Esto se
  comprobó contra un solo archivo, en el que además faltaba al menos una marca que
  lógicamente debería existir. Hasta probar con una segunda ficha de procedencia distinta
  (idealmente guardada desde Excel en Windows), cualquier casilla vacía se trata como "sin
  dato", nunca como "no".
- Catálogos de `clima` y `zonas turísticas` con muy poca data real en producción — la mayoría
  de las fichas van a mostrar advertencia de catálogo en esos campos hasta que se pueblen.
- Coordenadas mal escritas en la ficha original (formatos rotos, comas en vez de puntos,
  espacios de más) generan advertencia y el campo queda vacío; no se intenta adivinar el valor.
