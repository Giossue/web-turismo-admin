# Entrada para Claude

Leer [AGENTS.md](AGENTS.md) y [docs/README.md](docs/README.md). Producto,
arquitectura, seguridad y calidad comparten esas fuentes con los demás agentes.

El comportamiento documentado está en `openspec/specs/`; los cambios en
`openspec/changes/`. Usar `bun run openspec` para los ejemplos del CLI y
`bun run knowledge:update` para regenerar workflows.

Conservar el stack MUI/Bun y la API NestJS externa. La solicitud del usuario
determina alcance y autorización; no pedir de nuevo permiso ya concedido.
Commit y push se realizan cuando se soliciten.
