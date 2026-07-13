# Test task 002: consulta y retención de Audit Parte B

## Navegación

- Código: `TEST-AUD-002`.
- Vienes de: `../LEARNING-PATH.md`, Parte B paso 4.
- Regresas a: Parte B para merge.

## Unit

Filter/action/entity allowlists, cursor encode/decode tenant-safe, detail
redaction, retention cutoff/minimum, stale preview, idempotency y batch plan.

## Integration

- Índices soportan timeline/action/actor con `EXPLAIN ANALYZE`.
- Cursor no omite/duplica rows con mismo occurred_at.
- Cross-tenant filters devuelven cero y no revelan existencia.
- Retention disabled no borra.
- Preview/execute con policy válida borra solo older rows del tenant.
- Dos executors compiten por advisory lock sin doble conteo.
- Falla de batch revierte ese batch y permite retry idempotente.
- Summary security log queda después del cutoff.
- Seed dos veces no duplica demo history.

## E2E

List/detail/entity timeline/security list con header, permissions separadas,
date/action filters, cursor, export job, retention preview/execute, stale
confirmation, missing header y UUID cross-tenant. Lista sin detail permission no
incluye old/new values.

Usa test clock y policy corta solo en database test. Nunca reduzcas retention de
development para hacer pasar la suite.

## Definition of Done

- [ ] Unit cubre policy/cursor/redaction.
- [ ] Integration demuestra índices, batches, lock e idempotency.
- [ ] E2E separa permissions y tenant.
- [ ] Export y retention generan audit seguro.
- [ ] Suites pasan solas y en quality gate.
