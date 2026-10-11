# Tasks

## 1. Lecturas y políticas compartidas

- [x] 1.1 Propagar el signal de todas las consultas administrativas hasta fetch y comprobar cancelación de transporte, descarte de respuestas y aislamiento de sesión con pruebas de Bun.
- [x] 1.2 Unificar consultas de catastro, detalle y listados, actualizar datos antiguos al recuperar foco/conexión y documentar frescura/retención en arquitectura; comprobar la política y la actualización con pruebas de consultas.

## 2. Conflictos y apartados importados

- [x] 2.1 Forzar la lectura vigente tras un 409, comunicar fallos de recuperación sin descartar campos locales y documentar la recuperación; comprobar detalle local fresco y lectura fallida con pruebas de regresión.
- [x] 2.2 Serializar apartados importados con los demás guardados y reevaluar su existencia tras un conflicto; comprobar preservación, versión, único reintento y permisos con pruebas de Bun y actualizar la documentación de concurrencia.

## 3. Transiciones de listados

- [x] 3.1 Mostrar actualización manteniendo filas/total y bloquear menús y acciones primarias de resultados anteriores en tabla/tarjetas; comprobar comportamiento observable de filtros y páginas en escritorio/móvil con Playwright.
- [x] 3.2 Incorporar Actualizar a los listados sin perder contexto y documentar estados y recuperación en tablas/feedback; comprobar actualización manual y al recuperar foco con Playwright.

## 4. Integración y coherencia

- [x] 4.1 Ejecutar formato, lint, tipos, pruebas, build y suite de navegador; revisar el diff y registrar comandos/resultados y límites reales en la evidencia del cambio.
- [x] 4.2 Sincronizar los deltas implementados con las specs vigentes y comprobar el cambio y las especificaciones con validación estricta de OpenSpec.
