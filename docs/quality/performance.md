# Rendimiento

## Método

Empezar por un síntoma con coste para la persona. Registrar hardware, datos,
red, comando y varias mediciones de referencia. Cambiar el cuello de botella
demostrado y comparar con las mismas condiciones. Revertir si el resultado
queda dentro del ruido o degrada corrección, seguridad o accesibilidad.

No incorporar caché, memoización o una dependencia para una mejora no medida.
Tampoco retirar límites o validaciones de importación para ganar tiempo.

## Criterios

LCP ≤ 2.5 s, INP ≤ 200 ms y CLS ≤ 0.1 sirven como objetivos iniciales de UX;
no están certificados ni medidos por esta adopción. Presupuestos de bundle,
latencia de API y memoria necesitan una línea base del despliegue. No convertir
los 200 KB ilustrativos de la plantilla en un resultado que MUI/MapLibre ya cumplan.

## Riesgos del portal

- Mantener listas paginadas/virtualizadas y evitar una petición por fila.
- Paralelizar solo lecturas independientes, con cancelación y timeout.
- Separar features pesadas cuando una medición lo justifique.
- No bloquear toda la página para recargar un listado.
- Conservar límites de memoria, ZIP y concurrencia del worker.
- Evitar respuestas pesadas con campos que la pantalla no usa, coordinando el contrato con la API.
- No cachear páginas privadas de forma compartida.

Registrar intentos y resultados en el diseño del cambio, incluidos los descartados.
Los índices y planes de consultas se evalúan en el backend, no añadiendo SQL a la web.
