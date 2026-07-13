# Database task 001: configuración de reportes

## Navegación

- Código: `DB-RPT-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 1.
- Regresas a: paso 2.
- Rama: `sdd/add-reports-dashboards`.

Estas tablas guardan definiciones y preferencias; no duplican customers, deals,
orders o tickets ni almacenan resultados que puedan quedar obsoletos.

## `report_definitions`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | uuid PK | PostgreSQL |
| `organization_id` | uuid FK | requerido |
| `code` | varchar(100) | estable por tenant |
| `name` | varchar(160) | requerido |
| `description` | text | nullable |
| `domain` | varchar(50) | `SALES`, `CRM`, `INVENTORY`, `SUPPORT` |
| `query_key` | varchar(100) | referencia a executor registrado |
| `definition` | jsonb | dimensions, metrics y filters allowlisted |
| `required_permission` | varchar(120) | requerido |
| `default_date_range_days` | integer | positivo y acotado |
| `max_date_range_days` | integer | positivo, mayor al default |
| `is_system` | boolean | reference definition |
| `is_active` | boolean | default true |
| timestamps | timestamptz | requeridos |

Unique `organization_id, code`; índice organization/domain/active. Check de date
ranges. Organization es lado uno, definitions lado muchos, FK `RESTRICT`.
`query_key` nunca es SQL: selecciona un executor compilado y revisado.

## `saved_reports`

Campos: `id`, `organization_id`, `report_definition_id`, `owner_member_id`,
`name`, `visibility PRIVATE/ORGANIZATION`, `filters jsonb`, `columns jsonb`,
`sort jsonb`, `is_default`, timestamps y `archived_at`.

Definition y member son lado uno, saved reports lado muchos. FKs `RESTRICT` para
conservar ownership; organization `RESTRICT`. Unique
`organization_id, owner_member_id, name` para activos. Índices owner/archived y
organization/visibility. Checks: PRIVATE requiere owner; filters/columns/sort se
validan contra definition en application.

## `dashboard_widgets`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | uuid PK | PostgreSQL |
| `organization_id` | uuid FK | requerido |
| `report_definition_id` | uuid FK | requerido |
| `owner_member_id` | uuid FK | nullable para widget organizational |
| `scope` | varchar(20) | `PERSONAL` o `ORGANIZATION` |
| `title` | varchar(160) | requerido |
| `widget_type` | varchar(30) | `KPI`, `TABLE`, `BAR`, `LINE`, `FUNNEL` |
| `configuration` | jsonb | metric/dimension/filter allowlisted |
| `position_row`, `position_column` | integer | no negativos |
| `width`, `height` | integer | rangos de grid |
| `is_visible` | boolean | default true |
| timestamps | timestamptz | requeridos |

Checks de scope/owner y dimensiones. Organization, definition y owner son lado
uno; widgets lado muchos. FKs `RESTRICT`. Unique de posición por dashboard scope
y owner para evitar dos widgets en la misma celda; índices por organization,
scope, owner y visible.

## Índices en tablas propietarias

Antes de agregar índices a deals, orders, leads, inventory o tickets, relaciona
cada uno con una query real y coordina la migración con el owner module. No
copies datos a Reporting para evitar un join. Como mínimo revisa organization +
status/date/owner en las tablas fuente y usa `EXPLAIN ANALYZE` con datos demo.

## Migración

Nombre `CreateReportingConfiguration`; orden definitions, saved reports,
widgets. En reversión no toca tablas de dominio. Ejecuta `run -> revert -> run`.

## Definition of Done

- [ ] Ningún campo permite SQL arbitrario.
- [ ] JSON tiene schema lógico y executor allowlisted.
- [ ] Personal/organization scope tiene checks y FKs.
- [ ] Relaciones documentan uno/muchos/onDelete.
- [ ] Índices fuente están justificados por plan de consulta.
- [ ] Migración se probó en base limpia.
