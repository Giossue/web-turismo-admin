# Superficies operativas

Elegir la superficie después de responder el
[brief de pantalla](cognitive-architecture.md). El objetivo es encontrar,
comparar, decidir y actuar con el menor contexto que la tarea requiera.

| Trabajo                                     | Superficie                                                     |
| ------------------------------------------- | -------------------------------------------------------------- |
| Comparar y filtrar registros                | Tabla compartida; tarjetas en móvil según el contrato del grid |
| Crear o editar un registro corto            | Dialog MUI con campos y acciones propias                       |
| Consultar un registro sin perder el listado | Detalle en diálogo o superficie contextual                     |
| Completar una ficha de 14 apartados         | Editor por pasos con resumen final                             |
| Revisar una propuesta                       | Diferencias y decisión institucional                           |
| Ver qué requiere atención                   | Resumen compacto, con métricas que ayuden a decidir            |

## Jerarquía

Una cabecera y una acción principal junto al título. Filtros cerca del listado
que afectan. Identidad y estado reconocibles; atributos secundarios en detalle.
Evitar encabezados repetidos, resúmenes que duplican la tabla y tarjetas usadas
solo para separar cada bloque.

El panel mantiene contenido centrado con máximo de 1200 px. El editor conserva
el orden y los estados de los apartados, el guardado y la navegación entre pasos.
La adaptación de criterios no elimina funciones para hacer caber una composición.

## Lenguaje

Usar nombres y acciones del [glosario](../product/glossary.md): «Guardar ficha»,
«Aprobar y publicar», «Devolver para corregir». Mostrar el registro y la
consecuencia al eliminarlo. Mensajes específicos y breves, sin códigos técnicos,
nombres de proveedor ni referencias a specs en la UI.

## Simplificación

Antes de cerrar un diseño, revisar cada elemento: ¿ayuda a orientarse, decidir
o actuar? Mover lo secundario a detalle y quitar duplicaciones demostradas.
Conservar advertencias persistentes que bloquean de verdad el trabajo y el
feedback necesario para recuperarse de un error.
