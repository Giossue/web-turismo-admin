# Plan activo: asistente por pasos para la ficha turística

## Objetivo

Presentar la ficha integral como un asistente por pasos, sin sidebar, manteniendo los
campos, contratos de API y validaciones existentes, con guardado automático invisible.

## Cambios

- Reemplazar la navegación lateral y la pila continua por un navegador de pasos
  compacto y responsive, sin sidebar durante la edición; los pasos se distribuyen en
  una cuadrícula para evitar desbordes.
- Mostrar una sola tanda de campos por vez, siguiendo las 14 secciones de la ficha; el
  resumen final se presenta fuera del conteo de secciones.
- Permitir saltar entre pasos ya disponibles y conservar montadas las secciones para no
  perder ediciones pendientes al navegar.
- Mantener el guardado automático invisible del núcleo y de cada sección; no mostrar
  botones, badges ni mensajes técnicos de persistencia.
- Crear la ficha automáticamente cuando se completen los datos mínimos requeridos y
  conservar únicamente las acciones explícitas de enviar a revisión y publicar.
- Evitar rerenders globales del formulario al escribir: observar los cambios de
  autoguardado sin suscripción visual y memorizar las secciones inactivas.
- Integrar el formulario núcleo (identificación, ubicación, administración, ingreso,
  actividades, accesibilidad, facilidades y multimedia) en las secciones de la ficha
  donde corresponde, sin crear un paso adicional.
- Ocultar la navegación administrativa lateral mientras se crea o edita una ficha para
  aprovechar todo el ancho disponible.
- Retirar el botón de recarga del encabezado administrativo.
- Conservar progreso, valoración, código institucional, estados y permisos existentes.
- Asegurar que el diseño responda correctamente en desktop, tablet y móvil.
- Aplicar las dependencias del XLSM en la captura: clasificación y territorio en
  cascada, zona compatible con el territorio, actividades compatibles con la categoría
  y mostrar los datos de detalle únicamente cuando la respuesta principal sea afirmativa.
- Cuando una selección padre cambie, retirar de la vista las opciones hijas que ya no
  pertenecen a ella y limpiar selecciones incompatibles antes del autoguardado.
- Ordenar la identificación como clasificación, territorio y dependencias territoriales;
  retirar la jerarquía calculada de la captura manual sin modificar su cálculo ni contrato.
- Revisar el orden interno de las 14 secciones contra `Ficha_Jerarquia`: dirección antes
  de coordenadas, ingreso en la secuencia del XLSM (incluida la reserva) y promoción con
  medios antes del paquete.
- Presentar multimedia antes del contexto documental dentro de Anexos, manteniendo los
  mismos endpoints y el mismo modelo de persistencia.
- Convertir errores y confirmaciones transitorias del admin en un toast global, dejando
  dentro de la página únicamente estados persistentes de contexto, permisos o carga.

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
- Pruebas de cascadas y de respuestas condicionales (`SI`, `NO`, `NO APLICA`) para evitar
  que se registren detalles que la ficha no permite.

## Estado

Implementado el 20 de septiembre de 2026. El editor usa ahora un stepper compacto con las
14 secciones reales de la ficha, sin sidebar durante la edición, y un resumen final fuera
del conteo. Las secciones se
mantienen montadas para conservar el autosalvado mientras se navega; no se muestran
botones, badges ni mensajes técnicos de persistencia, y el botón de recarga del encabezado
fue retirado. La captura también aplica las cascadas territoriales y de clasificación,
filtra actividades y facilidades por su catálogo padre, limpia selecciones incompatibles y
limita los detalles de secciones a respuestas aplicables. Los mensajes transitorios ahora
se muestran como toast global del admin. La revisión completa del formulario conserva el
orden de las 14 secciones del XLSM, ajusta el orden interno de ubicación, ingreso,
promoción y anexos, y muestra la reserva de ingreso que ya soportaba el contrato. Las
verificaciones específicas del editor pasan; queda pendiente únicamente la revisión visual
manual en navegador. La verificación global sigue teniendo errores preexistentes en
`admin-shell.tsx` fuera de este cambio.
El autoguardado del núcleo ahora se suscribe a los cambios sin rerenderizar el editor en
cada tecla, y las tarjetas de secciones inactivas conservan su estado sin volver a
renderizarse durante la edición de otra sección.
