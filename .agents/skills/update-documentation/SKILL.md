---
name: update-documentation
description: Actualiza el knowledge del portal al cambiar comportamiento, contratos, arquitectura, seguridad o criterios de calidad, manteniendo fuentes únicas.
---

# Actualizar fuentes del knowledge

Leer [índice](../../../docs/README.md) y la fuente más cercana al cambio.

- Producto y vocabulario: docs/product; decisiones/patrones: docs/architecture.
- Comportamiento: deltas en el cambio OpenSpec y sync/archive hacia specs.
- Seguridad: principios y controles actuales; calidad: evidencia y aceptación.
- Procedencia: commit de CognitiveStack y adaptaciones locales, sin copiar su stack.

Describir verdad actual, requisito nuevo y pendiente por separado. Enlazar en
lugar de duplicar reglas completas. Revisar referencias al mover documentos.
La planificación vive exclusivamente en OpenSpec; los antecedentes retirados se
consultan en Git. Una salida generada se corrige en su generador.

Regenerar OpenSpec con el comando del proyecto, sin editar skills/prompts a mano.
Mantener AGENTS breve y conservar su bloque generado por Next.js.
Reportar revisión documental sin atribuirle resultados de tests no ejecutados.
