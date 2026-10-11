# Tablas, filtros y paginación

## Contrato vigente

`AdminDataGrid` unifica los listados sobre MUI X DataGrid Community v8. Desde
600 px conserva la tabla; en móviles presenta tarjetas con datos y acciones
aportados por cada módulo. Las dos variantes usan el nonce de la respuesta.

El grid no reemplaza la API ni convierte una página recibida en el conjunto
completo de datos. Conservar `Page<T>`, total, límite, offset y opciones reales
del endpoint. DataGrid Community no ofrece el filtrado combinado nativo de Pro.
Los filtros de dominio resuelven las combinaciones que soporta la API.

## Anatomía compartida

- Cabecera sin título duplicado y creación junto al título cuando se permite.
- Búsqueda y filtros asociados al listado, con contador cuando están agrupados.
- Identidad reconocible primero, estado legible y detalles mínimos para comparar.
- Menú de tres puntos al final de la fila, con acciones válidas por rol y estado.
- Pie de paginación y estados comunes.

No ofrecer ordenaciones, exportaciones, selección masiva o filtros sin soporte.
Los catálogos pequeños pueden buscar localmente entre opciones ya cargadas;
los listados paginados de la API filtran en el servidor.

## Filtros y contexto

Reiniciar página cuando cambia un criterio. Mantener las dependencias entre
territorio, actividad, tipo y categoría. Los parámetros compartibles se validan
y se conservan en la URL donde el shell ya lo soporta.

Volver del editor a centros conserva búsqueda y página. No afirmar que todos
los módulos conservan scroll, selección o preferencias de columnas: verificar
el comportamiento que se modifica. La navegación y opciones canónicas están
en `shell/admin-nav-state.ts` y `src/lib/admin-queries.ts`.

## Estados y accesibilidad

Conservar el indicador circular compartido dentro del listado y geometría
estable. Distinguir colección vacía, búsqueda sin resultados, error y acceso
denegado. Las acciones deben mantener foco y nombre accesible en menú y tarjeta.
No depender exclusivamente del color para estado.

En móvil, conservar identidad y acciones alcanzables y permitir que los
controles se acomoden por grupos. No comprimir columnas hasta volverlas ilegibles.
Si se solicita verificación, cubrir labels largos, vacíos, recarga, teclado,
temas y páginas con distinto número de registros.
