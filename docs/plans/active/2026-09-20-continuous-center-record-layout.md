# Plan activo: formulario continuo para la ficha turística

## Objetivo

Recuperar la captura vertical continua de la ficha, como en el diseño de referencia,
sin cambiar los campos, contratos de API ni validaciones, y con guardado automático de
cada sección del borrador.

## Cambios

- Reemplazar la navegación lateral de secciones por una pila vertical de tarjetas.
- Renderizar cada sección de la ficha en su propio bloque, con estado y guardado
  automático después de dos segundos de inactividad.
- Retirar la acción manual “Guardar sección” y los badges de estado por sección; el
  autosalvado continúa funcionando de forma interna.
- Aplicar el mismo autosalvado a los campos núcleo y crear la ficha automáticamente
  cuando complete los datos mínimos requeridos; no mostrar “Guardar borrador”.
- Mantener el formulario núcleo (identificación, ubicación, administración, ingreso,
  actividades, accesibilidad, facilidades y multimedia) en el flujo continuo.
- Conservar progreso, valoración, código institucional, estados y permisos existentes.
- Asegurar que el diseño responda correctamente en desktop, tablet y móvil.

## Fuera de alcance

- No modificar API, base de datos, contratos de persistencia ni lógica de valoración;
  el autosalvado reutiliza el endpoint de sección y el estado `BORRADOR` existente.
- No eliminar campos ni cambiar el orden funcional de las 14 secciones.

## Verificación

- `bun run format`
- `bun run lint`
- `bun run typecheck`
- `bun run build`
- Revisión visual del editor en tema oscuro y viewport móvil/desktop.

## Estado

Implementado el 20 de septiembre de 2026. El editor usa ahora una pila vertical continua
de tarjetas y tanto el núcleo como cada sección se guardan automáticamente dos segundos
después de la última edición. No se muestran botones de guardado, badges de estado ni
mensajes internos del autosalvado; la ficha nueva se crea cuando sus campos mínimos están
completos. Las cuatro verificaciones automatizadas pasan; queda pendiente únicamente la
revisión visual manual en navegador.
