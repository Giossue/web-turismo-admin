# Plan activo: formulario continuo para la ficha turística

## Objetivo

Recuperar la captura vertical continua de la ficha, como en el diseño de referencia,
sin cambiar los campos, contratos de API, validaciones ni el guardado por sección.

## Cambios

- Reemplazar la navegación lateral de secciones por una pila vertical de tarjetas.
- Renderizar cada sección de la ficha en su propio bloque, con estado y guardado local.
- Mantener el formulario núcleo (identificación, ubicación, administración, ingreso,
  actividades, accesibilidad, facilidades y multimedia) en el flujo continuo.
- Conservar progreso, valoración, código institucional, estados y permisos existentes.
- Asegurar que el diseño responda correctamente en desktop, tablet y móvil.

## Fuera de alcance

- No modificar API, base de datos, contratos de persistencia ni lógica de valoración.
- No eliminar campos ni cambiar el orden funcional de las 14 secciones.

## Verificación

- `bun run format`
- `bun run lint`
- `bun run typecheck`
- `bun run build`
- Revisión visual del editor en tema oscuro y viewport móvil/desktop.

## Estado

Implementado el 20 de septiembre de 2026. El editor usa ahora una pila vertical continua
de tarjetas y cada sección conserva su formulario y guardado independiente. Las cuatro
verificaciones automatizadas pasan; queda pendiente únicamente la revisión visual manual
en navegador.
