# Development task 002: consulta, export y retención

## Navegación

- Código: `DEV-AUD-002`.
- Vienes de: `../LEARNING-PATH.md`, Parte B paso 2.
- Regresas a: Parte B paso 3.
- Rama: `sdd/add-audit-query-retention`.

## Permisos y DTOs

- `audit:read`: lista, detail y timeline de negocio.
- `security-logs:read`: security events; no se deriva del anterior.
- Export requiere `audit:read` más `exports:create`; download agrega
  `exports:read`.
- Preview/execute de retention requieren `system-admin:access` más `audit:read`;
  el primer permiso no sustituye al permiso del owner.

Todos requieren identity, membership activa y `X-Organization-Id`.

`AuditLogQueryDto`: action allowlisted, entityType, entityId, actorUserId,
source, dateFrom/dateTo, cursor, limit y sort descendente fijo. `SecurityLogQueryDto`
agrega eventType/outcome/reasonCode sin búsqueda libre sobre metadata.

`AuditRetentionPreviewDto`: cutoff opcional restringido por policy.
`ExecuteAuditRetentionDto`: expectedCutoff, expectedEligibleCount, reason e
idempotency key; evita ejecutar una preview vieja accidentalmente.

## Endpoints

| Método/path                                             | Resultado                    |
| ------------------------------------------------------- | ---------------------------- |
| `GET /api/v1/audit-logs`                                | Lista redactada tenant-safe  |
| `GET /api/v1/audit-logs/:id`                            | Detail según permission      |
| `GET /api/v1/audit-logs/entities/:entityType/:entityId` | Timeline de entity           |
| `GET /api/v1/security-logs`                             | Lista sensible tenant-safe   |
| `POST /api/v1/audit-logs/export`                        | Export Job, no file síncrono |
| `POST /api/v1/audit-retention/preview`                  | Cutoff/conteos sin borrar    |
| `POST /api/v1/audit-retention/execute`                  | Purge batch autorizado       |

No existen update/delete by ID. EntityType/action/filter son allowlists, no
table names. Cursor usa occurred_at + id y pertenece al tenant/query; no aceptar
un cursor de otra organization.

## Response y datos sensibles

Lista omite snapshots por default. Detail aplica redacción otra vez como defensa,
no expone subject_hash, full IP a quien solo tiene audit read, error técnico ni
metadata interna. Security permission puede ver IP según policy, nunca subject
original, token o password.

## Export

Solicita un `export_job` de resource `AUDIT_LOGS` con filters allowlisted y actor.
Import/Export vuelve a verificar permission al generar y descargar. Audit
registra `AUDIT_LOGS_EXPORTED` con filters resumidos, row count y export job ID,
no file contents.

## Retention

Platform owner entrega policy de organization. Si está disabled o ausente, no
borra. Aplica mínimo configurado por producto; un request no puede acortar la
retención. No elimina rows más nuevas que cutoff ni logs bajo una policy futura
de legal hold.

Flujo:

1. Preview cuenta por tipo usando cutoff y tenant.
2. Execute vuelve a leer policy y compara expected values.
3. Reclama un advisory lock tenant/retention.
4. Borra batches por occurred_at + id en transacciones cortas.
5. Registra conteos y cutoff en un nuevo `SECURITY_LOG_RETENTION_EXECUTED`
   posterior al cutoff.
6. Devuelve total y duración; retry con misma key no repite resultado lógico.

Administration solo orquesta este service; no ejecuta SQL sobre audit tables.

## Audit de lectura

No generes una fila por cada GET ordinario porque podría crear recursión y ruido.
Sí registra export, consulta masiva sensible si la policy lo exige y retention.

## Definition of Done

- [ ] Header/permissions separan audit, detail y security.
- [ ] Cursor y filters son tenant-safe/allowlisted.
- [ ] Export usa job y reautorización.
- [ ] Retention consume Platform policy y usa preview/confirm/lock/batches.
- [ ] Purge summary sobrevive al cutoff.
- [ ] No existe delete arbitrario ni SQL dinámico.
