# Web Turismo Admin

Portal administrativo de Turismo Vinculación. `/` redirige a `/admin`: login
institucional o panel según la sesión. El knowledge sigue CognitiveStack `dev`,
adaptado a este repositorio; la procedencia está en
`docs/architecture/cognitivestack-adoption.md`.

## Leer según la tarea

- Mapa de fuentes y skills: `docs/README.md`.
- Producto y vocabulario: `docs/product/`.
- Mapa técnico: `ARCHITECTURE.md`; decisiones y patrones: `docs/architecture/index.md`.
- Comportamiento vigente: `openspec/specs/`; cambios: `openspec/changes/`.
- Flujo de cambios y aceptación: `docs/quality/change-lifecycle.md` y
  `docs/quality/definition-of-done.md`.
- Seguridad: `docs/security/principles.md`, `access-control.md` y `controles.md`.

Carga solo las fuentes relacionadas con la tarea. Las skills locales viven en
`.agents/skills/`; sus detalles no pertenecen a este archivo.

## Límites

- La aplicación móvil es el único producto para turistas.
- Este repositorio no se conecta directamente a PostgreSQL, PostGIS, Redis ni MinIO.
- La API NestJS existente es la fuente de datos, identidad, autorización por
  acción/registro y auditoría. La sesión institucional ya está integrada.
- Los roles proceden de la API. La navegación y los botones reflejan permisos;
  conocer un ID, ocultar un botón o excluir robots no autoriza una operación.
- Tokens en memoria; refresh en cookie HttpOnly gestionada por la API. Conservar
  invalidación de caché, protección contra respuestas tardías y cierre entre pestañas.
- Mantener los límites de importación, aislamiento del worker, CSP con nonce,
  exclusión de `.env*` y ejecución del contenedor sin root.

## Stack

- Next.js App Router, React y TypeScript.
- Material UI (MUI) v7 con `AppRouterCacheProvider` para SSR.
- Tema compartido adaptado de las plantillas oficiales Dashboard y Sign-in, con Inter y
  modos claro/oscuro. Conservar etiquetas flotantes y estados de los formularios del panel.
- Server Components para las rutas y metadatos; Client Components solo para
  interacción del panel.
- Bun es el gestor de este repositorio; conservar `bun.lock` y el parche de `braces`.
  Versiones y excepciones: `docs/architecture/stack.md` y ADR 0001.

## Trabajo y cambios

1. Leer estas reglas, las instrucciones más cercanas y la fuente relevante.
2. Para cambios de comportamiento no triviales, mantener propuesta, diseño,
   escenarios y tareas en OpenSpec. Las correcciones de documentación y formato
   se resuelven directamente.
3. Antes de diseñar una pantalla, registrar usuario, objetivo, decisión, información
   mínima y acción principal; usar los componentes y tokens existentes.
4. Antes de una operación sensible, definir autorización, validación, repetición,
   concurrencia, auditoría y responsabilidad de la API.
5. Mantener código, documentación y especificaciones alineados. Distinguir
   controles actuales, requisitos nuevos y comprobaciones pendientes.
6. Respetar el alcance y la autorización ya dados por el usuario. No añadir
   confirmaciones para ediciones reversibles o implementación ya solicitada.
   Una solicitud de análisis o propuesta por sí sola no autoriza implementación.
7. Añadir o ejecutar pruebas cuando el usuario lo solicite; documentar qué se
   comprobó y qué no. Nunca afirmar que una comprobación omitida pasó.
8. Commit y push solo cuando se soliciten. Conservar cambios ajenos y el historial
   publicado; las skills no amplían la autorización de la sesión.

No cambiar el stack para ajustarlo a la plantilla. Un cambio necesario por seguridad
requiere evidencia, evaluación de compatibilidad y un ADR. No incorporar un tenant,
ORM, proveedor de autenticación o conexión a base de datos que el producto no tenga.

## Comandos

```bash
bun install
bun run dev
bun run knowledge:init
bun run verify
```

Configura `TURISMO_API_URL` a la URL de la API NestJS. El valor predeterminado local es
`http://localhost:3000/api/v1`.

Para OpenSpec usa `bun run openspec <comando>`; los ejemplos `openspec` de las
skills generadas son abreviaturas de este comando. `bun run knowledge:update`
regenera las integraciones de Codex y Claude con los doce workflows del perfil en
`openspec/tooling.json`. Instalación y CLI global: `docs/quality/openspec-installation.md`. No editar las skills
`openspec-*`, comandos ni prompts generados a mano.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
