# Database task 002: calendar events y asistentes

**Código:** `DB-CAL-002`
**Vienes de:** `../LEARNING-PATH.md`, paso 2.
**Regresa a:** `../LEARNING-PATH.md`, paso 3.
**No continúes hasta:** que reminders tenga su FK final y check de parent exclusivo.

## Diccionario de datos

### Tabla `calendar_events`

| Columna | Tipo | Regla | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `title` | `varchar(200)` | no nulo | Nombre visible. |
| `description` | `text` | nulo | Detalle. |
| `event_type` | `varchar(30)` | `MEETING` | `MEETING`, `CALL`, `VISIT`, `BLOCK`, `OTHER`. |
| `status` | `varchar(20)` | `CONFIRMED` | `TENTATIVE`, `CONFIRMED`, `CANCELLED`. |
| `organizer_member_id` | `uuid` | no nulo | Membership responsable. |
| `is_all_day` | `boolean` | `false` | Distingue fecha civil de instante. |
| `starts_at` | `timestamptz` | nulo | Inicio timed. |
| `ends_at` | `timestamptz` | nulo | Fin timed. |
| `starts_on` | `date` | nulo | Inicio all-day. |
| `ends_on` | `date` | nulo | Fin all-day inclusivo según contrato. |
| `timezone` | `varchar(80)` | no nulo | Zona IANA para presentación/edición. |
| `location` | `varchar(300)` | nulo | Lugar o enlace saneado. |
| `customer_id`/`contact_id`/`lead_id`/`deal_id` | `uuid` | nulos | Contexto CRM. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría. |
| `cancelled_at` | `timestamptz` | nulo | Coherencia terminal. |
| `archived_at` | `timestamptz` | nulo | Archivo lógico. |

Checks: tipo/estado; título no vacío; si `is_all_day=false`, exige `starts_at` y
`ends_at`, prohíbe dates y exige fin posterior; si `true`, exige `starts_on` y
`ends_on`, prohíbe timestamps y exige rango válido. `CANCELLED` exige
`cancelled_at`. Índices por `(organization_id, starts_at, ends_at)` para timed,
`(organization_id, starts_on, ends_on)` para all-day y por organizer.

Agrega `UQ_calendar_events_organization_id_id` en `(organization_id,id)`.

### Tabla `calendar_event_attendees`

Campos: `id uuid PK`, `organization_id uuid not null`, `calendar_event_id uuid not
null`, `attendee_member_id uuid not null`, `response_status varchar(20) not null default
NEEDS_ACTION`, `is_required boolean not null default true`, `responded_at
timestamptz null`, `response_idempotency_key varchar(150) null`,
`response_request_fingerprint char(64) null`, `created_at timestamptz not null`.

Codes: `NEEDS_ACTION`, `ACCEPTED`, `DECLINED`, `TENTATIVE`. Unique
`UQ_calendar_event_attendees_event_member` en `(calendar_event_id,
attendee_member_id)` e índice `(organization_id, attendee_member_id,
response_status)`. Agrega `UQ_calendar_event_attendees_organization_id_id` si un
subresource futuro la referencia. Response key/fingerprint son ambos nulos o ambos
no nulos, key unique por tenant y fingerprint hexadecimal.

### Tabla `calendar_event_status_history`

Campos completos: `id uuid PK`, `organization_id uuid not null`,
`calendar_event_id uuid not null`, `from_status varchar(20) null`, `to_status
varchar(20) not null`, `actor_type varchar(10) not null default USER`,
`changed_by_member_id uuid null`, `reason varchar(500) null`, `idempotency_key
varchar(150) not null`, `request_fingerprint char(64) not null`, `created_at
timestamptz not null`.

FK compuesta `(organization_id,calendar_event_id)` → calendar events y FK compuesta
de changed member usan `onDelete: RESTRICT`. Checks: status distinto; USER exige
member y SYSTEM exige nulo; fingerprint hexadecimal. Unique `(organization_id,
idempotency_key)` e índice event+created+id. Es append-only.

## Integridad tenant compuesta

Attendees, reminders e history referencian calendar events con
`(organization_id,calendar_event_id)`. Organizer/attendee/changed actor usan FK
compuesta a organization_members. Contextos CRM también usan organization+ID.

## Relaciones y acciones de borrado

- Organization **uno** → events/attendees **muchos**, `RESTRICT`.
- Calendar event **uno** → attendees, reminders e history **muchos**; FK compuesta en dependientes,
  `RESTRICT` para preservar el calendario histórico.
- Organization member **uno** → eventos organizados/asistencias **muchos**,
  FK compuesta y `RESTRICT`.
- Contextos CRM son padres **uno** de eventos **muchos**, FK nula y `RESTRICT`.
- Agrega `FK_reminders_calendar_event_id` y `CK_reminders_exactly_one_parent`.
  Task/event son alternativas, no una relación polimórfica sin integridad.

## Migración

Crea events, attendees, FK de reminders y finalmente el check. En `down` elimina
primero check y FK, luego attendees y events. Confirma que el `down` no afecta
tasks/reminders creados en la migración anterior.
