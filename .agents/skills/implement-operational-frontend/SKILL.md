---
name: implement-operational-frontend
description: Implementa o adapta pantallas administrativas de este portal Next.js/MUI con sus tablas, formularios, estados y flujos existentes.
---

# Implementar interfaz operativa

Leer AGENTS, el cambio de comportamiento si corresponde,
[frontend](../../../docs/architecture/frontend.md) y el patrón de la superficie.

- Escribir usuario, objetivo, decisión, información mínima y acción principal.
- Revisar componentes actuales, contratos de API y tokens antes de diseñar.
- Conservar AdminDataGrid/tarjetas, campos RHF, labels flotantes, menús de fila
  y feedback MUI. Componer primero; no instalar otro kit ni renombrar contratos maduros.
- Definir carga, vacío, error, permiso, pendiente, éxito y conflicto relevantes.
- Mantener contexto URL, sesión del editor y protección contra respuestas tardías.
- Registrar dependencias de backend sin inventar controles o respuestas simuladas
  en el producto. La API sigue autorizando cada registro.
- Usar la [checklist](../../../docs/quality/frontend-checklist.md) y reportar
  evidencia real. Añadir/ejecutar pruebas cuando se solicite verificarlas.

Preservar el alcance y autorización de la sesión. La adaptación del knowledge
no autoriza reorganizar pestañas o cambiar reglas de publicación.
