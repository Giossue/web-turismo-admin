# Diseño desde la tarea de la persona

Antes de escribir una pantalla, responder en el diseño del cambio:

1. ¿Quién la usa y en qué contexto?
2. ¿Qué intenta conseguir?
3. ¿Qué decisión necesita tomar?
4. ¿Qué información mínima necesita para decidir?
5. ¿Cuál es la acción principal?

Registrar supuestos que puedan corregirse. La autorización de una tarea clara
permite resolver decisiones rutinarias; preguntar solo cuando la respuesta cambie
el producto, el alcance o una consecuencia importante.

## Orden del diseño

Usuario → objetivo → decisión → información → acción → feedback → siguiente paso.
La existencia de una columna, un campo de API o una función no justifica mostrarla.
Una pantalla de centros permite encontrar y trabajar una ficha; no representa
cada propiedad del DTO.

## Niveles de información

| Nivel | Qué resuelve                                     | Dónde colocarlo                            |
| ----- | ------------------------------------------------ | ------------------------------------------ |
| P0    | Orientación, estado y acción principal           | Vista inicial                              |
| P1    | Datos necesarios para comparar o decidir         | Superficie de trabajo                      |
| P2    | Detalles y relaciones secundarias                | Detalle o interacción deliberada           |
| P3    | Diagnóstico, payloads, IDs y auditoría detallada | Vista autorizada que realmente lo necesite |

Ejemplo: en la cola de revisión, nombre, estado y diferencias relevantes son
información de decisión; IDs de multimedia y detalles de almacenamiento no lo son.

## Presupuesto de acciones

Mantener una acción dominante por superficie. Dejar una o dos secundarias visibles
si ayudan a la tarea; agrupar las restantes en el menú o detalle. En las filas del
portal, el contrato actual es un menú de tres puntos. Un diálogo ofrece la decisión
y su cancelación, con consecuencias claras.

## Frecuencia, riesgo y recuperación

Optimizar el trabajo frecuente con filtros y contexto conservados. Para acciones
de mayor riesgo, identificar registro y consecuencia; usar confirmación proporcional.
No añadir preguntas que solo repiten el label ni aclaraciones técnicas en la UI.

Al volver del editor, conservar el contexto que soporta el estado actual. No
prometer preferencias, scroll o selección persistentes si el código no los conserva.
Toda aceleración nueva —atajos, vistas guardadas o acciones masivas— necesita una
necesidad y soporte concreto.

El diseño del cambio resume diagnóstico, decisión, componentes, estados y evidencia
esperada. Su extensión depende del trabajo; estas preguntas son criterios de diseño,
no una obligación de pedir permiso adicional para cada componente.
