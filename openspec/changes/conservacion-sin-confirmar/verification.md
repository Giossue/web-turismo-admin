# Verification

## Fuente y diagnóstico

Archivo privado `temp/Plaza 15 de mayo.xlsm`, leído sin ejecutar macros o fórmulas:
J129 marcado, estados del entorno sin marcar, Jerarquia!B38 TRUE y B41:B44 FALSE.
El worker aislado devuelve ALTERADO/null y tres factores en cada componente:
Humedad, Clima y Expansión urbana. El parser y mapper ya conservaban estos datos.

La API hermana verificó en solo lectura el destino turismo_vinculacion_app y el
borrador/revisión vigente 020101MC010400011, versión 6. Ambos conservan el mismo
contenido de Conservación. No se actualizó ni aprobó la ficha remota.

## Comprobaciones locales

- `bun run typecheck`, `bun run lint`, `bun run build`: aprobados.
- Prettier en archivos del cambio y `git diff --check`: aprobados.
- `bun run openspec validate --all --strict`: 14 aprobados, cero fallos.
- Delta de importación integrado en la spec principal.
- En la API hermana, PostgreSQL local aislado conserva estado nulo, seis factores
  y declaratoria tras publicar/leer solamente esa sección; conservación aporta 5.

## Límites

No se ejecutaron suites de pruebas ni un flujo de navegador autenticado. La
comprobación de la sección no equivale a aprobar/publicar toda la ficha remota.

## Operación remota y entrega

La API hermana aplicó `20261011_conservation_unknown_state.sql` en la base
remota turismo_vinculacion_app (187.127.6.234:8004), confirmada el
2026-10-11T15:39:50.434Z. Se verificaron conexión, propietario, esquema, filas,
restricciones y permisos de tablas/secuencias antes y después. No se crearon
respaldos por instrucción expresa posterior del usuario.

La sesión autoriza commit/push de esta corrección a main en ambos repositorios.
El despliegue manual y la aprobación/publicación remota de la ficha no se
ejecutaron; push no certifica que la API alojada ya use esta versión.
