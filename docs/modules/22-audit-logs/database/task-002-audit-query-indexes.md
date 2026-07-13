# Database task 002: índices para consulta y retención

## Navegación

- Código: `DB-AUD-002`.
- Vienes de: `../LEARNING-PATH.md`, Parte B paso 1.
- Regresas a: Parte B paso 2.
- Rama: `sdd/add-audit-query-retention`.

## Decisión: no crear otra tabla

Retention policy pertenece a Platform settings. Audit consume
`audit.retention_enabled`, `audit.retention_days` y
`security_logs.retention_days` por organization. No crea
`audit_retention_settings` ni `administration_settings`.

## Índices de `audit_logs`

| Nombre                               | Columnas                                                  | Consulta                    |
| ------------------------------------ | --------------------------------------------------------- | --------------------------- |
| `IDX_audit_logs_org_occurred_id`     | organization_id, occurred_at DESC, id                     | timeline/paginación estable |
| `IDX_audit_logs_org_action_occurred` | organization_id, action, occurred_at DESC                 | filtro action               |
| `IDX_audit_logs_org_entity`          | organization_id, entity_type, entity_id, occurred_at DESC | historial entity            |
| `IDX_audit_logs_org_actor`           | organization_id, actor_member_id, occurred_at DESC        | actividad actor tenant      |

## Índices de `security_logs`

| Nombre                                     | Columnas                              | Consulta              |
| ------------------------------------------ | ------------------------------------- | --------------------- |
| `IDX_security_logs_org_occurred_id`        | organization_id, occurred_at DESC, id | consulta tenant       |
| `IDX_security_logs_event_outcome_occurred` | event_type, outcome, occurred_at DESC | detección/reporte     |
| `IDX_security_logs_user_occurred`          | user_id, occurred_at DESC             | identity timeline     |
| `IDX_security_logs_subject_occurred`       | subject_hash, occurred_at DESC        | intentos no resueltos |

Retention usa el índice de occurred_at; para security logs sin organization se
requiere también `occurred_at` global. Evalúa tamaño con `EXPLAIN ANALYZE`; no
agregues GIN sobre JSON por posibilidad futura.

## Migración

Nombre `AddAuditQueryIndexes`. No modifica snapshots ni inserta settings. Si una
tabla grande requiere creación concurrente en producción, documenta que
`CREATE INDEX CONCURRENTLY` no corre dentro de la transacción normal de
migración y diseña el despliegue; en aprendizaje/test usa el flujo seguro
compatible con el volumen actual.

Completa `run -> inspect plans -> revert -> run`.

## Definition of Done

- [ ] Cada índice corresponde a endpoint/retention concreto.
- [ ] No se duplican prefixes equivalentes sin medir.
- [ ] No se crea tabla de policy.
- [ ] Paginación usa occurred_at + id, no offset ilimitado.
- [ ] Migración se probó y planes usan tenant index.
