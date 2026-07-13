# Database task 001: foundation de Audit

## Navegación

- Código: `DB-AUD-001`.
- Vienes de: `../LEARNING-PATH.md`, Parte A paso 1.
- Regresas a: Parte A paso 2.
- Rama: `sdd/add-audit-foundation`.

## `audit_logs`

| Campo                       | Tipo         | Regla                                           |
| --------------------------- | ------------ | ----------------------------------------------- |
| `id`                        | uuid PK      | PostgreSQL                                      |
| `organization_id`           | uuid FK      | requerido para eventos de negocio               |
| `actor_member_id`           | uuid FK      | nullable para SYSTEM, requerido para actor USER |
| `actor_type`                | varchar(20)  | `USER`, `SYSTEM`, `WORKER`, `CLI`               |
| `action`                    | varchar(120) | code estable en inglés                          |
| `entity_type`               | varchar(80)  | requerido                                       |
| `entity_id`                 | uuid         | nullable si la acción no tiene entity única     |
| `old_values`                | jsonb        | nullable y redactado                            |
| `new_values`                | jsonb        | nullable y redactado                            |
| `metadata`                  | jsonb        | allowlist, default vacío                        |
| `ip_address`                | inet         | nullable                                        |
| `user_agent`                | varchar(500) | nullable y truncado                             |
| `correlation_id`            | varchar(128) | requerido                                       |
| `source`                    | varchar(20)  | `API`, `WORKER`, `CLI`                          |
| `occurred_at`, `created_at` | timestamptz  | requeridos; sin `updated_at`                    |

Checks: actor USER requiere membership del mismo tenant; SYSTEM/WORKER/CLI exige
`actor_member_id` null; old/new/metadata deben ser JSON objects;
action/entity no vacíos. Índices iniciales por organization/occurred_at,
organization/entity_type/entity_id y actor_member/occurred_at.

Organization y membership son lado uno; logs lado muchos. La FK tenant-safe es
compuesta `(organization_id, actor_member_id)` y usa `RESTRICT`: memberships y
organizations se archivan, no se borran si sostienen evidencia.
`entity_type/entity_id` no usa FK porque puede apuntar a distintas tablas y debe
sobrevivir al lifecycle del agregado.

## `security_logs`

| Campo                       | Tipo         | Regla                                                                         |
| --------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `id`                        | uuid PK      | PostgreSQL                                                                    |
| `organization_id`           | uuid FK      | nullable: login puede ocurrir antes de elegir tenant                          |
| `user_id`                   | uuid FK      | nullable: login fallido puede no resolver user                                |
| `session_id`                | uuid FK      | nullable                                                                      |
| `event_type`                | varchar(120) | login success/failure, logout, refresh reuse, password/role/permission change |
| `outcome`                   | varchar(20)  | `SUCCESS`, `FAILURE`, `BLOCKED`                                               |
| `reason_code`               | varchar(100) | nullable, no mensaje técnico                                                  |
| `subject_hash`              | char(64)     | nullable; identificador normalizado hasheado, no email crudo                  |
| `ip_address`                | inet         | nullable                                                                      |
| `user_agent`                | varchar(500) | nullable y truncado                                                           |
| `metadata`                  | jsonb        | redactado                                                                     |
| `correlation_id`            | varchar(128) | requerido                                                                     |
| `occurred_at`, `created_at` | timestamptz  | requeridos; sin updated_at                                                    |

Índices por occurred_at, organization/event/outcome, user/event y subject_hash.
FKs nullable usan `RESTRICT` cuando existe referencia. No borrar un log para
permitir borrar user/session; el lifecycle normal revoca/archiva.

## `outbox_events`

Audit Parte A también introduce el registro durable de eventos de dominio. La
tabla no pertenece a Automations: todos los módulos posteriores la necesitan
antes de que exista el motor de reglas.

| Campo             | Tipo           | Null/default   | Regla y motivo                                    |
| ----------------- | -------------- | -------------- | ------------------------------------------------- |
| `id`              | `uuid`         | no; PostgreSQL | Primary key.                                      |
| `organization_id` | `uuid`         | no             | FK tenant; un business event siempre tiene owner. |
| `event_type`      | `varchar(120)` | no             | Code cerrado en registry.                         |
| `aggregate_type`  | `varchar(80)`  | no             | Tipo técnico estable.                             |
| `aggregate_id`    | `uuid`         | no             | ID polimórfico; no FK física.                     |
| `payload`         | `jsonb`        | no; `{}`       | Snapshot mínimo redactado.                        |
| `idempotency_key` | `varchar(180)` | no             | Identidad lógica del evento.                      |
| `correlation_id`  | `varchar(128)` | no             | Trazabilidad request/job.                         |
| `causation_id`    | `uuid`         | sí             | Evento que originó este evento.                   |
| `recursion_depth` | `smallint`     | no; `0`        | Guard futuro de Automations.                      |
| `status`          | `varchar(20)`  | no; `PENDING`  | `PENDING`, `PROCESSING`, `PROCESSED`, `FAILED`.   |
| `available_at`    | `timestamptz`  | no; `now()`    | Primer momento de claim.                          |
| `locked_at`       | `timestamptz`  | sí             | Lease del dispatcher.                             |
| `locked_by`       | `varchar(120)` | sí             | Worker owner del lease.                           |
| `attempt_count`   | `integer`      | no; `0`        | Intentos no negativos.                            |
| `last_error_code` | `varchar(100)` | sí             | Error seguro, no stack.                           |
| `created_at`      | `timestamptz`  | no; `now()`    | Orden durable.                                    |
| `processed_at`    | `timestamptz`  | sí             | Solo terminal procesado.                          |

Constraints: `UQ_outbox_events_organization_id_idempotency_key`,
`CK_outbox_events_status_timestamps`, `CK_outbox_events_attempt_count` y
`CK_outbox_events_recursion_depth`. Índices:
`IDX_outbox_events_claim(status, available_at, created_at)`, aggregate,
correlation y organization/created. Organization es lado uno y events lado
muchos; FK compuesta tenant usa `RESTRICT`.

Parte A solo necesita publisher, registro e inspección. El dispatcher, leases,
reintentos y rules se implementan en Automations sin volver a crear la tabla.

## Inmutabilidad

No existen `updated_at`, soft delete ni endpoint de mutación. Repositories
públicos no exponen update/delete. Retention Parte B será el único service con
hard delete por rango, permission y policy.

## Migración

Nombre `CreateAuditAndOutboxFoundation`; orden `audit_logs`, `security_logs` y
`outbox_events` después de sus FK parents. En `down`, elimina estas tablas antes
de constraints. Revertir destruye evidencia/eventos: solo se prueba en database
test desechable.

Completa `run -> inspect -> revert test -> run`; no uses producción o development
con información necesaria.

## Definition of Done

- [ ] Campos cubren la propuesta y correlation/source.
- [ ] Business log requiere organization.
- [ ] Security log admite identity/organization no resueltas.
- [ ] Relationships y RESTRICT conservan evidencia.
- [ ] No hay updated/delete ordinario.
- [ ] Snapshots/metadata son JSON objects con política de redacción.
- [ ] Outbox tiene idempotency, correlation, claim indexes y tenant FK.
- [ ] Migración se probó en test limpio.
