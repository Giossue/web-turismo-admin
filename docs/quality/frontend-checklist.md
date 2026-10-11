# Revisión de interfaz administrativa

Aplicar los puntos relevantes al cambio y registrar pendientes. Esta checklist
es un criterio de revisión, no una afirmación de cumplimiento del portal completo.

## Diseño

- [ ] Usuario, objetivo, decisión, información mínima y acción principal escritos.
- [ ] P0/P1 visibles y detalle secundario bajo interacción deliberada.
- [ ] Superficie acorde con el trabajo, sin títulos ni métricas duplicados.
- [ ] Funciones existentes conservadas y contratos nuevos identificados.

## Componentes y estado

- [ ] MUI, tokens y componentes compartidos usados.
- [ ] Labels flotantes y validaciones del formulario preservados.
- [ ] Carga, vacío, sin resultados, error, permiso, pendiente y éxito cubiertos.
- [ ] Foco y geometría estables en menús, diálogos y botones pendientes.
- [ ] Valores preservados ante errores recuperables.
- [ ] Respuestas tardías no sobrescriben filtro, editor o identidad nuevos.

## Tablas y navegación

- [ ] Grid/tarjetas y paginación comparten el contrato actual.
- [ ] Filtros y ordenaciones tienen soporte real, sin filtrar solo la página recibida.
- [ ] Acciones agrupadas en tres puntos y válidas por rol/estado.
- [ ] URL y retorno conservan el contexto que el cambio requiere.
- [ ] Excepciones actuales de pestañas se respetan o se rediseñan con un cambio propio.

## Seguridad y claridad

- [ ] Autorización permanece en la API; no se confía en un botón oculto.
- [ ] Payloads explícitos y errores seguros, sin metadata técnica en la UI.
- [ ] Confirmación identifica registro y consecuencia; undo solo con soporte remoto.
- [ ] Nonce alcanza scripts, estilos y DataGrid sin relajar CSP.
- [ ] Archivos y coordenadas conservan sus validaciones y consentimiento.

## Cuando se solicita verificar la interfaz

- [ ] Teclado, foco visible, labels y lectores considerados.
- [ ] Claro/oscuro, viewport pequeño, labels largos y zoom 200 % revisados.
- [ ] Objetivos táctiles alcanzables y estados legibles sin depender del color.
- [ ] Movimiento reducido y overlays sin solapamiento.
- [ ] Pruebas pertinentes y navegador ejecutados según el alcance solicitado.
- [ ] Evidencia y limitaciones reportadas, sin tratar una API simulada como producción.
