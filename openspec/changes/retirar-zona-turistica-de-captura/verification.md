# Comprobación

## Alcance implementado

Se retiró «Zona turística» del selector de identificación, del resumen y del
snapshot visible de diferencias. También se retiró de los campos de avance y
creación del asistente. La relación histórica sigue en los tipos y mappers para
conservar compatibilidad; no se asigna una zona al importar la ficha MINTUR.

El monorepo hermano incluye los centros públicos en manifiestos por coordenadas
y cobertura. Conserva referencias internas sin cambios al guardar/revisar y
mantiene la validación de nuevas asignaciones para consumidores anteriores.

## Evidencia

- No quedan etiquetas «Zona turística» ni controles `name="touristZoneId"`
  en los componentes administrativos.
- `bun run typecheck`, `bun run lint` y `bun run build`: completados sin errores.
  El build incluye compilación Next, TypeScript, rutas y preparación standalone.
- Formato y `git diff --check`: comprobados.
- `bun run openspec validate --all --strict`: doce elementos válidos.
- Los checks de API y lecturas SQL se documentan en el cambio del monorepo hermano.
  La columna existente se verificó nullable en la base remota objetivo, sin modificarla.

## Pendiente

No se ejecutaron suites ni una interacción de navegador autenticada. La edición,
importación y guardado de una ficha real deben comprobarse en la interfaz tras
desplegar panel y API. Durante las comprobaciones no se hizo despliegue ni
publicación de datos. El usuario autorizó después commit y push para la entrega.
