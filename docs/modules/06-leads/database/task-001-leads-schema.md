# Database task 001: esquema y ciclo de leads

## Navegación

- **Código:** DB-LEAD-001
- **Vienes de:** `../LEARNING-PATH.md`, parte A paso 1.
- **Regresa a:** `../LEARNING-PATH.md`, parte A paso 2.
- **No continúes hasta:** constraints de status, score, loss y tenant queden explícitos.

## lead_sources

Campos: `id uuid PK`, `organization_id uuid not null`, `code varchar(60) not null`, `name varchar(100) not null`, `is_system boolean default false`, `is_active boolean default true`, timestamps.

Una organización es lado **uno** y tiene **muchas** fuentes. FK no nullable `organization_id`, `onDelete: RESTRICT`. Las fuentes estándar se copian como reference data para cada tenant; no existe una fila global nullable que debilite las FKs compuestas. Declara `UQ_lead_sources_organization_id_id` y unique `(organization_id, code)`.

## leads

| Campo                    | Tipo          | Null | Default  | Regla                      | Motivo                      |
| ------------------------ | ------------- | ---: | -------- | -------------------------- | --------------------------- |
| id                       | uuid          |   no | generado | PK                         | Identidad estable.          |
| organization_id          | uuid          |   no | —        | FK organizations.id        | Aísla tenant.               |
| owner_member_id          | uuid          |   sí | null     | FK organization_members.id | Responsable de seguimiento. |
| source_id                | uuid          |   sí | null     | FK lead_sources.id         | Atribución.                 |
| first_name               | varchar(100)  |   no | —        | no vacío                   | Identidad.                  |
| last_name                | varchar(120)  |   no | —        | no vacío                   | Identidad.                  |
| company_name             | varchar(180)  |   sí | null     | —                          | Contexto B2B.               |
| email / normalized_email | varchar(254)  |   sí | null     | formato/índice             | Contacto y búsqueda.        |
| phone                    | varchar(30)   |   sí | null     | formato permitido          | Contacto.                   |
| status                   | varchar(30)   |   no | NEW      | estado permitido           | Ciclo de calificación.      |
| score                    | smallint      |   no | 0        | entre 0 y 100              | Prioridad actual.           |
| estimated_value          | numeric(19,4) |   sí | null     | mayor o igual a cero       | Potencial comercial.        |
| currency                 | char(3)       |   sí | null     | requerida si hay valor     | Interpreta monto.           |
| notes                    | text          |   sí | null     | —                          | Contexto inicial.           |
| next_follow_up_at        | timestamptz   |   sí | null     | —                          | Próxima acción.             |
| converted_at             | timestamptz   |   sí | null     | solo CONVERTED             | Métrica/evidencia.          |
| lost_reason              | varchar(255)  |   sí | null     | requerida para LOST        | Análisis de pérdida.        |
| created_at / updated_at  | timestamptz   |   no | now      | —                          | Trazabilidad.               |
| archived_at              | timestamptz   |   sí | null     | posterior a created_at     | Archivo sin pérdida.        |

Organization es lado uno y leads lado muchos, `onDelete: RESTRICT`. Membership es lado uno y muchos leads asignados; FK compuesta nullable `(organization_id, owner_member_id)` usa `onDelete: RESTRICT`. Source es lado uno y muchos leads; FK compuesta nullable `(organization_id, source_id)` usa `onDelete: RESTRICT`. Ambas referencias quedan tenant-safe en la base.

Declara `UQ_leads_organization_id_id`. Índices por tenant/status, owner, source, next follow-up, created date, normalized email y company.

## lead_status_history

Campos: `id`, `organization_id`, `lead_id`, `from_status null`, `to_status not null`, `reason null`, `changed_by_member_id null`, `created_at`.

Lead lado uno, histories lado muchos. FK compuesta `(organization_id, lead_id)` referencia `leads(organization_id, id)`, `onDelete: RESTRICT`; actor usa `(organization_id, changed_by_member_id)` y `SET NULL (changed_by_member_id)` para conservar organization. Append-only.

## lead_scores

Campos: `id`, `organization_id`, `lead_id`, `score smallint`, `reason varchar(255)`, `calculated_by varchar(30)`, `created_by_member_id null`, `created_at`.

Lead lado uno, scores lado muchos. FK compuesta `(organization_id, lead_id)`, `onDelete: RESTRICT`; actor opcional usa FK compuesta y `SET NULL (created_by_member_id)`. CHECK 0–100. `leads.score` es el valor actual y se actualiza en la misma transacción que inserta history.

## Estados y checks

NEW, CONTACTED, QUALIFIED, UNQUALIFIED, FOLLOW_UP, CONVERTED, LOST. `converted_at` y `lost_reason` deben concordar con estado. No crees todavía FKs a customer/contact/deal.

## Ciclo de migración

    pnpm migration:show
    pnpm migration:generate src/database/migrations/CreateLeadLifecycle
    pnpm migration:run
    pnpm migration:revert
    pnpm migration:run
