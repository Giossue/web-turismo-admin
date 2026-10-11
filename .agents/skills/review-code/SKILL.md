---
name: review-code
description: Revisa cambios del portal por corrección, seguridad, regresiones, fronteras de API, coherencia de MUI y documentación.
---

# Revisar código del portal

Leer [guía de revisión](../../../docs/quality/code-review.md), AGENTS,
arquitectura afectada y artifacts del cambio si existen.

Priorizar pérdida de datos, seguridad y regresiones. Seguir generación de sesión,
permisos remotos, guardado/versiones, contenido de archivos y límites de recursos.
Revisar contrato de cliente, caché y campos permitidos; los mocks no prueban la API.

Comprobar reutilización de componentes/tokens, estados, navegación y lenguaje.
Señalar una responsabilidad o contrato que deba moverse cuando el defecto es
estructural; evitar hallazgos de complejidad sin una solución concreta.

Presentar gravedad, archivo/línea, efecto y corrección sugerida. Distinguir
defectos de preferencias y expresar pendientes de evidencia. Una revisión no
autoriza implementación, ejecución de pruebas o publicación por sí misma.
