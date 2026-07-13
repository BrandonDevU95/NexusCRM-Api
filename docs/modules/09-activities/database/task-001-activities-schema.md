# Database task 001: esquema de actividades

**Código:** `DB-ACT-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 1.
**Regresa a:** `../LEARNING-PATH.md`, paso 2.
**No continúes hasta:** aplicar, inspeccionar, revertir e instalar nuevamente la migración sin `synchronize`.

## Propósito

Persistir interacciones, comentarios y referencias de archivos. Una actividad es
un hecho o compromiso de seguimiento; una tarea ejecutable pertenece al módulo
10. No crees una tabla `timelines`: el timeline es una consulta sobre fuentes
existentes.

## Diccionario de datos

### Tabla `activities`

| Columna | Tipo | Nulabilidad/default | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK, no nulo | Identificador técnico. |
| `organization_id` | `uuid` | no nulo | Delimita el tenant. |
| `activity_type` | `varchar(30)` | no nulo | Código estable: `CALL`, `EMAIL`, `MEETING`, `NOTE`, `WHATSAPP`, `VISIT`, `FOLLOW_UP`, `DEMO`, `PROPOSAL_SENT`, `INTERNAL_TASK`. |
| `status` | `varchar(20)` | `SCHEDULED` | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. |
| `subject` | `varchar(200)` | no nulo | Resumen visible y buscable. |
| `description` | `text` | nulo | Detalle de la interacción. |
| `outcome` | `text` | nulo | Resultado; se exige al completar tipos configurados. |
| `owner_member_id` | `uuid` | no nulo | Membership responsable dentro del tenant. |
| `created_by_member_id` | `uuid` | no nulo | Membership que registró la actividad. |
| `completed_by_member_id` | `uuid` | nulo | Membership que la completó. |
| `customer_id` | `uuid` | nulo | Cuenta relacionada. |
| `contact_id` | `uuid` | nulo | Contacto relacionado. |
| `lead_id` | `uuid` | nulo | Lead relacionado. |
| `deal_id` | `uuid` | nulo | Deal relacionado. |
| `scheduled_start_at` | `timestamptz` | nulo | Inicio planeado. |
| `scheduled_end_at` | `timestamptz` | nulo | Fin planeado. |
| `occurred_at` | `timestamptz` | nulo | Instante real de la interacción. |
| `completed_at` | `timestamptz` | nulo | Momento de cierre. |
| `cancelled_at` | `timestamptz` | nulo | Momento de cancelación. |
| `duration_minutes` | `integer` | nulo | Duración real positiva. |
| `metadata` | `jsonb` | `{}` | Datos controlados del canal; nunca secretos ni cuerpo de archivos. |
| `created_at` | `timestamptz` | no nulo | Auditoría técnica. |
| `updated_at` | `timestamptz` | no nulo | Última modificación. |
| `archived_at` | `timestamptz` | nulo | Archivo lógico. |

Constraints explícitos:

- `PK_activities_id`.
- `UQ_activities_organization_id_id` en `(organization_id, id)`, requerido por
  toda FK compuesta desde hijos tenant-scoped.
- `CK_activities_type` y `CK_activities_status` con los códigos anteriores.
- `CK_activities_business_parent`: `num_nonnulls(customer_id, contact_id, lead_id, deal_id) >= 1`.
- `CK_activities_schedule_range`: si existe fin, también existe inicio y fin es posterior a inicio.
- `CK_activities_duration_positive`: nulo o mayor que cero.
- `CK_activities_completion_fields`: `COMPLETED` exige `completed_at`; otros estados no inventan esa fecha.
- `CK_activities_cancellation_fields`: `CANCELLED` exige `cancelled_at`.

Índices:

- `IDX_activities_organization_id_created_at` en `(organization_id, created_at desc)`.
- `IDX_activities_organization_id_type_status` en `(organization_id, activity_type, status)`.
- `IDX_activities_organization_id_owner_member_start` en `(organization_id, owner_member_id, scheduled_start_at)`.
- Índices parciales por `(organization_id, customer_id)`, `contact_id`, `lead_id` y `deal_id` cuando cada FK no sea nula.
- Índice de búsqueda por `subject` se agrega solo cuando se implemente la estrategia global de texto; no uses `ILIKE '%...%'` sin medir.

### Tabla `activity_comments`

| Columna | Tipo | Nulabilidad/default | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant redundante para scope e integridad lógica. |
| `activity_id` | `uuid` | no nulo | Actividad padre. |
| `author_member_id` | `uuid` | no nulo | Membership autora. |
| `body` | `text` | no nulo | Comentario; no acepta texto vacío. |
| `is_internal` | `boolean` | `true` | Reserva la futura visibilidad externa sin exponer hoy. |
| `idempotency_key` | `varchar(150)` | no nulo | Acción comment persistida. |
| `request_fingerprint` | `char(64)` | no nulo | Hash del body normalizado. |
| `edited_at` | `timestamptz` | nulo | Indica edición explícita. |
| `created_at` | `timestamptz` | no nulo | Orden del hilo. |
| `archived_at` | `timestamptz` | nulo | Archivo lógico sin perder historial. |

Constraints e índices: `PK_activity_comments_id`,
`UQ_activity_comments_organization_id_id`, unique tenant+idempotency key, checks
de fingerprint y `length(btrim(body)) > 0`,
`IDX_activity_comments_organization_activity_created` en
`(organization_id, activity_id, created_at)`.

### Tabla `activity_attachments`

| Columna | Tipo | Nulabilidad/default | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `activity_id` | `uuid` | no nulo | Actividad propietaria. |
| `uploaded_by_member_id` | `uuid` | no nulo | Membership que subió el archivo. |
| `file_name` | `varchar(255)` | no nulo | Nombre de presentación saneado. |
| `storage_key` | `varchar(500)` | no nulo | Referencia al storage; no ruta del cliente. |
| `mime_type` | `varchar(120)` | no nulo | Tipo permitido por allowlist. |
| `byte_size` | `bigint` | no nulo | Control de límites. |
| `checksum_sha256` | `char(64)` | no nulo | Integridad y deduplicación controlada. |
| `visibility` | `varchar(20)` | `INTERNAL` | `INTERNAL`; valores externos se habilitan después. |
| `idempotency_key` | `varchar(150)` | no nulo | Finalización upload idempotente. |
| `request_fingerprint` | `char(64)` | no nulo | Hash de metadata/checksum. |
| `created_at` | `timestamptz` | no nulo | Auditoría. |
| `archived_at` | `timestamptz` | nulo | Retiro lógico. |

Constraints e índices: tamaño mayor que cero, checksum hexadecimal, unique
`UQ_activity_attachments_organization_storage_key`, unique
`(organization_id,idempotency_key)`, fingerprint hexadecimal e índice por
`(organization_id, activity_id, created_at)`.

### Tabla `activity_status_history`

| Columna | Tipo | Nulabilidad/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK, no nulo | Identidad append-only. |
| `organization_id` | `uuid` | no nulo | Parte de todas las FKs compuestas. |
| `activity_id` | `uuid` | no nulo | FK compuesta `(organization_id, activity_id)` → `activities(organization_id,id)`, `onDelete: RESTRICT`. |
| `from_status` | `varchar(20)` | nulo | Nulo solo para creación. |
| `to_status` | `varchar(20)` | no nulo | Estado aplicado. |
| `actor_type` | `varchar(10)` | `USER` | `USER` o `SYSTEM`. |
| `changed_by_member_id` | `uuid` | nulo | FK compuesta a `organization_members`; USER exige valor, SYSTEM exige nulo; `RESTRICT`. |
| `reason` | `varchar(500)` | nulo | Motivo de cancelación/cambio. |
| `idempotency_key` | `varchar(150)` | no nulo | Identifica el comando persistido. |
| `request_fingerprint` | `char(64)` | no nulo | Hash del payload normalizado para detectar reutilización distinta. |
| `created_at` | `timestamptz` | no nulo | Orden inmutable. |

Checks: statuses permitidos y distintos; actor/membership coherentes; fingerprint
hexadecimal. Unique `UQ_activity_status_history_organization_idempotency` en
`(organization_id, idempotency_key)` e índice `(organization_id, activity_id,
created_at, id)`. Repetir key+fingerprint devuelve el resultado guardado; repetir
la key con fingerprint distinto responde `409`.

## Integridad tenant compuesta

Cada parent tenant de este módulo declara `UQ_<table>_organization_id_id`. Todas
las relaciones internas usan ambas columnas: comments, attachments e history
referencian `activities(organization_id,id)`; actors/owner/completer referencian
`organization_members(organization_id,id)`. Las FKs opcionales customer/contact/
lead/deal también son compuestas. Así PostgreSQL, no solo el service, rechaza un
child de organización A que apunte al UUID de un parent B.

## Relaciones explicadas

- `organizations` es lado **uno** y cada tabla de este documento es lado
  **muchos**. La FK `organization_id` vive en el registro comercial y usa
  `onDelete: RESTRICT`: una organización con historia no se elimina físicamente.
- Cada customer/contact/lead/deal es lado **uno** y puede tener **muchas**
  activities. Las FKs viven en `activities`, son nulas porque una actividad no
  necesita todos los recursos, y usan `onDelete: RESTRICT`; esos agregados se
  archivan en vez de borrarse.
- Una activity es lado **uno** y tiene **muchos** comments, attachments e history.
  Las FKs compuestas viven en los hijos y usan `onDelete: RESTRICT`.
- Una `organization_member` es lado **uno** y puede ser owner/creator/completer/
  author/uploader de **muchos** registros. Las FKs compuestas usan `RESTRICT`; la
  membership se inactiva, no se borra.
- Service valida coherencia semántica adicional; la FK compuesta garantiza tenant
  incluso ante un insert SQL directo.

## Migración

Orden de `up`: tabla padre `activities`, luego comments, attachments e history, después
índices. Orden de `down`: dependientes antes que padre. Lee el SQL generado y
confirma nombres explícitos, tipos `numeric/timestamptz` y ausencia de cambios de
otros módulos.
