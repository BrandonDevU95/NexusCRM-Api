# Test task 001: Automations

## Navegación

- Código: `TEST-AUTO-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 5.
- Regresas a: LEARNING-PATH para release `v0.8.0`.

## Unit

Trigger matching, typed operators, condition groups, action validation, priority,
simulation sin side effects, dependency order, retry decision y recursion guard.
Prueba rechazo de field/action desconocido y payload con secret key.

## Integration

- Owner change y outbox event hacen commit/rollback juntos.
- Dos workers no reclaman el mismo event.
- Unique rule/event evita segundo run.
- Crash/retry no duplica task/activity/notification.
- stop_on_failure y continue_on_error producen status correcto.
- Rule ACTIVE es inmutable y nueva version conserva historia.
- Cross-tenant action reference falla.
- Seed dos veces conserva rules/actions.

Usa PostgreSQL real, dos conexiones para concurrencia y clock controlado para
scheduled triggers.

## E2E

CRUD draft, validation, activation/deactivation, simulation, runs query,
permissions, missing header, membership inactive y cross-tenant IDs. Después
crea un lead Web y confirma outbox -> run -> assignment/task/notification/audit.
Prueba critical ticket y low stock sin enviar email externo.

Incluye una rule que produciría su propio trigger y confirma límite de recursion
sin loop infinito. Response y logs conservan correlation/causation.

## Definition of Done

- [ ] Unit no evalúa código dinámico.
- [ ] Integration demuestra transacciones, locks e idempotency.
- [ ] E2E demuestra flujos reales entre owner modules.
- [ ] Recursion y retry están cubiertos.
- [ ] Tests no dependen del seed global ni servicios externos.
- [ ] Quality gate y build pasan.
