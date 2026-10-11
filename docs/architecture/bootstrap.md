# Incorporarse al portal

Este repositorio contiene una aplicación existente. Empezar por su
[README](../../README.md), [AGENTS.md](../../AGENTS.md) e
[índice de knowledge](../README.md).

## Entorno local

```bash
bun install --frozen-lockfile
bun run dev
```

La web abre en el puerto 3002. La API local predeterminada es
`http://localhost:3000/api/v1`; definir las URLs de servidor y navegador cuando
se use otro entorno. `.env.example` documenta configuración, no prueba que la
conexión sea de producción.

El lanzador local también puede iniciar el monorepo vecino. Su flujo completo
prepara datos de demostración locales; leer el README antes de ejecutarlo contra
cualquier entorno. `--web-only` inicia únicamente la web.

## Knowledge y herramientas

```bash
bun run openspec list --json
bun run openspec context --json
bun run knowledge:update
```

Codex y Claude están preparados con los doce workflows. La
[instalación](../quality/openspec-installation.md) documenta el CLI global y `knowledge:init`. El wrapper usa
el CLI fijado en el proyecto y un perfil temporal. No hace falta instalar otro
gestor ni alterar perfiles globales para conservar el workflow `verify`.

Los escenarios actuales se incorporaron como una base documental del código,
no como una declaración de despliegue en producción. Los nuevos cambios de
comportamiento siguen el [ciclo de cambios](../quality/change-lifecycle.md).

## Comprobaciones disponibles

Formato, lint, tipos, pruebas y build son comandos reales de `package.json`.
La estrategia y las condiciones de uso están en
[testing.md](../quality/testing.md). Una revisión documental no ejecuta la API,
el lanzador ni migraciones.
