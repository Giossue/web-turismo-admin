# Producto: portal administrativo de Turismo Vinculación

## Propósito

Dar al personal institucional una superficie para capturar, revisar y mantener
información turística de Ecuador. La app móvil presenta el contenido a turistas;
esta web sirve al trabajo administrativo.

## Usuarios y objetivos

| Usuario                      | Trabajo principal                                                       |
| ---------------------------- | ----------------------------------------------------------------------- |
| Administrador                | Revisar propuestas, publicar, moderar opiniones y gestionar catálogos   |
| Agente turístico             | Capturar y mantener las fichas y catastros que la API le permite operar |
| Cuenta sin rol institucional | Recibir una denegación de acceso al panel                               |

## Capacidades documentadas

- Acceso institucional, renovación y cierre de sesión.
- Inventario y editor de fichas con 14 apartados, guardado y revisión editorial.
- Catastro por localidad, clasificación, ubicación y multimedia.
- Catálogos, opciones retiradas y relaciones dependientes.
- Revisión de propuestas y moderación de opiniones.
- Consulta de usuarios, actividad y avisos del panel.
- Importación de una ficha MINTUR para precargar el editor.
- Captura de coordenadas por mapa o permiso explícito del dispositivo.

Los escenarios de comportamiento están en [OpenSpec](../../openspec/specs/).
Los controles y límites actuales están en [seguridad](../security/controles.md).

## Fronteras del producto

La API decide identidad, permisos, acceso a cada registro, publicación, persistencia
y auditoría. El endpoint de importación analiza sin guardar. El editor puede
persistir apartados y fotos cuando existe un código de ficha; publicar requiere
el flujo de revisión institucional.
La asistencia editorial propone texto para revisión humana.

El portal no administra conexiones a bases, buckets, colas ni cuentas del proveedor
de IA. No ofrece registro turístico público ni un sitio turístico paralelo.
Una solicitud de adaptar el knowledge conserva los flujos actuales: cualquier
nuevo permiso, destino o regla de publicación se especifica como cambio propio.
