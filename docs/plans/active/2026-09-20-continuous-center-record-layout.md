# Plan activo: asistente por pasos para la ficha turística

## Objetivo

Presentar la ficha integral como un asistente por pasos, sin sidebar, manteniendo los
campos, contratos de API y validaciones existentes, con guardado automático invisible.

## Cambios

- Reemplazar la navegación lateral y la pila continua por un stepper horizontal
  compacto, sin sidebar durante la edición.
- Mostrar una sola tanda de campos por vez, siguiendo las 14 secciones de la ficha; el
  resumen final se presenta fuera del conteo de secciones.
- Permitir saltar entre pasos ya disponibles y conservar montadas las secciones para no
  perder ediciones pendientes al navegar.
- Mantener el guardado automático invisible del núcleo y de cada sección; no mostrar
  botones, badges ni mensajes técnicos de persistencia.
- Crear la ficha automáticamente cuando se completen los datos mínimos requeridos y
  conservar únicamente las acciones explícitas de enviar a revisión y publicar.
- Integrar el formulario núcleo (identificación, ubicación, administración, ingreso,
  actividades, accesibilidad, facilidades y multimedia) en las secciones de la ficha
  donde corresponde, sin crear un paso adicional.
- Ocultar la navegación administrativa lateral mientras se crea o edita una ficha para
  aprovechar todo el ancho disponible.
- Retirar el botón de recarga del encabezado administrativo.
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

Implementado el 20 de septiembre de 2026. El editor usa ahora un stepper compacto con las
14 secciones reales de la ficha, sin sidebar durante la edición, y un resumen final fuera
del conteo. Las secciones se
mantienen montadas para conservar el autosalvado mientras se navega; no se muestran
botones, badges ni mensajes técnicos de persistencia, y el botón de recarga del encabezado
fue retirado. Las verificaciones automatizadas pasan; queda pendiente únicamente la
revisión visual manual en navegador.
