# Plan activo: repositorio web administrativo

## Objetivo

Separar la experiencia turística móvil de la operación institucional. Este repositorio
contendrá la landing pública y el futuro panel administrativo, mientras la app móvil queda
como el único cliente para turistas.

## Decisiones

- Next.js App Router, React y TypeScript.
- Material UI v7 con `AppRouterCacheProvider` para SSR y tokens centralizados.
- La landing consulta únicamente endpoints públicos de la API NestJS.
- `/admin` queda fuera de la navegación pública y de robots como medida de descubrimiento,
  no como seguridad.
- PostgreSQL, PostGIS, Redis y MinIO siguen detrás de la API; el navegador no se conecta a
  ellos.

## Estado de esta entrega

- Repositorio creado y publicado como privado en GitHub.
- Landing institucional disponible en `/`.
- Esqueleto responsive del panel disponible en `/admin`.
- Configuración de `TURISMO_API_URL` documentada en `.env.example`.
- Autenticación institucional, permisos por rol, formularios y mutaciones quedan pendientes
  hasta disponer de los endpoints protegidos de la API.

## Próxima unidad coherente

Integrar el inicio de sesión institucional con la API, resolver permisos por acción/registro
y luego implementar el flujo de revisión de fichas con estados, observaciones, publicación y
auditoría.
