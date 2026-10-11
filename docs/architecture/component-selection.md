# Elegir controles con MUI

La intención decide el control. Evaluar cantidad de opciones, precisión,
frecuencia, riesgo, teclado, móvil y patrón ya establecido.

| Necesidad                                  | Elección del portal o primitiva MUI                                   |
| ------------------------------------------ | --------------------------------------------------------------------- |
| Texto libre o valor exacto                 | Campos RHF compartidos sobre TextField                                |
| Dos o pocas opciones que conviene comparar | RadioGroup o ToggleButtonGroup si el flujo lo necesita                |
| Catálogo corto                             | CatalogSelect o RhfCatalogSelect                                      |
| Catálogo grande o etiquetas parecidas      | CatalogAutocomplete con búsqueda y label contextual                   |
| Relación territorial o clasificación       | Selectores dependientes, con valores incompatibles limpiados          |
| Estado controlado                          | Opciones del contrato y StatusBadge para lectura                      |
| Coordenada exacta                          | CoordinateFieldset y selector MapLibre                                |
| Decisión sobre una propuesta               | ReviewDecisionDialog                                                  |
| Acción de fila                             | RecordActionsMenu con foco y nombres accesibles                       |
| Archivo de ficha                           | Flujo de importación con formato y límites explicados antes de elegir |

Para una configuración inmediata, Switch comunica efecto inmediato. Para valores
que se envían al guardar, preferir Checkbox al diseñar un nuevo flujo. El catastro
actual tiene un Switch que se aplica al guardar: conservar y explicar su semántica
hasta un cambio de UI específico; no convertirlo en una mutación inmediata.

Una cantidad exacta no necesita Slider. Usarlo solo para valores aproximados
acotados. Un stepper resulta útil si los incrementos son pequeños y frecuentes;
no crear un componente nuevo solo por aparecer en el inventario de la plantilla.

## Acciones

Primaria: Button `contained`. Secundaria: `outlined` o variante existente del tema.
Cancelar: `text`. Destructiva: color `error`, con texto y consecuencia reconocibles.
Iconos: biblioteca MUI y nombre accesible; Tooltip cuando el control solo tiene icono.

Mantener labels persistentes y flotantes. Un placeholder ayuda con un ejemplo,
pero no reemplaza la etiqueta. Conservar controles nativos o MUI accesibles antes
de implementar widgets propios; comprobar teclado, foco y lectores cuando se
solicite validar el cambio.
