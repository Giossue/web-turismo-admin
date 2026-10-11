# Despliegue del portal

## Empaquetado actual

Docker construye con Node 24 bookworm slim y Bun 1.3.14, instala el lockfile
con el parche de `braces`, compila workers y produce Next.js standalone.
El runtime copia ese resultado y ejecuta `server.js` como usuario `node` en
el puerto 3000, con caché escribible por ese usuario.

El contexto excluye `.env*` salvo el ejemplo, dependencias locales, resultados
de pruebas y configuración de agentes. `prepare-standalone.mjs` retira archivos
de entorno que Next.js pueda copiar y prepara los assets.

## Configuración

| Variable                           | Momento y propósito                         |
| ---------------------------------- | ------------------------------------------- |
| `TURISMO_API_URL`                  | Runtime del servidor; URL de la API         |
| `NEXT_PUBLIC_TURISMO_API_URL`      | Build del navegador; URL pública de la API  |
| `NEXT_PUBLIC_TILESERVER_STYLE_URL` | Build del navegador; URL pública del estilo |

Los valores públicos quedan incorporados al bundle y requieren reconstrucción
para cambiar. Configurar desde Dokploy; no copiar credenciales de API o base al
frontend. Los defaults de localhost son de desarrollo y no identifican producción.

## Seguridad y operación

HTTPS, HSTS y cabeceras comunes. Cada página administrativa obtiene nonce y
renderizado dinámico con caché privada desactivada. El proxy inverso no debe
convertir respuestas privadas en caché compartida.

Aplicar límites de memoria al contenedor y cuotas globales en proxy/API cuando
hay réplicas. Los cupos de importación de la web son por proceso, no distribuidos.
El runtime contiene el worker precompilado y el worker de MapLibre local.

No ejecutar migraciones desde este contenedor. Una función que necesita cambios
de datos requiere la API y migración compatibles antes de desplegar la web.
No afirmar el estado del servidor remoto a partir del Dockerfile.

Guía operativa: [README](../../README.md).
Controles exactos: [seguridad](../security/controles.md).
