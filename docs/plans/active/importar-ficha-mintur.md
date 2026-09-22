# Plan activo: importar la ficha MINTUR (Excel) para precargar el formulario

## Estado

Fase 1 (análisis) completa, incluida la profundización pedida sobre las 8 secciones
genéricas. Pendiente de aprobación antes de escribir código.

**Decisiones ya tomadas:**
- El endpoint de subida vive en este repo como Route Handler de Next.js. Como este repo no se
  conecta a Postgres (`AGENTS.md`), resuelve catálogos llamando a la API NestJS con el token
  de la sesión (mismo patrón que ya usa `src/lib/admin-api.ts`), nunca contra la base
  directamente.
- La forma del `content` JSON de las 8 secciones genéricas ya se confirmó leyendo
  `center-section-workflow.tsx` a fondo (ver 2.3 y 3.1) — ya no es una pregunta abierta.

## 1. Objetivo y alcance

Permitir que el usuario suba la ficha MINTUR en `.xlsx`/`.xlsm` (plantilla 2017,
`Ficha_Jerarquia`) y que el sistema **precargue** el formulario de "Nueva ficha" que ya
existe en el panel (`center-editor.tsx` + `center-section-workflow.tsx`). El usuario revisa,
corrige lo que el parser no pudo resolver y guarda con el flujo normal (borrador → revisión →
publicación).

Queda fuera de este alcance:
- Insertar datos en la base directamente desde el archivo. El endpoint de importación **solo
  lee y devuelve JSON**; el guardado real ocurre cuando el usuario confirma en el formulario,
  usando los endpoints de borrador que ya existen (`saveAdminCenterSection`,
  `createAdminCenter`, `saveAdminCenter`).
- Leer o modificar `xl/vbaProject.bin` (macros). Solo se leen valores de celda.
- Corregir los catálogos incompletos que este análisis encontró (`catalogo_clima`,
  `zonas_turisticas`) — se documentan como bloqueo, pero su arreglo es un cambio de datos
  aparte, no parte de esta funcionalidad.
- Cambiar el esquema de la base. No hace falta: el esquema ya tiene tabla para
  prácticamente cada campo de la ficha (ver sección 3).

## 2. Viabilidad

### 2.1 La ficha (evidencia)

Extraje el archivo `/home/janner/Descargas/Santuario del Guayco Actualizado.(1).xlsm` (zip
OOXML) y parseé `xl/worksheets/sheet1.xml` (hoja `Ficha_Jerarquia`) resolviendo
`sharedStrings`, celdas combinadas y fórmulas con caché. Confirmado, no asumido:

- 9 hojas: `Ficha_Jerarquia`, `Valores`, `Clas_AT`, `DPA`, `Jerarquia`, `Calculos`,
  `RESUMEN DE RESULTADOS`, `ficha_Accesibilidad`, **`Validación-GAD`** (esta última no estaba
  en el enunciado original, pero existe en el archivo y tiene tabla propia en la base:
  `validaciones_gad`).
- Todas las celdas de referencia que se me dieron coinciden exactamente: `B6`="Santuario del
  Guayco", `B8`/`I8`/`P8` = categoría/tipo/subtipo, `B11`/`I11`/`P11` = provincia/cantón/
  parroquia, `B15`/`I15`/`P15` = lat/long/altura, `F17..P19` = administrador, `B62:O66` = 5
  cooperativas, `B300` = descripción, firmas en E/L/S filas 325-331, código en `F2:V2` (fórmulas
  `INDEX/MATCH` contra las hojas ocultas `DPA` y `Clas_AT`).
- El total de `RESUMEN DE RESULTADOS!E12` (`=SUM(E3:E11)`) da **56.2**, igual al valor esperado
  en la tarea. Los 9 criterios A–I y sus ponderaciones (18,18,14,14,10,9,7,5,5) coinciden
  exactamente con la tabla `criterios_valoracion` de la base (ver 2.2).

### 2.2 La base de datos (evidencia)

Con acceso de lectura a `central-db` (producción, usuario ya usado en la sesión de análisis
previa) inspeccioné `information_schema` para 135 tablas. Confirmado:

- Hay una tabla dedicada por cada bloque normativo de la ficha: `administraciones_atractivo`,
  `caracteristicas_climaticas`, `ingresos_centro_turistico`, `vias_acceso_terrestre`,
  `accesos_acuaticos`, `accesos_aereos`, `centro_tipos_transporte`, `detalles_transporte`,
  `centro_accesibilidad_resumen`, `senalizaciones_aproximacion`, `planta_turistica_centro`,
  `servicios_complementarios_centro`, `evaluaciones_conservacion` +
  `evaluacion_factores_alteracion`, `declaratorias_turisticas`, `servicios_basicos_centro`,
  `senaletica_centro`, `servicios_salud_centro`, `servicios_seguridad_centro`,
  `comunicaciones_centro`, `radios_portatiles_centro`, `amenazas_centro`,
  `planes_contingencia`, `preguntas_politica`/`respuestas_politica_centro`,
  `actividades_centro_turistico`, `promocion_centro_turistico` +
  `medios_promocion_centro_turistico`, `registros_visitantes`, `afluencia_visitantes`,
  `procedencias_visitantes`, `temporadas_visitacion`, `informantes_clave`,
  `formacion_personal_centro`/`resumen_recurso_humano`, `archivos_centro_turistico`,
  `responsables_ficha`, `validaciones_gad`.
