# Test task 001: recording de Audit Parte A

## Navegación

- Código: `TEST-AUD-001`.
- Vienes de: `../LEARNING-PATH.md`, Parte A paso 3.
- Regresas a: Parte A para release `v0.2.0`.

## Unit

Redaction recursiva, allowlist, size/depth, subject hash, actor rules y action
registry. Prueba password/token/cookie/authorization en distintos niveles y
confirma que no aparecen en output ni error.

## Integration

- Create/update organization y audit hacen commit juntos.
- Falla audit revierte cambio crítico.
- Login failure sin user/org crea security log.
- Role assignment conserva actor/member/old/new.
- FKs RESTRICT impiden hard delete de identidad referenciada.
- Repositories públicos no exponen update/delete.
- Correlation, IP y timestamp usan tipos correctos.
- Business change, audit y outbox confirman juntos; falla de outbox revierte.
- La misma `organization_id + idempotency_key` no crea dos eventos.
- Insert cross-tenant de outbox es rechazado por la FK compuesta.

## E2E

Login success/failure, logout, refresh reuse, password change, role/permission
change y organization/member lifecycle. Consulta DB solo desde test helper para
confirmar rows; no hay endpoint público Parte A. Responses de auth nunca exponen
si el security log se escribió ni secret metadata.

## Definition of Done

- [ ] Redaction se prueba con datos sensibles reales de fixture.
- [ ] Atomicidad business/audit se demuestra.
- [ ] Security failure no requiere identity resuelta.
- [ ] Tests usan PostgreSQL y tenant fixtures mínimos.
- [ ] Outbox publisher es durable sin depender de Automations.
- [ ] Quality gate y build pasan.
