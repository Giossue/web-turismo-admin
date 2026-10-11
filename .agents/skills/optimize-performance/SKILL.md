---
name: optimize-performance
description: Investiga regresiones de carga, interacción, solicitudes o importación del portal usando medidas representativas y límites de seguridad.
---

# Mejorar rendimiento con evidencia

Leer [rendimiento](../../../docs/quality/performance.md) y la arquitectura del
síntoma. Registrar red, datos, hardware, comando y varias medidas iniciales.

Identificar el cuello de botella, cambiar una causa y comparar en las mismas
condiciones. Conservar solo una mejora que supere la variación y mantenga
comportamiento, accesibilidad y seguridad. Registrar también intentos revertidos.

En esta web, revisar paginación, peticiones por fila, waterfalls, módulos
pesados, re-render y capacidad del parser. No abrir conexiones de datos para
perfilar la API ni retirar CSP, validaciones o límites del worker.

Reportar números, coste visible y limitaciones. Presupuestos de la plantilla
no son mediciones existentes. Ejecutar pruebas cuando el alcance las solicite.
