# Database task 001: schema de Automations y dispatcher outbox

## Navegación

- Código: `DB-AUTO-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 1.
- Regresas a: paso 2.
- Rama: `sdd/add-automations`.

## Prerrequisito `outbox_events`

La tabla ya existe desde Audit Parte A y no se vuelve a crear, renombrar ni
poseer en este módulo. Antes de generar la migración confirma sus columnas de
claim, retry, correlation, causation e idempotency, y que los módulos productores
ya publican con el mismo `EntityManager` del cambio de negocio.

Automations solo agrega consumers/dispatcher y referencias a
`outbox_events.id`. Si la tabla no existe, regresa a Audit A; no copies otra
entity con un nombre alterno.

## `automation_rules`

Campos: `id`, `organization_id`, `name`, `description`, status
`DRAFT/ACTIVE/INACTIVE`, `priority integer`, `stop_on_failure boolean`,
`version integer`, `created_by_member_id`, `activated_at`, `last_run_at`,
timestamps y `archived_at`.

Unique `organization_id, name, version`; índices por organization/status/priority.
Organization y creator son lado uno; rules lado muchos; FKs `RESTRICT`.

## `automation_triggers`

Campos: `id`, `automation_rule_id`, `event_type`, `configuration jsonb`,
`position integer`, timestamps. Una rule es lado uno y tiene muchos triggers;
FK en triggers `CASCADE` mientras la rule siga DRAFT y se borre físicamente. Una
rule activada solo se archiva. Unique rule/position; índice event_type.

## `automation_conditions`

Campos: `id`, `automation_rule_id`, `group_number`, `position`, `field_path`,
`operator`, `comparison_value jsonb`, `logical_connector`, timestamps. Rule es
uno, conditions muchos, FK `CASCADE` bajo la misma regla de draft. Unique
rule/group/position. Checks de operadores/conectores allowlisted.

## `automation_actions`

Campos: `id`, `automation_rule_id`, `position`, `action_type`,
`configuration jsonb`, `continue_on_error`, timestamps. Rule es uno, actions
muchos, FK `CASCADE` solo para draft. Unique rule/position y check action type
allowlisted.

## `automation_runs`

| Campo                       | Tipo         | Regla                                                  |
| --------------------------- | ------------ | ------------------------------------------------------ |
| `id`                        | uuid PK      | PostgreSQL                                             |
| `organization_id`           | uuid FK      | requerido                                              |
| `automation_rule_id`        | uuid FK      | requerido                                              |
| `outbox_event_id`           | uuid FK      | requerido; referencia `outbox_events.id`               |
| `rule_version`              | integer      | snapshot requerido                                     |
| `status`                    | varchar(20)  | `MATCHED`, `SKIPPED`, `SUCCEEDED`, `FAILED`, `PARTIAL` |
| `input_snapshot`            | jsonb        | redactado                                              |
| `condition_result`          | jsonb        | evaluación explicable                                  |
| `step_results`              | jsonb        | acciones, duration y error codes                       |
| `error_code`                | varchar(100) | nullable                                               |
| `started_at`, `finished_at` | timestamptz  | coherentes con status                                  |
| `correlation_id`            | varchar(128) | requerido                                              |

Unique `automation_rule_id, outbox_event_id`. Índices por organization/status/
started_at y rule/started_at. Rule y outbox event son lado uno; runs lado muchos.
FKs `RESTRICT` para conservar historia aunque rule se archive.

## Migración

Nombre `CreateAutomationsSchema`; orden rules, triggers, conditions, actions y
runs. En reversión elimina runs y children antes de rules. Nunca elimina
`outbox_events`, porque su owner y migración pertenecen a Audit A.

Prueba constraints, índices worker y unique run bajo dos transacciones. Completa
`run -> revert -> run` con `synchronize=false`.

## Definition of Done

- [ ] La migración referencia el outbox preexistente sin recrearlo.
- [ ] Rule children tienen orden y catálogos cerrados.
- [ ] Run es único por rule/event e histórico usa RESTRICT.
- [ ] Tenant FKs y consultas tienen índices.
- [ ] Migración fue inspeccionada y revertida.
