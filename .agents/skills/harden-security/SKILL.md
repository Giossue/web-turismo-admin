---
name: harden-security
description: Revisa o endurece fronteras de sesión, permisos, archivos, ubicación, API y despliegue de Web Turismo Admin cuando hay un riesgo concreto.
---

# Endurecer una frontera

Leer [controles vigentes](../../../docs/security/controles.md),
[acceso](../../../docs/security/access-control.md),
[hardening](../../../docs/security/hardening.md) y la arquitectura afectada.

- Identificar entrada no confiable, autoridad, validación, resultado y límite de recursos.
- Resolver el [brief sensible](../../../docs/architecture/backend.md): usuario,
  registro, repetición, concurrencia, auditoría y posibles fugas.
- Mantener identidad y roles de la API; no confiar en un ID ni un gate del cliente.
- Preservar generación/caché de sesión, cierre pendiente, validación ZIP/XML,
  aislamiento/cancelación del worker, CSP/nonces y runtime sin root.
- Revisar campos explícitos, timeout y resultado incierto de escrituras.
- Para pruebas solicitadas, cubrir rechazo y carreras; no reducir un caso adversario
  ni relajar un control para aprobarlo.
- Reportar hallazgo, evidencia, corrección, comprobaciones y límites remotos.

No crear tenants, bases o un proveedor de auth para cumplir ejemplos de plantilla.
Registrar cualquier cambio de stack necesario con evidencia y ADR.
