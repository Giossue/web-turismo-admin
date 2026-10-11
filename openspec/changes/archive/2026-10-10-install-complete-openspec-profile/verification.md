# Evidencia de instalación

Revisión del 10 de octubre de 2026, con alcance final Codex y Claude en ambos
repositorios. Se conservan todos los doce workflows de OpenSpec 1.14.1.

- CLI global y local ejecutables y versión exacta comprobada.
- Bun y pnpm aceptan sus lockfiles congelados sin scripts de terceros.
- Comparación semántica conserva todos los paquetes anteriores del panel, sus
  overrides, parche de braces y dependencias de aplicación. Bun reubica algunos
  aliases de paquetes compartidos al incorporar el tooling; conserva sus artefactos.
- Por proyecto: doce skills Codex, doce skills Claude y doce comandos Claude.
  knowledge:update reproduce los 36 archivos por SHA-256 y solo actualiza dos tools.
- Se eliminaron las integraciones restantes y los registros globales añadidos
  para MiniMax/Hermes. El manifiesto y knowledge:init seleccionan codex,claude.
- Configuración YAML, frontmatter de las siete skills propias, enlaces locales,
  formato y diff revisados sin errores; lint del wrapper sin incidencias.
- OpenSpec estricto acepta la ampliación sin deltas y las siete specs vigentes.

La base inicial se conserva como evidencia histórica de su versión y perfil.
La adopción API/móvil se registra en el repositorio vecino. No se ejecutan suites
del producto, builds, migraciones o cambios de producción por instalar workflows.
