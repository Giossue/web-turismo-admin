# Arquitectura de interfaz

## Base

Next.js App Router y Server Components para rutas y metadatos. Client Components
para interacción, formularios, sesión y panel. MUI v7 con
`AppRouterCacheProvider`, Inter local, tema claro/oscuro y nonce CSP.
Consultar la guía instalada de Next.js antes de cambiar sus APIs.

## Propiedad del estado

| Estado                                      | Propietario                                        |
| ------------------------------------------- | -------------------------------------------------- |
| Datos de la API y frescura                  | TanStack Query, `adminKeys` y opciones compartidas |
| Campos, dirty state y validación            | React Hook Form y módulos de formulario            |
| Sección, código y filtros compartibles      | URL y reducer del shell                            |
| Diálogo, menú o selección temporal          | Componente/hook del flujo                          |
| Token e identidad activa                    | `AdminSession`                                     |
| Preferencia de tema y lectura de avisos     | Persistencia local específica, sin credenciales    |
| Publicación, permisos y registros duraderos | API NestJS                                         |

Evitar copias independientes del mismo dato. Conservar la invalidación al
cambiar de sesión y la protección contra respuestas tardías.

## Caché y frescura

Las consultas privadas se conservan en memoria durante la sesión. No se persisten
fichas ni tokens en almacenamiento local y sus lecturas HTTP usan `no-store`.
Las claves y opciones compartidas están en `src/lib/admin-queries.ts`; gestión y
revisión de catastro usan la misma configuración de consulta.

| Datos                          | Frescura | Actualización adicional                           |
| ------------------------------ | -------- | ------------------------------------------------- |
| Listados y resumen             | 10 s     | Al recuperar foco o conexión, si están antiguos   |
| Avisos de navegación           | 10 s     | También cada 30 s mientras la pestaña está activa |
| Catálogos, detalle e historial | 60 s     | Invalidación y recarga explícita del flujo        |
| Apartados de ficha             | 10 s     | Invalidación del flujo de guardado/importación    |
| Multimedia                     | 5 s      | Invalidación después de subir o retirar archivos  |

La frescura no es una recarga periódica ni la duración máxima de un dato en
memoria. Las consultas sin consumidores conservan la retención predeterminada
de cinco minutos. Los formularios mantienen la protección de campos editados;
la actualización al recuperar foco se configura en listados y resumen.

Cada consulta transmite su `AbortSignal` al cliente HTTP: cancelar una lectura,
abandonar un filtro o vaciar la sesión interrumpe su transporte. Las mutaciones
no heredan esa cancelación: abortar no revierte una escritura remota.

## Desarrollo de una pantalla

Responder primero el [brief cognitivo](cognitive-architecture.md). Elegir una
superficie según la tarea, clasificar la información y reutilizar el
[inventario](component-system.md). La pantalla debe mostrar acción y resultado
sin pedir que la persona entienda IDs, proveedores o detalles de persistencia.

Reutilizar componentes de producto, componer primitivas MUI y extraer un contrato
compartido cuando varios flujos lo necesiten. No sustituir DataGrid por TanStack
Table ni introducir otro sistema de avisos para ajustar nombres de la plantilla.

## Patrones por tarea

- [Escalas y tema](design-foundations.md).
- [Selección de controles](component-selection.md).
- [Superficies](interface-design.md).
- [Tablas](data-tables.md).
- [Formularios](forms-and-workflows.md).
- [Estados y feedback](feedback-and-states.md).
- [Navegación y accesibilidad](navigation-responsive.md).
- [Revisión de interfaz](../quality/frontend-checklist.md).

La adaptación del knowledge no rediseña las pantallas existentes. Un rediseño
conserva comportamiento, permisos y datos salvo cambios especificados. Cuando
falta soporte de API, registrar el contrato requerido; no crear controles vacíos
ni usar datos simulados en el producto.
