# Versionado y entrega

Commit y push requieren solicitud del usuario. Una petición anterior de subir
una entrega no autoriza publicar automáticamente todo trabajo posterior.
Preparar primero un resultado concreto y revisable.

## Unidad y mensaje

Una unidad coherente debe poder revisarse y revertirse sin cambios ajenos.
Mantener documentación y evidencia con el comportamiento que describen.
Separar un refactor de una función distinta; no dividir artificialmente una
misma corrección en commits que dejan el proyecto incompleto.

Usar el idioma del historial y un asunto breve:

```text
docs(knowledge): adapta el contexto de CognitiveStack
fix(auth): descarta respuestas de otra sesión
```

Formato `type(scope): asunto`, scope opcional, menos de 72 caracteres y sin
punto final. Cuerpo corto solo si explica una razón no evidente.

## Antes de publicar

Revisar diff completo, estado y rama; incluir únicamente el trabajo autorizado.
Excluir secretos, `.env` privados, resultados de build y dependencias. Examinar
el lockfile y reportar comprobaciones pendientes de forma explícita.

Usar push normal a la rama acordada. Incorporar cambios remotos cuando haga
falta; no forzar ni reescribir historial publicado sin petición explícita.
Si el proyecto adopta revisión por PR, preparar una rama y PR conforme a ese
flujo; no inventar una protección de rama que no se haya establecido.
