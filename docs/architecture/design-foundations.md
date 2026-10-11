# Fundamentos visuales reales

Las fuentes de valores son [webTokens](../../src/theme/tokens.ts) y
[theme](../../src/theme.ts). Los documentos explican su uso; no mantienen otra
paleta o escala numérica independiente.

| Área        | Contrato vigente                                                                      |
| ----------- | ------------------------------------------------------------------------------------- |
| Color       | Paleta verde institucional y tokens semánticos MUI para fondo, texto, borde y estados |
| Tema        | `colorSchemes` claro/oscuro; claro inicial y preferencia explícita persistida         |
| Tipografía  | Inter local y variantes del tema, sin tamaños distintos por módulo                    |
| Espacio     | Unidades de spacing MUI y tokens de página, superficie, sección y controles           |
| Superficie  | Radio base de 8 px, borde fino compartido y elevación para overlays                   |
| Layout      | Ancho `lg` de 1200 px; drawer de 240 px y márgenes adaptables                         |
| Formularios | Altura y padding compartidos; etiquetas flotantes conservadas                         |
| Capas       | Contratos de MUI para drawer, diálogo, popover y Snackbar                             |

Preferir relación por espacio, alineación y tipografía antes de añadir un marco.
Una extensión de tokens es una decisión compartida; no introducir valores
arbitrarios o colores particulares en cada pantalla.

## Estados y movimiento

Cada control necesita estado inicial, hover, foco visible, activo, deshabilitado
y pendiente; también error, lectura y selección cuando correspondan.
Mantener geometría al mostrar el indicador circular de carga existente.
La UI debe reaccionar al gesto antes de que termine la petición.

Usar transiciones del sistema cuando explican un cambio y respetar
`prefers-reduced-motion`. El Snackbar ya elimina su transición con movimiento
reducido. No importar una librería de animación sin una necesidad demostrada.

## Accesibilidad visual

Estado acompañado de texto o icono, además de color. Contraste objetivo WCAG 2.2
AA: 4.5:1 en texto normal y 3:1 en texto grande y controles relevantes.
Probar foco y legibilidad en claro y oscuro cuando se solicite verificación.
Estos son criterios de aceptación; no constituyen una certificación del portal.

No cambiar el tema inicial, tipografía ni variantes existentes para igualar las
escalas ilustrativas de CognitiveStack.
