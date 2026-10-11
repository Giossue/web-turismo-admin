# Principios de seguridad

- Tratar el navegador, archivos y respuestas externas como entradas no confiables.
- Identidad y rol proceden de la API; conocer un identificador no autoriza un registro.
- Aplicar permisos por acción y registro en servidor, con denegación por defecto.
- Mantener secretos en su servidor responsable, fuera de repositorio, logs y bundles.
- Validar forma, rango, longitud, contenido y consumo de recursos en cada frontera.
- Conservar cancelación, invalidación de caché y aislamiento entre sesiones.
- Definir repetición y concurrencia antes de una mutación con efectos.
- Responder con errores útiles sin filtrar contenido privado o detalles internos.
- Solicitar ubicación al activar la función y confirmar antes de incorporar valores.
- Examinar dependencias y archivos generados antes de incorporarlos.
- Distinguir un control local de una garantía remota o distribuida.

Las medidas implementadas y sus límites están en [controles.md](controles.md).
Las decisiones de diseño están en [acceso](access-control.md),
[hardening](hardening.md) y [modelo de amenazas](threat-model.md).

Las credenciales locales, incluida `.pgpass`, solo se consumen en memoria para
operaciones autorizadas del repositorio que administra los datos. El portal no
necesita acceder a ellas ni conocer credenciales de producción para funcionar.
