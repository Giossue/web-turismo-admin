# Criterios para completar una tarea

El resultado cumple la solicitud, el alcance autorizado y los contratos del
proyecto. Implementación, documentación y specs deben contar el mismo comportamiento.

- Criterios solicitados satisfechos o limitación concreta declarada.
- Estados de error, datos vacíos, permisos y repetición considerados donde apliquen.
- Fuentes y enlaces actualizados cuando cambia una decisión o contrato.
- Stack conservado o ADR sustentado por evidencia.
- Sin secretos, cambios ajenos revertidos ni archivos generados editados a mano.
- Dependencias justificadas y lockfile revisado.
- Evidencia identificada: revisión, comandos y resultados realmente observados.
- Comprobaciones pendientes descritas; ninguna prueba omitida se declara aprobada.

## Según la frontera

| Cambio          | Criterios específicos                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| UI              | Brief cognitivo, componentes/tokens, labels, acciones, feedback y estados     |
| Sesión          | Generación, invalidación privada, cambio de cuenta y cierre pendiente         |
| Importación     | Identidad actual, límites ZIP/XML, worker, cancelación, cuotas y error seguro |
| Contrato de API | Campos explícitos, permisos externos, versión, repetición y compatibilidad    |
| Despliegue      | Separación build/runtime, contexto sin `.env*`, assets y usuario sin root     |
| Knowledge       | Fuentes actuales, procedencia, enlaces, skills y configuración coherentes     |

La [checklist de UI](frontend-checklist.md) sirve para un cambio visual/funcional.
La [estrategia de comprobación](testing.md) distingue revisión documental de tests.
Añadir o ejecutar pruebas requiere solicitud del usuario; reportar ese alcance
sin impedir las ediciones ya autorizadas.

Una tarea local completada no significa que esté desplegada, que se haya auditado
la API remota o que una migración se haya aplicado. Archivar tampoco hace commit
ni push automáticamente.
