# Database task 001: schema de Notifications

## Navegación

- Código: `DB-NOTIF-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 1.
- Regresas a: paso 2.
- Rama: `sdd/add-notifications`.

## `notification_templates`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | uuid PK | PostgreSQL |
| `organization_id` | uuid FK | requerido |
| `code` | varchar(100) | requerido, estable |
| `channel` | varchar(20) | `IN_APP`, `EMAIL` |
| `locale` | varchar(20) | requerido |
| `subject_template` | varchar(250) | nullable para in-app |
| `body_template` | text | requerido |
| `allowed_variables` | jsonb | array validado de nombres |
| `version` | integer | positivo |
| `is_active` | boolean | default true |
| timestamps | timestamptz | requeridos |

Unique `organization_id, code, channel, locale, version`; índice parcial para
la versión activa. Organization es lado uno, templates lado muchos; FK
obligatoria `RESTRICT`.

## `notification_preferences`

Campos: `id`, `organization_id`, `organization_member_id`,
`event_type varchar(100)`, `channel`, `enabled`, `quiet_hours_start time null`,
`quiet_hours_end time null`, `timezone varchar(80)`, timestamps.

Unique `organization_member_id, event_type, channel`. Check: quiet hours están
ambos presentes o ambos null. Organization/member son lado uno y preferences
lado muchos; FKs `RESTRICT`. Valida que membership sea del mismo tenant.

## `notifications`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | uuid PK | PostgreSQL |
| `organization_id` | uuid FK | requerido |
| `recipient_member_id` | uuid FK | requerido |
| `template_id` | uuid FK | nullable para mensaje transaccional controlado |
| `event_type` | varchar(100) | requerido |
| `channel` | varchar(20) | requerido |
| `title_snapshot` | varchar(250) | requerido para in-app/email subject |
| `body_snapshot` | text | requerido |
| `recipient_address` | varchar(320) | nullable; requerido para email y oculto en response |
| `payload` | jsonb | no secretos, default vacío |
| `source_entity_type` | varchar(80) | nullable |
| `source_entity_id` | uuid | nullable, relación polimórfica sin FK |
| `delivery_status` | varchar(20) | `PENDING`, `SENDING`, `SENT`, `FAILED`, `SUPPRESSED` |
| `idempotency_key` | varchar(180) | requerido |
| `scheduled_at`, `sent_at`, `failed_at`, `read_at` | timestamptz | nullable según estado |
| `correlation_id` | varchar(128) | requerido |
| `created_at` | timestamptz | requerido; no updated_at para snapshot |

Unique `organization_id, recipient_member_id, channel, idempotency_key`.
Índices por recipient/read_at/created_at, status/scheduled_at y source entity.
Checks de timestamps según status y `recipient_address` según channel.

Organization, recipient y template son lado uno; notifications es lado muchos.
Organization/recipient usan `RESTRICT`. Template usa `SET NULL` para conservar el
snapshot aunque la plantilla se archive.

## `notification_deliveries`

Campos: `id`, `notification_id`, `attempt_number integer`, `provider`, `status`,
`started_at`, `completed_at`, `response_code nullable`, `error_code nullable`,
`next_retry_at nullable` y `created_at`.

Una notification es lado uno y tiene muchos delivery attempts. FK vive en
deliveries y usa `CASCADE` solo si una operación administrativa autorizada
elimina físicamente una notification demo; en negocio normal notifications se
conservan. Unique `notification_id, attempt_number`; índice por
`status, next_retry_at`.

## Migración

Nombre `CreateNotificationsSchema`; orden templates, preferences, notifications,
deliveries. En `down`, orden inverso. Prueba constraints de same tenant y status.

```powershell
pnpm migration:generate src/database/migrations/CreateNotificationsSchema
pnpm migration:run
pnpm migration:revert
pnpm migration:run
```

## Definition of Done

- [ ] Relaciones documentan uno/muchos/FK/onDelete.
- [ ] Unique idempotency impide duplicado de canal/recipient.
- [ ] Snapshots sobreviven cambios de template.
- [ ] Queries unread y worker tienen índices.
- [ ] Email address no aparece en índices o responses innecesarios.
- [ ] Migración se revirtió y reaplicó.
