# Revisión de código

## Prioridad

Corrección y pérdida de datos → seguridad → regresiones → contratos y evidencia
faltante → arquitectura → mantenibilidad → consistencia de interfaz.
Comentar sobre defectos y consecuencias demostrables, con archivo y línea.

| Severidad  | Uso                                                                |
| ---------- | ------------------------------------------------------------------ |
| Crítico    | Vulnerabilidad explotable, pérdida de datos o flujo principal roto |
| Requerido  | Defecto que debe corregirse para satisfacer el contrato            |
| Considerar | Alternativa con un beneficio concreto                              |
| Detalle    | Preferencia de estilo sin riesgo funcional                         |
| Contexto   | Información sin acción requerida                                   |

## Preguntas del portal

- ¿La API sigue decidiendo permisos por registro y rol?
- ¿La respuesta puede entrar en una caché de otra sesión?
- ¿El fallo de cierre o renovación recupera datos que debían descartarse?
- ¿El payload contiene solo campos del contrato?
- ¿Hay sobrescritura silenciosa, guardados paralelos de ficha o reintento incierto?
- ¿Se desactivó algún límite de archivo, worker, CSP o exclusión del build?
- ¿El módulo reutiliza cliente, queries, campos, grid, labels y feedback?
- ¿La interfaz ofrece una acción que su endpoint no soporta?
- ¿La documentación narra una propuesta como implementada o desplegada?

## Estructura y dependencias

Una extracción debe reducir conceptos y ramas, no repartir la misma complejidad.
Nombrar el movimiento que resuelve un hallazgo: contrato explícito, helper
canónico, dispatcher, responsabilidad separada o eliminación de código sin usos.
Verificar usos antes de retirar código; pedir aclaración solo si su uso o alcance
es realmente incierto.

Revisar propósito, licencia, mantenimiento, vulnerabilidades y diff del lockfile.
Las versiones de la plantilla no justifican una actualización del producto.
Un tipo TypeScript no demuestra validación runtime.

## Resultado

Hallazgos por gravedad con evidencia, impacto y corrección propuesta. Luego
supuestos y limitaciones de la revisión. Si no hay hallazgos, decirlo sin afirmar
que el sistema completo es seguro o que pruebas no ejecutadas pasaron.

Fuentes: [hardening](../security/hardening.md),
[concurrencia](../architecture/idempotency.md),
[rendimiento](performance.md) y [revisión de UI](frontend-checklist.md).
