# Controles de seguridad del portal

## Fronteras y sesión

La API NestJS valida identidad, roles, acceso a registros y mutaciones; este portal no
accede directamente a la base de datos. El access token permanece en memoria y la API
gestiona su cookie de renovación HttpOnly. Ninguna credencial se guarda en `localStorage`.

`AdminSession` invalida las respuestas pendientes al cerrar sesión, cambiar de cuenta,
cambiar de permisos o perder la sesión. La caché privada se vacía en esos cambios. Una
renovación o login tardío no puede restaurar la cuenta anterior. Las solicitudes de la API
administrativa comprueban la generación de sesión antes de devolver datos o reintentar un 401.

El estado `active`, `logout-pending` o `logged-out` se comparte entre pestañas mediante
`BroadcastChannel` (con eventos de almacenamiento como alternativa). Los Web Locks
serializan login, renovación y cierre en navegadores compatibles. Si no se puede revocar
la sesión, se eliminan inmediatamente el token y los datos locales, se muestra el fallo y
se bloquean login y renovación hasta confirmar el cierre. Se reintenta al recuperar la
conexión, recargar o pulsar el botón. Cuando el almacenamiento no está disponible, una
recarga exige un login explícito.

La revocación efectiva de la cookie y de los tokens en el servidor sigue siendo
responsabilidad de la API. El estado local evita reconstruir una sesión que la persona
pidió cerrar, incluso durante una interrupción de la conexión.

## Importación de Excel

Antes de leer el cuerpo, `/api/admin/ficha/import` consulta `/auth/me`, exige una identidad
válida con rol `ADMINISTRADOR` o `AGENTE_TURISTICO` y obtiene catálogos autorizados.
Estas llamadas comparten un plazo de cinco segundos. El cuerpo multipart se lee con un
máximo de 20 MiB más 64 KiB de envoltorio y un plazo total de treinta segundos.

| Recurso                         | Límite                                                                |
| ------------------------------- | --------------------------------------------------------------------- |
| Importaciones simultáneas       | 2 por proceso, incluidas las cargas                                   |
| Intentos por cuenta             | 12 por minuto y proceso                                               |
| Cuentas en memoria de cuotas    | 1024; las entradas caducan al minuto                                  |
| Entradas ZIP                    | 2048, sin nombres duplicados ni rutas inseguras                       |
| Entrada descomprimida           | 16 MiB                                                                |
| Total descomprimido             | 64 MiB                                                                |
| Relación de compresión          | 200:1 por entrada, incluidos los bytes reales                         |
| XML                             | 500 000 nodos y profundidad 64; sin DTD                               |
| Hojas                           | 4096 filas y 256 columnas para celdas y dimensiones                   |
| Celdas del libro                | 300 000                                                               |
| Área total de celdas combinadas | 200 000                                                               |
| Worker                          | 15 segundos; heap antiguo 192 MiB, joven 32 MiB, pila 4 MiB           |
| Fotos extraídas                 | 20; hasta 5 MiB por foto y 20 MiB en total; PNG/JPEG con firma válida |

`yauzl` descomprime las entradas de forma secuencial y verifica sus tamaños. Los contadores
limitan también los bytes reales si el directorio ZIP miente. El XML se valida antes de
reconstruir un ZIP STORE para ExcelJS y el lector de controles. Los estilos de columnas de
la plantilla oficial pueden abarcar las 16 384 columnas nativas de Excel, aunque sus celdas
y dimensiones quedan limitadas a 256. Las macros, fórmulas y enlaces externos no se ejecutan.

El análisis completo corre en un worker. Se termina cuando se cancela la petición, vence
el plazo, falla el procesamiento o se supera su heap. Los límites del heap no incluyen
los buffers nativos: el límite ZIP y las reservas de concurrencia acotan esos buffers.
Dimensiona la memoria del contenedor con margen para Next.js y dos workers; el host debe
aplicar su propio límite de memoria al contenedor. En despliegues con varias réplicas, las
cuotas de este portal son independientes; configura también límites globales en el proxy/API.

Las respuestas de importación usan `private, no-store`. Los errores inesperados no
registran el archivo, credenciales ni contenido de la ficha.

## Navegador y despliegue

- CSP con nonce aleatorio de 128 bits por respuesta; scripts con `strict-dynamic`, sin
  `unsafe-inline` ni `unsafe-eval` en producción. Los estilos de MUI reciben el mismo nonce.
- Los atributos de estilo están permitidos para MUI/MapLibre. Los workers de MapLibre se
  sirven desde la propia web. Conexiones, imágenes y multimedia se limitan a los orígenes
  configurados de la API y del mapa; un estilo con proveedores adicionales requiere revisar
  explícitamente esos orígenes en la política.
- `frame-ancestors 'none'`, `frame-src 'none'` y `X-Frame-Options: DENY`.
- `nosniff`, `Referrer-Policy: no-referrer`, permisos de cámara/micrófono desactivados y
  geolocalización limitada al propio origen. El GPS conserva su solicitud explícita.
- HSTS por un año en producción. Sirve la web mediante HTTPS.
- Páginas dinámicas, sin caché compartida, y sin encabezado `X-Powered-By`.
- El optimizador de imágenes de Next.js está deshabilitado porque el portal no lo utiliza.
- `.dockerignore` excluye archivos de entorno y el contenedor ejecuta Node como `node`.
  Los valores públicos se inyectan durante el build; los secretos pertenecen a la API y
  al gestor de despliegue. `prepare-standalone.mjs` elimina los archivos `.env*` que Next.js
  puede copiar de un build local y prepara los assets. Se ejecuta después del build tanto
  con Bun como en el Dockerfile. Construye la imagen usando su contexto filtrado.

## Dependencias y parche mantenido

Next.js y su configuración ESLint están actualizados; el lockfile incluye las versiones
corregidas de `sharp`, `source-map-js` y `uuid`. ExcelJS usa UUID v4 y mantiene compatibilidad
con UUID 11.1.1, que ofrece CommonJS.

`braces` 3.0.3 llega mediante las herramientas ESLint de Next.js. A fecha del 10 de octubre
de 2026, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) no tiene
versión oficial reparada. `patches/braces@3.0.3.patch`, aplicado por Bun mediante
`patchedDependencies`, limita el anidamiento a 256 tanto al parsear como al recibir un AST
directamente. El parche debe copiarse antes de `bun install` en el contenedor.

`bun audit --json` sigue identificando la versión original de `braces` y comunica este
aviso aunque el código instalado esté parcheado. No se ignora el identificador ni se
altera la versión para ocultarlo. Las pruebas de regresión verifican compilación,
expansión, parseo y stringify con patrones válidos y anidamientos adversarios. Sustituye
el parche cuando exista una versión oficial corregida, después de repetir esas pruebas.

## Verificación

```bash
bun install --frozen-lockfile
bun run verify
bunx playwright install chromium
bun run test:browser
bun audit --json
```

Las pruebas incluyen la bomba ZIP, tamaños falsificados, límites estructurales, carga
interrumpida, concurrencia, cuotas, importación válida, renovación tardía, cierre fallido,
cambio de cuenta, nonces y el parche de `braces`. Playwright comprueba el build de
producción, la hidratación de MUI, el bloqueo de scripts inline, el cierre entre pestañas,
la persistencia del cierre y el mapa/GPS con una API simulada.
También comprueba el endpoint de importación en el servidor standalone real, con su worker
de Node y una API simulada que escucha en el puerto local 4318.
