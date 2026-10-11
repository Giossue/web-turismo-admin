# Contratos compartidos del portal

Las primitivas MUI aportan interacción; los componentes de la web unifican el
trabajo operativo. Mantener el flujo rutas → flujos → componentes compartidos
y `src/lib`; los helpers no dependen de pantallas.

| Contrato existente                           | Responsabilidad                                                       |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `AdminDataGrid`                              | Tabla MUI X Community, estados, paginación y tarjetas móviles         |
| `AdminGridFilterPanel`, `SearchField`        | Superficies y controles de búsqueda/filtro                            |
| `RecordActionsMenu`                          | Acciones de fila según estado y permisos, con foco accesible          |
| `DeleteRecordAction`                         | Confirmación, bloqueo de repetición, error e invalidación al eliminar |
| `ReviewDecisionDialog`                       | Decisión y motivo de revisión                                         |
| Campos en `ui/form/`                         | Enlace RHF, labels, valores y errores compartidos                     |
| `CatalogSelect`, `CatalogAutocomplete`       | Relaciones por etiqueta, conservando IDs en valores                   |
| `CoordinateFieldset`                         | Coordenadas con validación y acceso al mapa                           |
| `StatusBadge`                                | Estado con tono semántico y label de dominio                          |
| `LoadingSpinner`, `ContentState`             | Carga y resultados de contenido comunes                               |
| `PageHeader`, `SectionHeader`, `FlatSurface` | Jerarquía y superficie del panel                                      |
| `AdminFeedbackProvider`, `useAdminFeedback`  | Avisos globales de éxito/error mediante Snackbar                      |
| `adminKeys`, opciones de consultas           | Caché, frescura y alcance de invalidación                             |

No todos los contratos propuestos por CognitiveStack existen aquí: no hay un
`useMutationFeedback` universal, un picker de entidad genérico ni un sistema de
jobs duraderos. Antes de crear uno, verificar que varios flujos necesitan el mismo
comportamiento y registrar el cambio.

Las primitivas visuales no hacen llamadas de API ni deciden permisos de negocio.
Los flujos suministran columnas, callbacks, labels y acciones válidas. No renombrar
componentes maduros para igualar nombres de ejemplo.

Cuando se adapta código de terceros, revisar fuente, licencia, dependencias,
tokens y accesibilidad. Mantener una sola implementación compartida por contrato;
la atribución de MUI está en [third-party-notices](../third-party-notices/mui-templates.md).