- La hoja `ficha_Accesibilidad` tiene su propio par de tablas: `criterios_accesibilidad` +
  `respuestas_accesibilidad` (una fila por criterio, `cumple: boolean`) y
  `levantamientos_accesibilidad` (metadatos: fecha, hora inicio/fin, responsable, firma).
  **Esto es distinto** del bloque 4.4 de `Ficha_Jerarquia` (accesibilidad general), que va a
  `centro_accesibilidad_resumen`.
- El puntaje y la jerarquía ya se calculan del lado de la base/API: `criterios_valoracion`
  (A–I, mismos nombres y pesos que el Excel), `indicadores_valoracion`,
  `resultados_criterio`, `resultados_indicador`, y `centros_turisticos.puntaje_total` /
  `jerarquia_id` (nullable). **Conclusión importante:** el importador no debe escribir el
  total `56.2` del Excel en ningún campo; debe importar las respuestas base y dejar que el
  motor de valoración ya existente en la API recalcule el puntaje. El total del Excel solo
  sirve como advertencia informativa de cotejo ("el Excel reporta 56.2, verifica que el panel
  calcule algo similar tras revisar").
- `borradores_centros_turisticos.datos` (`jsonb`) y `revisiones_publicacion.datos_propuestos`
  (`jsonb`) confirman que el flujo de borrador/revisión ya está pensado para mover un blob de
  datos antes de normalizarlo en las tablas hijas — es el mismo patrón que debe seguir la
  importación (poblar el borrador vía los endpoints existentes, nunca las tablas hijas
  directo).

### 2.3 La app (evidencia)

- El formulario vive en `src/components/admin/center-editor.tsx` (paso "Identificación y
  clasificación" + "Ubicación") y `src/components/admin/center-section-workflow.tsx` (6843
  líneas; el resto de los 14 pasos). No hay Zod ni ningún resolver de validación instalado
  (`grep` sin resultados) — la validación actual es manual con las reglas de
  `react-hook-form` (`register(name, { required, maxLength })`). Zod sería una dependencia
  nueva, no un reemplazo de algo existente.
- `src/lib/admin-api.ts` expone `type CenterDraft` con campos **tipados** solo para:
  `name`, `subtypeId`, `touristZoneId`, `parishId`, `productLineId`, `scenarioId`,
  `hierarchyId`, `latitude`, `longitude`, `altitudeMeters`, `description`, `address{...}`,
  `administration{...}`, `climate{...}`, `admission{...}`, `activities[]`,
  `accessibility[]`, `facilities[]`. **El resto de las 14 secciones (planta, conservación,
  higiene-seguridad, políticas, promoción, visitantes, recurso humano, anexos, y el detalle
  fino de accesibilidad/vías) viaja como JSON genérico** por sección:
  `sections: Partial<Record<AdminCenterSectionCode, Record<string, unknown>>>`, que se guarda
  con `saveAdminCenterSection(token, code, sectionCode, content, version)`.
- **Forma exacta del `content` de las 8 secciones genéricas — ahora confirmada** leyendo
  directamente los tipos y el armado del payload en `center-section-workflow.tsx` (tipos en
  líneas 260-480, armado del `content` en líneas 5427-5660). Detalle completo en la nueva
  sección 3.1. Confirmé también que `politicas` usa códigos como `PLAN_DESARROLLO_GAD`,
  `PLANIFICACION_TERRITORIAL`, `REGULACIONES_APLICABLES`, `ORDENANZAS_APLICABLES`, que
  coinciden con `preguntas_politica.codigo`.
- Hallazgo adicional relevante: las respuestas tipo SI/NO en toda la app usan un enum de
  **cuatro** valores, no un booleano: `SectionResponse = "SI" | "NO" | "SIN_INFORMACION" |
  "NO_APLICA"` (`center-section-workflow.tsx:51-58`). Esto encaja con algo que ya había visto
  en el Excel pero no había interpretado bien: los encabezados de casi todas las secciones
  (`Q38=SI S38=NO U38=S/I`, y lo mismo en filas 73/127/155/224/233/258/274/292) no son
  decoración — "S/I" (Sin información) es un tercer estado real por pregunta, que mapea
  directo a `SIN_INFORMACION`. El importador debe distinguir tres/cuatro estados, no
  simplemente `true`/`false`/`null`, en cualquier bloque de la ficha que declare esa cabecera
  SI/NO/S-I.
- Los 14 códigos de sección (`identificacion`, `ubicacion-admin`, `caracteristicas`,
  `accesibilidad`, `planta`, `conservacion`, `higiene-seguridad`, `politicas`, `actividades`,
  `promocion`, `visitantes`, `recurso-humano`, `descripcion`, `anexos`) están definidos en
  `center-section-workflow.tsx:68-181` y corresponden 1:1 al orden de las secciones 1–14 de la
  ficha (identificación+ubicación cubren las secciones 1 y 2 del PDF).
- Botón "Importar ficha": debe ir en `center-editor.tsx`, junto al encabezado del paso
  "Identificación y clasificación" (donde hoy está el botón "Nueva ficha" en
  `admin-shell.tsx`), visible solo cuando `code` es `null` (ficha nueva) o cuando `canEdit` es
  verdadero. La precarga se hace con `reset(mapearFichaAFormulario(datos))` de
  `react-hook-form`, más `saveAdminCenterSection` por cada sección genérica una vez que el
  usuario confirma.

### 2.4 Checkboxes — sin verificar (un solo archivo no alcanza para concluir)

Abrí el `.xlsm` como zip y esto es lo que puedo afirmar **solo sobre este archivo puntual**:

- **No existe `xl/ctrlProps/`, ni `xl/drawings/vmlDrawing*.vml`, ni `<legacyDrawing>` en
  `sheet1.xml`, ni referencias a `oleObject`/`activeX` en ningún archivo del paquete.** En
  *este* archivo no hay ningún control de formulario real, solo celdas de texto con borde.
- El patrón geométrico en *este* archivo es consistente: cada opción es una celda combinada
  con la etiqueta (ej. `B25:G25` = "a. Cultura") seguida de **una celda simple sin combinar**
  inmediatamente a la derecha (`H25`), que sería la "casilla". Verifiqué el mismo patrón en
  `D31`/`M225`/`O225`/`O226`, etc.
- Encontré dos casos marcados con la letra `x` (minúscula) como texto plano: `T171` y `T177`
  (columna "Estado: Bueno" de la tabla de señalética). En `ficha_Accesibilidad`, columnas fijas
  `K`="SI"/`L`="NO", también con `x` (a veces con espacios delante, ej. `"            x"`).

**Por qué esto NO es una conclusión sobre cómo se comportan los archivos de Excel en
general:** con un solo archivo no puedo distinguir "así se marca siempre" de "así quedó marcado
(o se perdió la marca) en este archivo particular". Y hay evidencia de que sí se perdió algo:
la categoría de este atractivo es `MANIFESTACIONES_CULTURALES` y toda la descripción (`B300`)
habla de un santuario religioso — la línea de producto "a. Cultura" (`H25`) debería estar
marcada, y está vacía. Es decir, **incluso en este archivo que no pasó por Google Drive, al
menos una marca que lógicamente debería existir no está**. No sé si la plantilla la pierde al
guardar, si quien llenó la ficha no marcó la casilla, o si el mecanismo real de marcado es otro
que no se refleja en este archivo. Con un solo caso no puedo descartar ninguna de las tres.

**Queda como "no verificado", con esta regla de trabajo mientras tanto:** el parser lee la
celda-casilla (texto plano) y la considera marcada solo si su valor, normalizado
(`trim().toLowerCase()`), es exactamente `"x"`; en cualquier otro caso (vacío, espacios,
cualquier otra cosa) devuelve `null` ("sin dato"), nunca `false` — un checkbox vacío no
significa "no". Esto es una regla de lectura defensiva, no una confirmación de que así se
marcan los checkboxes en archivos reales guardados desde Excel. **Antes de dar esto por
validado necesitamos una ficha original (idealmente de Excel en Windows, sin pasar por Google
Drive ni por una conversión previa) donde sepamos de antemano qué casillas deberían estar
marcadas**, para comparar contra lo que el parser lee. Hasta entonces, el algoritmo de
detección de la posición de cada casilla (celda inmediatamente a la derecha del último rango
combinado de cada etiqueta, calculado desde `mergeCells`) también queda sin confirmar contra un
segundo archivo — solo lo verifiqué en este.

## 3. Mapa ficha → base (confirmado contra el archivo real y el esquema real)

Tabla no exhaustiva de las ~150 casillas de las secciones tipo (U)/(M) — esas siguen la regla
general de la sección 2.4. Se listan los campos escalares/tabulares confirmados uno por uno.

| Celda(s) | Campo JSON (borrador) | Tabla.columna | Tipo | Regla de limpieza |
|---|---|---|---|---|
| `B6` | `nombre` | `centros_turisticos.nombre` | texto | trim; placeholder `"texto"` → `null` |
| `B8` | `categoria` (código) | `categorias_atractivo.nombre` (resuelto a id) | texto→id | `upper(unaccent()).replace('_',' ')` y buscar por nombre |
| `I8` | `tipo` | `tipos_atractivo.nombre` (resuelto a id, filtrado por `categoria_id`) | texto→id | igual, **scoped** por categoría ya resuelta |
| `P8` | `subtipo` | `subtipos_atractivo.nombre` (resuelto a id, filtrado por `tipo_id`) | texto→id | igual, scoped por tipo |
| `B11` | `provincia` | `provincias.nombre` → id | texto→id | `upper(unaccent())`; `"BOLIVAR"` → `"Bolívar"` |
| `I11` | `canton` | `cantones.nombre` → id | texto→id | igual, **scoped** por provincia |
| `P11` | `parroquia` | `parroquias.nombre` → id | texto→id | igual, **scoped por cantón obligatorio** — ver brecha, hay colisión real (`Magdalena (chapacoto)` vs `La Magdalena`, ids 105 y 1016, en cantones distintos) |
| `B13` | `barrioSectorComuna` | `centros_turisticos.barrio_sector_comuna` | texto | trim; `"texto"` → `null` |
| `I13`/`N13`/`R13` | `callePrincipal`/`numero`/`transversal` | `centros_turisticos.calle_principal`/`numero_direccion`/`calle_transversal` | texto | `"S/N"` es válido, no placeholder; `"texto"` → `null` |
| `B15` | `latitud` | `centros_turisticos.latitud` | decimal | aceptar `-1.67041`, `  -79.06123`, `-1,58830`; rechazar con advertencia `.1.68050   -79. 02921` o `-1678955`; rango Ecuador lat −5.1..1.7 |
| `I15` | `longitud` | `centros_turisticos.longitud` | decimal | igual; rango lng −92.1..−75.1 |
| `P15` | `altitudMsnm` | `centros_turisticos.altitud_msnm` | entero | si viene como texto con punto de miles (`"2.679"`), interpretar como 2679, no 2.679 |
| `F17`/`P17`/`F18`/`P18`/`F19`/`P19` | `administracion.tipo/institucion/nombre/cargo/telefono/email` | `administraciones_atractivo.tipo_administrador/institucion/nombre_administrador/cargo/num_celular/email` | texto | trim; `"texto"` → `null` |
| `D23`/`N23`/`U23` | `clima.tipo`/`temperatura`/`precipitacion` | `caracteristicas_climaticas.tipo_clima_id` (resuelto)/`temperatura_min_c,max_c`/`precipitacion_min_mm,max_mm` | texto/rango | `"14 - 16"` → `min=14,max=16`; clima por nombre — **catálogo casi vacío, ver brechas** |
| `B25`/`I25`/`P25` + casillas | `lineaProducto` (Cultura/Naturaleza/Aventura) | `lineas_producto.nombre` → `centros_turisticos.linea_producto_id` | checkbox único | (U) = única selección esperada; si hay 0 o >1 marcadas, advertencia |
| `B27..S27` + casillas | `escenario` | `escenarios.nombre` → `centros_turisticos.escenario_id` | checkbox único | igual que línea de producto |
| Tabla filas 29-36 | `ingreso.tipo/horario/atencion/reservas/formaPago/precio/meses` | `ingresos_centro_turistico.*` + `centro_formas_pago` + `centro_meses_recomendados` | mixto | horas como fracción de día (`0.333…`→`08:00`); `"0"` en horas placeholder → `null`, pero `0` en conteos es válido |
| `B39`/`F40`/`H40`/`R40`/`U40` | `accesibilidad.ciudadCercana/distanciaKm/tiempoAuto/coordenadas` | vínculo a `localidades` (para resolver `zona_turistica_id`, ver brecha ya conocida) | texto/decimal/tiempo | tiempo `8.3333E-3` día → convertir a horas/min |
| `B43:U46` | `vias.terrestre[]` (primer/segundo/tercer orden) | `vias_acceso_terrestre` (una fila por orden con dato) | tabla | coordenadas rotas como `.1.68050   -79. 02921` → advertencia, no insertar |
| `B48:T53` | `vias.acuatico`/`aereo` | `accesos_acuaticos`/`accesos_aereos` | tabla | solo filas con dato |
| `B55:S57` + casillas | `transporte.tipos[]` | `centro_tipos_transporte` (M2M a `tipos_transporte`) | checkbox múltiple | — |
| `B62:O66` | `transporte.detalle[]` (cooperativa/estación/frecuencia/detalle) | `detalles_transporte` (`operador_cooperativa` es texto libre, **no** FK a `cooperativas_transporte`) | tabla, 5 filas con dato en el ejemplo | solo filas no vacías; frecuencia por casillas Diaria/Semanal/Mensual/Eventual |
| `B68` + casillas | `accesibilidadGeneral` (General/Física/Visual/Auditiva/Intelectual/No accesible) | `centro_accesibilidad_resumen` (una fila por tipo con `aplica`) | checkbox múltiple | distinto de la hoja `ficha_Accesibilidad` |
| `B71/K71` | `senalizacionAproximacion.estado` | `senalizaciones_aproximacion.estado_condicion_id` | checkbox único (Bueno/Regular/Malo) | — |
| Filas 76-100 | `plantaTuristica[]` (alojamiento/A&B/agencias/guías) | `planta_turistica_centro` (una fila por `tipo_planta_turistica_id` × ámbito atractivo/ciudad) | tabla numérica | `0` es válido y se conserva |
| Filas 104-119 | `facilidadesEntorno[]` | `facilidades_centro` | tabla | cantidad, coordenadas (aceptar formatos con comas/espacios rotos, ej. fila 110/117), administrador, accesibilidad universal, estado |
| Filas 123-126 | `complementarios[]` | `servicios_complementarios_centro` | checkbox múltiple + texto | — |
| `B129` + casillas, `B132-138` | `conservacion.atractivo.estado/factores` | `evaluaciones_conservacion` (`componente_conservacion_id`=Atractivo) + `evaluacion_factores_alteracion` | checkbox único + múltiple | — |
| `B141` + casillas, `B144-150` | `conservacion.entorno.estado/factores` | igual, `componente_conservacion_id`=Entorno | | — |
| `B153` | `declaratoria` | `declaratorias_turisticas` | texto/fecha | `"texto"` → `null`; sin declaratoria → no crear fila |
| Filas 158-165 | `serviciosBasicos[]` (agua/energía/saneamiento/desechos × atractivo/ciudad) | `servicios_basicos_centro` | tabla | — |
| Filas 168-193 | `senaletica[]` (ambiente×tipo×material×estado) | `senaletica_centro` | tabla + checkbox estado (B/R/M, confirmado `"x"` real en `T171`/`T177`) | — |
| Filas 197-201 | `salud[]` | `servicios_salud_centro` | tabla numérica | `0` válido |
| Filas 204-207 | `seguridad[]` | `servicios_seguridad_centro` | texto/checkbox | — |
| Filas 211-218 | `comunicacion[]`, `radioPortatil` | `comunicaciones_centro`, `radios_portatiles_centro` | checkbox múltiple | — |
| `B220-223` | `multiamenazas[]`, `planContingencia` | `amenazas_centro`, `planes_contingencia` | checkbox múltiple + texto/fecha | año como número, no fecha completa |
| `B225-232` | `politicas[]` (a-d, SI/NO) | `preguntas_politica`/`respuestas_politica_centro` (`respuesta: boolean`) | checkbox SI/NO + texto | confirmé códigos `PLAN_DESARROLLO_GAD` etc. en el frontend |
| `B236-256` | `actividades[]` | `actividades_centro_turistico` → `actividades_turisticas`/`grupos_actividad` | checkbox múltiple, ~50 opciones | ya existe campo tipado `CenterDraft.activities[]` |
| `B263-273` | `promocion.medios[]`, `paquete` | `medios_promocion_centro_turistico`, `promocion_centro_turistico` | tabla + checkbox SI/NO | `"Ninguna"` en periodicidad es dato válido, no placeholder |
| `B276-291` | `visitantes.*` | `registros_visitantes`, `afluencia_visitantes`, `procedencias_visitantes`, `temporadas_visitacion`, `informantes_clave` | mixto | — |
| `B293-297` | `recursoHumano.*` | `resumen_recurso_humano`, `formacion_personal_centro` | tabla numérica | `0` válido |
| `B300` | `descripcion` | `centros_turisticos.descripcion` | texto (≤500) | — |
| Imágenes filas ~304/313 | `anexos.fotos[]`, `anexos.mapa` | `archivos_centro_turistico` | binario | ofrecer, no guardar automático |
| `E325-E329`, fecha `E331` | `responsableElaborado` | `responsables_ficha` (`tipo_responsabilidad_ficha_id`="ELABORADO") | texto + fecha serial | serial Excel `46164` → `2026-05-22`, confirmado con conversión real |
| `I325.../P325...` | `responsableValidado`/`Aprobado` | igual, otros `tipo_responsabilidad_ficha_id` | | en este ejemplo están vacíos — es válido, ficha aún no validada/aprobada |
| Hoja `ficha_Accesibilidad`, col K/L por fila | `accesibilidadDetalle[]` | `criterios_accesibilidad`/`respuestas_accesibilidad` (`cumple: boolean`) | tabla | agrupado por sección (fija en col A como encabezado de grupo) |
| `ficha_Accesibilidad!A71-73` | `levantamiento.responsable/hora` | `levantamientos_accesibilidad` | texto/hora | — |
| `RESUMEN!E3:E12` | *(solo informativo, no se guarda)* | — | decimal | mostrar como advertencia de cotejo contra el cálculo real de la API |

### 3.1 Forma confirmada del `content` de las 8 secciones genéricas

Confirmado leyendo `center-section-workflow.tsx` (tipos y armado real del payload, no
inferido). `mapearFichaAFormulario` debe producir exactamente estas formas para
`saveAdminCenterSection(token, code, sectionCode, content, version)`:

| `sectionCode` | Forma de `content` | Enums confirmados |
|---|---|---|
| `planta` | `{ plant: [{scope, typeId, typeLabel, group, quantity1, quantity2, quantity3, observation}], facilitiesDetails: [{categoryId, typeId, typeLabel, quantity, latitude, longitude, administrator, universalAccessibility, conditionId, detailOther, observation}], complementaryServices: [{scope, typeId, typeLabel, specification, observation}] }` | `scope: "EN_ATRACTIVO" \| "EN_POBLADO_CERCANO"` |
| `conservacion` | `{ conservation: { attraction: {state, observation}, environment: {state, observation}, factors: [{component, factorId, origin, name, response, detailOther, observation}] }, declarations: [{entity, denomination, date, scope, observation}] }` | `component: "ATRACTIVO" \| "ENTORNO"`; `origin: "NATURAL" \| "ANTROPICO"` |
| `higiene-seguridad` | `{ hygieneSafety: { entries: [{kind, scope, typeId, name, provider, secondaryId, secondary, response, quantity, condition, observation}], radios: {available, visitorUse, internalUse, emergencyUse, quantity, observation}, contingency: {exists, institution, document, year, observation} } }` | `kind: "BASIC_SERVICE" \| "SIGNAGE" \| "HEALTH" \| "SECURITY" \| "COMMUNICATION" \| "THREAT"` (une en una sola lista lo que en la base son 6 tablas: `servicios_basicos_centro`, `senaletica_centro`, `servicios_salud_centro`, `servicios_seguridad_centro`, `comunicaciones_centro`, `amenazas_centro`); `condition: "BUENO" \| "REGULAR" \| "MALO" \| ""` |
| `politicas` | `{ policies: [{code, question, response, year, specification, observation}] }` | `code` = uno de `preguntas_politica.codigo` (ej. `PLAN_DESARROLLO_GAD`) |
| `promocion` | `{ promotion: { hasPlan, planName, includedInPlan, partOfPackage, packageDetail, observation, media: [{response, typeId, name, url, periodicity, detailOther, observation}] } }` | — |
| `visitantes` | `{ visitors: { registry: {exists, type, years, reports, frequency, observation}, seasons: [{type, quantity, year, months, observation}], origins: [{type, place, month, year, quantity, observation}], informants: [{name, contact, observation}], influx: {weekday, weekend, holidays, frequency, observation} } }` | `registry.type: "DIGITAL" \| "PAPEL" \| ""`; `seasons.type: "ALTA" \| "BAJA"`; `origins.type: "NACIONAL" \| "EXTRANJERA"`; `influx.frequency: "PERMANENTE" \| "ESTACIONAL" \| "ESPORADICA" \| "INEXISTENTE" \| ""` |
| `recurso-humano` | `{ humanResources: { summary: {administrationOperation, specializedTourism, observation}, training: [{group, typeId, name, quantity, detailOther, observation}] } }` | `group: "EDUCACION" \| "CAPACITACION" \| "IDIOMA"` |
| `anexos` | `{ annexes: { documents: [{fileId, type, source, author, description, visibility, observation}], responsibles: [{typeId, name, role, institution, phone, email, observation}], accessibilitySurvey: {date, responsible, scope, observation}, gadValidation: {acceptance, name, institution, position, phone, email, date, observation} } }` | `visibility: "PUBLICA" \| "ADMINISTRATIVA" \| "RESTRINGIDA"`; `gadValidation` mapea 1:1 con la tabla `validaciones_gad` y con la hoja `Validación-GAD` del Excel |

Todo campo tipado `SectionResponse` en las tablas de arriba acepta los cuatro valores de la
nota de la sección 2.3 (`SI`/`NO`/`SIN_INFORMACION`/`NO_APLICA`), no un booleano.

Con esto, las filas de la tabla de la sección 3 correspondientes a estas 8 secciones (planta,
facilidades, complementarios, conservación, higiene/salud/seguridad/comunicación/amenazas,
políticas, promoción, visitantes, recurso humano, anexos) deben producir el `content` de esta
tabla en vez de los nombres provisionales usados más arriba (`plantaTuristica[]`,
`serviciosBasicos[]`, etc., que eran nombres de trabajo, no la forma real).

## 4. Brechas

**Campos de la ficha sin columna 1:1 en la base:**
- Ninguno detectado de fondo — el esquema es notablemente completo. Las 8 secciones sin tipo
  propio en `CenterDraft` (planta, conservación, higiene, políticas, promoción, visitantes,
  recurso humano, anexos) sí tienen forma confirmada del lado del frontend (sección 3.1); lo
  que no tiene columna directa es el enum de 4 estados `SectionResponse` de esas secciones —
  la base solo tiene `boolean` en la mayoría de las tablas hijas (`respuesta`, `presente`,
  `cumple`, `aplica`), no un cuarto estado explícito para "sin información". La API decidirá
  cómo persiste `SIN_INFORMACION`/`NO_APLICA` (¿como `null`? ¿deja la fila sin crear?) — el
  importador solo necesita producir el valor correcto del enum; cómo lo guarda la API después
  no es responsabilidad de este parser.

**Campos de la base que la ficha no cubre:**
- `rutas_transporte`, `rutas_transporte_versiones`, `ruta_paradas`, `paradas_transporte`,
  `horarios_ruta`, `cooperativas_transporte` (catálogo maestro): son para el sistema de rutas
  navegables de la app móvil, no para la ficha MINTUR. El importador no debe tocarlos; la
  ficha solo llena `detalles_transporte` (texto libre).
- `resultados_criterio`, `resultados_indicador`, `centros_turisticos.puntaje_total`/
  `jerarquia_id`: los calcula la API a partir de las respuestas, no se importan del Excel.

**Catálogos que no coinciden textualmente (normalizar `upper(unaccent(replace(_,' ')))`):**
- `"BOLIVAR"` → `"Bolívar"`, `"ARQUITECTURA"` → `"Arquitectura"`,
  `"MANIFESTACIONES_CULTURALES"` → `"Manifestaciones culturales"` (guion bajo → espacio),
  `"MAGDALENA (CHAPACOTO)"` → `"Magdalena (chapacoto)"`. Confirmado por consulta directa.
- **Riesgo real de colisión de parroquia:** existen `id=105 "Magdalena (chapacoto)"` (cantón
  Chimbo, el correcto) e `id=1016 "La Magdalena"` (cantón Quito). Una búsqueda de parroquia
  que no filtre primero por el cantón ya resuelto puede reventar en cualquier ficha con
  nombres de parroquia ambiguos. **Regla obligatoria:** resolver provincia → cantón →
  parroquia en ese orden, cada paso acotando la búsqueda del siguiente; nunca buscar
  parroquia por nombre global.
- **`catalogo_clima` tiene una sola fila de producción**, literalmente marcada como demo:
  `codigo='TEMPLADO_ANDINO_DEMO'`, `nombre='Templado andino (referencial demo)'`. Cualquier
  clima real de una ficha (`Templado`, `Cálido húmedo`, etc.) **no va a encontrar
  coincidencia** hasta que alguien pueble este catálogo — no es un problema del importador,
  es un catálogo de base sin poblar, igual al caso de `zonas_turisticas` que ya se discutió en
  esta conversación. Sin esto arreglado, el campo "Clima" quedará en advertencia para
  prácticamente el 100% de las fichas.
- `zonas_turisticas`: recordatorio de lo ya visto — el campo `touristZoneId` sigue siendo
  obligatorio para crear cualquier ficha y no tiene fuente directa en el Excel/PDF de MINTUR
  (es un catálogo interno del sistema, no del estándar). El importador no puede resolverlo
  solo; debe dejarlo para que el usuario lo elija manualmente tras la localidad más cercana
  (campo 4.a), con advertencia si esa localidad no tiene zonas creadas.

## 5. Cambios propuestos

**Nuevas dependencias:**
- `exceljs` (lectura de `.xlsx`/`.xlsm` en servidor). No usar `xlsx` (vulnerabilidad conocida
  en 0.18.5, prototype pollution con archivos no confiables).
- `zod` (validación del JSON extraído antes de precargar el formulario). No hay resolver de
  formularios instalado hoy; se usaría solo para validar la salida del parser, no para
  reescribir la validación existente de `react-hook-form`.

**Archivos nuevos:**
- `src/lib/ficha/parser.ts` — `parsearFicha(buffer): { datos, advertencias, imagenes }`.
- `src/lib/ficha/mapeo-catalogos.ts` — normalización y resolución de catálogos (provincia→
  cantón→parroquia scoped, categoría→tipo→subtipo scoped, clima, línea de producto, etc.),
  cada uno devolviendo `{ id }` o `{ advertencia }`.
- `src/lib/ficha/checkbox.ts` — utilidad genérica: dado el rango de celdas combinadas de una
  sección y las coordenadas de excepción confirmadas, devuelve el valor de cada casilla
  (`true`/`false`/`null`).
- `src/lib/ficha/mapear-formulario.ts` — `mapearFichaAFormulario(datos)`, salida con la forma
  exacta de `FormValues` de `center-editor.tsx` + `content` por sección para
  `saveAdminCenterSection`.
- `src/app/api/admin/centers/import/route.ts` (Route Handler de Next.js): recibe el archivo,
  valida, llama a `parsearFicha`, y para resolver catálogos usa el mismo patrón de
  `src/lib/admin-api.ts` (llama a la API NestJS con el token de la sesión — probablemente
  reutilizando `getAdminCatalogs` o un fetch equivalente del lado servidor). No consulta
  Postgres directamente, conforme a `AGENTS.md`.
- `tests/fixtures/santuario-del-guayco.xlsm` (copia del archivo de referencia — **no se copia
  hasta que se apruebe este documento**, según la instrucción de no tocar más archivos).

**Archivos modificados:**
- `src/components/admin/center-editor.tsx`: botón "Importar ficha (.xlsx / .xlsm)" en el
  encabezado del primer paso, y `reset(mapearFichaAFormulario(datos))`.
- Zona de advertencias reutilizando `ContentState`/`Alert` ya existentes en
  `src/components/ui/`.

**Schema/migraciones:** ninguna propuesta. El esquema ya cubre la ficha.

## 6. Flujo

1. Usuario hace clic en "Importar ficha" → selector de archivo (`.xlsx`/`.xlsm`, ≤20 MB).
2. El archivo se envía al endpoint de subida. El servidor valida: extensión, tamaño, que sea
   OOXML válido, que exista la hoja `Ficha_Jerarquia` y que `B1` contenga "JERARQUIZACIÓN" y
   `B5` sea "1.1 Nombre del Atractivo Turístico" (detección de versión de plantilla).
3. `parsearFicha(buffer)` extrae valores crudos + resuelve catálogos + valida coordenadas →
   devuelve `{ datos, advertencias, imagenes }`. **No escribe nada en la base.**
4. El cliente recibe la respuesta y llama a `mapearFichaAFormulario(datos)`.
5. `reset(...)` precarga el formulario; se listan las advertencias (catálogo sin
   coincidencia, coordenada inválida, checkbox sin dato) en un panel visible antes de que el
   usuario pueda continuar.
6. El usuario revisa, corrige lo marcado, y guarda con el flujo normal (borrador → enviar a
   revisión → publicar) — exactamente el mismo camino que si hubiera llenado el formulario a
   mano.
7. Las imágenes detectadas se muestran como sugerencias de anexo; el usuario decide subirlas o
   no mediante el flujo de medios ya existente (`media-manager.tsx`).

## 7. Riesgos y limitaciones

- **El mecanismo de marcado de checkboxes no está verificado (ver 2.4).** Solo se probó con un
  archivo, que además tiene al menos una marca ausente donde lógicamente debería estar
  presente. El parser y la UI deben tratar cualquier casilla vacía como "sin dato", no como
  "no", y no se puede dar por cerrado este punto hasta probar con una segunda ficha real de
  procedencia distinta.
- **Catálogos de clima y zona turística insuficientes en producción** bloquean la utilidad
  práctica de la importación hasta que se pueblen (independiente de este desarrollo).
- **Ambigüedad de parroquia** si no se aplica el scoping provincia→cantón→parroquia de forma
  estricta.
- **Coordenadas rotas son comunes** en captura manual (ejemplos reales encontrados:
  `.1.68050   -79. 02921`, `-1,684153,-79,027298         -1678955, -79,027518`). El parser
  debe ser tolerante y advertir, no fallar todo el import por un campo.
- **Versiones de plantilla:** solo se validó contra una ficha (Santuario del Guayco). No hay
  evidencia todavía de cómo se comporta el parser con una ficha guardada desde Excel de
  Windows, ni con una plantilla de un año distinto a 2017.
- Todo el análisis de base de datos se hizo contra **producción** con un usuario que no es de
  solo lectura (mismo usuario `turismo_vinculacion_app` ya usado en esta sesión); no se
  ejecutó ninguna escritura, pero conviene que la Fase 2 use credenciales de solo lectura para
  cualquier verificación adicional.

## 8. Plan de pruebas y orden de implementación

**Pruebas del parser (contra la ficha de ejemplo):**
1. `nombre` = "Santuario del Guayco", código = concatenación de `F2:V2`.
2. `latitud` = −1.67041, `longitud` = −79.06123, `altitud` = 2138.
3. 5 filas en `transporte.detalle` (cooperativas).
4. Total informativo de `RESUMEN!E12` = 56.2 (solo como dato de advertencia, no persistido).
5. Checkbox `senaletica` fila 171 y 177 → `true`; el resto de casillas de esa tabla → `null`.
6. `ficha_Accesibilidad`: fila 8 (`Estacionamiento`) → `SI`; fila 9 en adelante → `NO`.

**Casos de error:**
- `.xls`, `.ods` → mensaje "guárdalo como .xlsx".
- Archivo `.xlsx` que no es la ficha (falta hoja `Ficha_Jerarquia` o `B1` no dice
  "JERARQUIZACIÓN").
- Archivo vacío o corrupto (zip inválido).
- Coordenada rota (`.1.68050   -79. 02921`) → advertencia, no excepción.

**Orden sugerido:**
1. `src/lib/ficha/checkbox.ts` (utilidad genérica de merge+casilla) con tests unitarios contra
   `xl/worksheets/sheet1.xml` extraído de la fixture.
2. `src/lib/ficha/parser.ts` (lectura cruda con exceljs) + tests de la sección 8.
3. `src/lib/ficha/mapeo-catalogos.ts` (normalización y resolución, con los casos de colisión
   documentados) contra una copia de solo lectura de los catálogos reales o fixtures.
4. `mapearFichaAFormulario` + endpoint de subida.
5. UI: botón, precarga, panel de advertencias.
6. Pruebas manuales end-to-end con la ficha de ejemplo en el panel real.

## 9. Preguntas abiertas

Resueltas: dónde vive el endpoint (Route Handler en este repo) y la forma del `content` de las
8 secciones genéricas (confirmada en 3.1) — ver "Decisiones ya tomadas" al inicio. Quedan
pendientes:

1. **¿Quién puebla `catalogo_clima` y agrega las `zonas_turisticas` faltantes?** Sin esto,
   buena parte de las fichas importadas van a salir con advertencias de catálogo casi
   garantizadas. ¿Lo coordinamos aparte, o bloqueamos el inicio de la Fase 2 hasta que esté
   resuelto?
2. **¿Hay más fichas reales disponibles**, idealmente una guardada desde Excel en Windows y
   con procedencia conocida (que sepamos de antemano qué casillas deberían quedar marcadas)?
   Esto es lo que falta para cerrar el punto 2.4 (checkboxes): con un solo archivo —además
   generado aparentemente en macOS, la fuente `Helvetica Neue` lo sugiere— no puedo confirmar
   si el mecanismo de marcado (`"x"` en la celda contigua a la etiqueta) es general o si en
   este caso puntual se perdieron marcas. Es el bloqueo principal antes de dar por cerrada la
   Fase 1 en ese punto.
3. **¿Cómo debe persistir la API los estados `SIN_INFORMACION`/`NO_APLICA`** del enum
   `SectionResponse` en las tablas hijas que hoy solo tienen columnas `boolean`
   (`respuesta`, `presente`, `cumple`, `aplica`)? El importador puede producir el valor
   correcto del enum a partir del "S/I" del Excel; cómo se traduce a la base es decisión de
   quien mantiene la API.
4. Las imágenes (`xl/media/image1-5.png`) están ancladas por `drawing1.xml`/`drawing2.xml`
   (2 fotos, mapa, y una imagen adicional). ¿El botón de importación debe sugerir las 3-4
   imágenes automáticamente, o solo las que superen cierto tamaño mínimo (para descartar
   logos/decoración de plantilla)?
