# Design

## Evidencia

`Plaza 15 de mayo.xlsm` contiene cinco hojas ocultas: Valores, Clas_AT, DPA,
Jerarquia y Calculos. Las casillas afirmativas de las filas 260, 261 y 272 se
enlazan con Jerarquia!B79, B80 y B81. Las fórmulas asignan 2, 2 y 3 puntos cuando
esas celdas son TRUE. El archivo conserva No, Sí y ninguna selección,
respectivamente, y obtiene 2 puntos de Promoción y 31 puntos totales.

No ejecutar macros ni fórmulas del archivo. El importador lee casillas y
resultados guardados; la API calcula mediante funciones explícitas.

## Brief de interfaz

Usuario: operador institucional. Objetivo: importar la ficha sin completar datos
que desconoce. Decisión: conservar el dato original o editarlo si tiene una
fuente. Información mínima: pregunta, respuesta y significado de Sin confirmar.
Acción principal: guardar y enviar al flujo de revisión existente.

Las preguntas de Promoción ofrecen Sí, No y Sin confirmar con el código existente
SIN_INFORMACION. La ausencia o selección ambigua no produce una instrucción de
corrección obligatoria. Plan No e inclusión Sí conserva ambos datos y un aviso
explicativo sin exigir una respuesta inventada. La referencia del puntaje explica
que una casilla sin marcar aporta cero, manteniendo el total original separado
de la valoración guardada por la API.

## Contrato y estados

Mantener RHF, etiquetas flotantes, observaciones, secciones pendientes y protección
de respuestas tardías. Incluido en plan nulo de clientes anteriores sigue siendo
compatible. Sin confirmar no convierte el dato en No y no suma puntos.

No cambia sesión, permisos, revisión, auditoría ni validación de medios con
catálogos. La API conserva todos los demás requisitos de publicación. Desplegar
migración y API antes del panel; no ocultar errores de una versión antigua.

## Comprobación

Lectura estática del libro original, contraste de fórmulas con el motor de la API,
tipos, lint, formato, build y estructura OpenSpec. Registrar aparte las pruebas y
operaciones de base compartida no ejecutadas.
