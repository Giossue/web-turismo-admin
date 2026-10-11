# Design

## Context

El archivo marca J129 (Alterado) y no marca E/J/P/U141 (estado del entorno).
Jerarquia!B38 es TRUE; B41:B44 son FALSE. C35 suma 5 puntos: la ausencia del
entorno aporta cero. Ambos componentes tienen Humedad, Clima y Expansión urbana.
El parser y el mapper ya conservan respectivamente null y un estado vacío.

## Goals / Non-Goals

Conservar el contenido original y permitir el flujo institucional con API
compatible. No deducir un estado de los factores ni recalcular fórmulas o macros.

## Decisions

Usuario: operador institucional. Objetivo: revisar y guardar lo importado.
Decisión: conservar Sin confirmar o seleccionar un estado conocido. Información
mínima P0: componente y estado; P1: observación y factores; P2: declaratorias;
P3: explicación del dato desconocido. Acción principal: guardar el apartado con
los controles actuales; la aprobación sigue en revisión.

El select conserva los cuatro estados MINTUR y usa su opción vacía existente
como Sin confirmar; el writer sigue enviando null y no amplía el enum del Excel.
La API conserva null y los factores mediante una evaluación por componente.
Su estado explícitamente nulo es una respuesta válida para el progreso del paso.
Los estados desconocidos aportan cero en el cálculo existente.

## Risks / Trade-offs

Desplegar primero `20261011_conservation_unknown_state.sql` y la API compatible,
después el panel. El texto del cliente no elimina un rechazo de la API antigua.
Una ficha ya importada no necesita reemplazarse: el borrador ya contiene el
estado nulo y los factores. Se mantienen errores de catálogo y autorización.
La comprobación local no certifica una publicación remota.
