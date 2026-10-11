# Limitaciones y deuda conocida

Estos puntos son límites o decisiones pendientes, no vulnerabilidades nuevas
confirmadas por la adopción documental.

| Tema                              | Estado e impacto                                                              | Próximo paso y responsable                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `braces`                          | Versión original reportada por audit; código parcheado localmente             | Mantenimiento web: reemplazar parche al existir corrección oficial compatible                                   |
| Cuotas de Excel                   | Contadores por proceso; varias réplicas tienen cuotas independientes          | Operación: configurar límite global en proxy/API antes de escalar                                               |
| Idempotencia remota               | Cliente serializa y manda versión; no garantiza efectos únicos entre clientes | API: confirmar/diseñar contrato por mutación cuando se modifique                                                |
| Tenants                           | Sin contrato de organización/tenant en la web                                 | Producto/API: diseñar si aparece esa necesidad; no asumir aislamiento existente                                 |
| Patrones de navegación            | Catálogos y revisión mantienen pestañas existentes                            | Web: especificar una reorganización si se solicita, conservando links y contexto                                |
| Feedback de mutaciones            | Provider común, sin wrapper universal de todas las acciones                   | Web: unificar si repetición real justifica el contrato                                                          |
| Presupuestos de rendimiento       | Sin mediciones nuevas en esta adopción                                        | Web/operación: fijar línea base con datos representativos                                                       |
| Licencia de textos CognitiveStack | La rama revisada no incluye licencia general                                  | Mantenimiento: conservar atribución y redacción local; revisar licencia antes de redistribuir textos originales |

Los antecedentes conservados en Git pueden contener pendientes superados o sin comprobar.
Verificar el código antes de tratarlos como deuda activa. Un nuevo hallazgo debe
incluir impacto, evidencia, responsable y vínculo con el cambio que lo resuelve.
