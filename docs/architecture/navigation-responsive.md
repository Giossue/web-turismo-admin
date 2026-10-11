# Navegación, móvil y accesibilidad

## Estado actual

`shell/sections.ts` centraliza destinos, labels y disponibilidad por rol.
El administrador accede a resumen, revisión, opiniones, centros, catastro,
catálogos, usuarios, actividad y configuración. El agente accede a centros,
catastro y configuración; el editor se abre desde el flujo y no es un destino
independiente del menú.

La URL usa `?section=…`, y código, búsqueda o página según el apartado. Conservar
los nombres y su validación. La navegación del navegador no autoriza registros.

El panel no tiene barra superior global: tema, configuración y cierre viven en
el popover de la cuenta al pie del menú. En móvil, el control junto al título
abre la navegación. No crear otra cabecera para ajustarse a la plantilla.

## Criterios para nuevas áreas

Preferir hasta dos niveles y destinos reconocibles por trabajo. Una nueva
colección con acciones y permisos propios debe tener destino y contexto claros.
Las pestañas pueden servir para vistas del mismo conjunto o detalle agrupado.

Catálogos y revisión tienen pestañas existentes con flujos propios. Se conservan
como excepción registrada en ADR 0001; convertirlas en submódulos exige diseñar
y especificar navegación, enlaces y retorno. Tampoco existe reordenación
persistente del menú y no debe presentarse como función instalada.

## Layout y temas

Máximo de contenido compartido de 1200 px. Drawer de escritorio y navegación
móvil con los mismos destinos autorizados. Tablas desde 600 px y tarjetas en
móvil; campos y toolbars adaptables sin solapamientos.

Tema claro inicial y oscuro elegible, con preferencia persistida. Conservar
contraste y legibilidad en diálogo, popover, Snackbar, grid y selector de mapa.
No cambiar la preferencia inicial a sistema como consecuencia del knowledge.

## Accesibilidad

Usar labels asociados, foco visible, heading lógico y nombres accesibles para
iconos. Diálogos y drawer deben gestionar foco y permitir cancelación segura.
No depender de hover o color para operar o entender el estado. Permitir pegar
contraseñas y usar gestores de credenciales.

Como criterio de diseño, controles táctiles principales de al menos 44 px,
zoom 200 %, texto ampliado y WCAG 2.2 AA. Cuando se solicite validación visual,
incluir 320, 768, 1024 y 1440 px, teclado y movimiento reducido. No declarar
cumplimiento certificado a partir de una revisión de código.
