# Database task 001: esquema de tickets de soporte

**Código:** `DB-TICKET-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 1.
**Regresa a:** `../LEARNING-PATH.md`, paso 2.
**No continúes hasta:** comprobar authors, memberships, visibility, idempotencia, FKs tenant y `up/down/up`.

## Tabla `ticket_categories`

| Columna                   | Tipo           | Null/default | FK/check/onDelete y motivo           |
| ------------------------- | -------------- | ------------ | ------------------------------------ |
| `id`                      | `uuid`         | PK           | Identidad.                           |
| `organization_id`         | `uuid`         | no nulo      | FK organization, `RESTRICT`.         |
| `code`                    | `varchar(60)`  | no nulo      | Clave tenant.                        |
| `name`                    | `varchar(120)` | no nulo      | Etiqueta.                            |
| `description`             | `text`         | nulo         | Alcance.                             |
| `is_active`               | `boolean`      | `true`       | Inactivar, no borrar.                |
| `default_priority`        | `varchar(20)`  | `MEDIUM`     | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `created_at`/`updated_at` | `timestamptz`  | no nulos     | Auditoría.                           |
| `archived_at`             | `timestamptz`  | nulo         | Archivo.                             |

Unique `(organization_id,code)`, `UQ_ticket_categories_organization_id_id`, checks
de code/name/priority e índice tenant+active+name.

## Tabla `tickets`

| Columna                                                                  | Tipo           | Null/default | FK/check/onDelete y motivo                                                                              |
| ------------------------------------------------------------------------ | -------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| `id`                                                                     | `uuid`         | PK           | Identidad.                                                                                              |
| `organization_id`                                                        | `uuid`         | no nulo      | Tenant.                                                                                                 |
| `ticket_number`                                                          | `varchar(60)`  | no nulo      | Folio.                                                                                                  |
| `customer_id`                                                            | `uuid`         | no nulo      | FK compuesta customer, `RESTRICT`.                                                                      |
| `contact_id`                                                             | `uuid`         | nulo         | FK compuesta contact, `RESTRICT`.                                                                       |
| `category_id`                                                            | `uuid`         | no nulo      | FK compuesta category, `RESTRICT`.                                                                      |
| `assigned_to_member_id`                                                  | `uuid`         | nulo         | FK compuesta membership, `RESTRICT`; agente actual.                                                     |
| `created_by_member_id`                                                   | `uuid`         | no nulo      | FK compuesta membership, `RESTRICT`.                                                                    |
| `subject`                                                                | `varchar(200)` | no nulo      | Resumen.                                                                                                |
| `description`                                                            | `text`         | no nulo      | Solicitud inicial.                                                                                      |
| `priority`                                                               | `varchar(20)`  | `MEDIUM`     | Allowlist.                                                                                              |
| `status`                                                                 | `varchar(30)`  | `NEW`        | `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_CUSTOMER`, `WAITING_INTERNAL`, `RESOLVED`, `CLOSED`, `REOPENED`. |
| `source`                                                                 | `varchar(20)`  | `INTERNAL`   | `INTERNAL`, `EMAIL`, `PHONE`, `WEB`.                                                                    |
| `first_response_at`/`last_customer_response_at`/`last_agent_response_at` | `timestamptz`  | nulos        | Métricas.                                                                                               |
| `resolved_at`/`closed_at`/`reopened_at`                                  | `timestamptz`  | nulos        | Hitos.                                                                                                  |
| `resolution_summary`                                                     | `text`         | nulo         | Obligatorio RESOLVED/CLOSED.                                                                            |
| `close_reason`/`reopen_reason`                                           | `varchar(500)` | nulos        | Motivos.                                                                                                |
| `version`                                                                | `integer`      | `1`          | >0.                                                                                                     |
| `created_at`/`updated_at`                                                | `timestamptz`  | no nulos     | Auditoría.                                                                                              |
| `archived_at`                                                            | `timestamptz`  | nulo         | Archivo.                                                                                                |

Unique `(organization_id,ticket_number)`, `UQ_tickets_organization_id_id`, checks
status/timestamps/reasons/priority/source. Índices tenant+status+priority+created,
assignedMember+status, customer, category y parciales CRITICAL/unassigned.

## Tabla `ticket_comments`

| Columna                | Tipo           | Null/default | FK/check/onDelete y motivo           |
| ---------------------- | -------------- | ------------ | ------------------------------------ |
| `id`                   | `uuid`         | PK           | Identidad.                           |
| `organization_id`      | `uuid`         | no nulo      | Tenant.                              |
| `ticket_id`            | `uuid`         | no nulo      | FK compuesta ticket, `RESTRICT`.     |
| `author_type`          | `varchar(20)`  | no nulo      | `USER`, `CONTACT`, `SYSTEM`.         |
| `author_member_id`     | `uuid`         | nulo         | FK compuesta membership, `RESTRICT`. |
| `author_contact_id`    | `uuid`         | nulo         | FK compuesta contact, `RESTRICT`.    |
| `visibility`           | `varchar(20)`  | no nulo      | `PUBLIC`, `INTERNAL`.                |
| `body`                 | `text`         | no nulo      | No vacío.                            |
| `is_customer_response` | `boolean`      | `false`      | Métrica/state trigger.               |
| `idempotency_key`      | `varchar(150)` | no nulo      | Acción reply/note persistida.        |
| `request_fingerprint`  | `char(64)`     | no nulo      | Hash del payload.                    |
| `edited_at`            | `timestamptz`  | nulo         | Edición controlada.                  |
| `created_at`           | `timestamptz`  | no nulo      | Orden.                               |
| `archived_at`          | `timestamptz`  | nulo         | Retiro lógico.                       |

USER exige solo member; CONTACT solo contact y PUBLIC/customer response; SYSTEM
no permite ninguno. Unique `(organization_id,idempotency_key)`,
`UQ_ticket_comments_organization_id_id`, fingerprint hex e índices
ticket+created/visibility/customer response.

## Tabla `ticket_attachments`

| Columna                 | Tipo           | Null/default | FK/check/onDelete y motivo                                   |
| ----------------------- | -------------- | ------------ | ------------------------------------------------------------ |
| `id`                    | `uuid`         | PK           | Identidad.                                                   |
| `organization_id`       | `uuid`         | no nulo      | Tenant.                                                      |
| `ticket_id`             | `uuid`         | no nulo      | FK compuesta ticket, `RESTRICT`.                             |
| `ticket_comment_id`     | `uuid`         | nulo         | FK compuesta comment, `RESTRICT`; debe pertenecer al ticket. |
| `uploaded_by_member_id` | `uuid`         | no nulo      | FK compuesta membership, `RESTRICT`.                         |
| `visibility`            | `varchar(20)`  | no nulo      | `PUBLIC`, `INTERNAL`; hereda comment.                        |
| `file_name`             | `varchar(255)` | no nulo      | Nombre saneado.                                              |
| `storage_key`           | `varchar(500)` | no nulo      | Key server-issued.                                           |
| `mime_type`             | `varchar(120)` | no nulo      | Allowlist/inspección real.                                   |
| `byte_size`             | `bigint`       | no nulo      | >0 y <= límite.                                              |
| `checksum_sha256`       | `char(64)`     | no nulo      | Hexadecimal.                                                 |
| `idempotency_key`       | `varchar(150)` | no nulo      | Finalización upload.                                         |
| `request_fingerprint`   | `char(64)`     | no nulo      | Hash metadata.                                               |
| `created_at`            | `timestamptz`  | no nulo      | Auditoría.                                                   |
| `archived_at`           | `timestamptz`  | nulo         | Retiro lógico.                                               |

Unique `(organization_id,storage_key)` y `(organization_id,idempotency_key)`,
`UQ_ticket_attachments_organization_id_id`; checks visibility/tamaño/checksums.

## Tabla `ticket_status_history`

| Columna                | Tipo           | Null/default | FK/check/onDelete                                                    |
| ---------------------- | -------------- | ------------ | -------------------------------------------------------------------- |
| `id`                   | `uuid`         | PK           | Append-only.                                                         |
| `organization_id`      | `uuid`         | no nulo      | Tenant.                                                              |
| `ticket_id`            | `uuid`         | no nulo      | FK compuesta ticket, `RESTRICT`.                                     |
| `from_status`          | `varchar(30)`  | nulo         | Estado anterior; nulo solo en el evento inicial.                     |
| `to_status`            | `varchar(30)`  | no nulo      | Estado aplicado; debe ser distinto de `from_status`.                 |
| `actor_type`           | `varchar(10)`  | `USER`       | `USER`/`SYSTEM`.                                                     |
| `changed_by_member_id` | `uuid`         | nulo         | FK compuesta membership, `RESTRICT`; USER exige member, SYSTEM nulo. |
| `reason`               | `varchar(500)` | nulo         | Motivo.                                                              |
| `idempotency_key`      | `varchar(150)` | no nulo      | Acción.                                                              |
| `request_fingerprint`  | `char(64)`     | no nulo      | Hash.                                                                |
| `created_at`           | `timestamptz`  | no nulo      | Orden.                                                               |

Unique `(organization_id,idempotency_key)`; índice ticket+created+id; checks actor,
status y fingerprint.

## Tabla `ticket_assignment_history`

| Columna                   | Tipo           | Null/default | FK/check/onDelete                                                                            |
| ------------------------- | -------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `id`                      | `uuid`         | PK           | Append-only.                                                                                 |
| `organization_id`         | `uuid`         | no nulo      | Tenant.                                                                                      |
| `ticket_id`               | `uuid`         | no nulo      | FK compuesta ticket, `RESTRICT`.                                                             |
| `from_assignee_member_id` | `uuid`         | nulo         | FK compuesta membership, `RESTRICT`; agente anterior.                                        |
| `to_assignee_member_id`   | `uuid`         | nulo         | FK compuesta membership, `RESTRICT`; agente nuevo; al menos un lado existe y son diferentes. |
| `actor_type`              | `varchar(10)`  | `USER`       | `USER`/`SYSTEM`.                                                                             |
| `assigned_by_member_id`   | `uuid`         | nulo         | FK compuesta membership; USER exige valor, SYSTEM nulo.                                      |
| `reason`                  | `varchar(500)` | nulo         | Motivo.                                                                                      |
| `idempotency_key`         | `varchar(150)` | no nulo      | Acción assign/unassign.                                                                      |
| `request_fingerprint`     | `char(64)`     | no nulo      | Hash.                                                                                        |
| `created_at`              | `timestamptz`  | no nulo      | Orden.                                                                                       |

Unique `(organization_id,idempotency_key)`, índice ticket y toAssignee+created;
checks actor/member/fingerprint.

## Integridad tenant y relaciones

Cada parent tenant declara `UQ_<table>_organization_id_id`; todos los children
usan FK `(organization_id,parent_id)` con `onDelete: RESTRICT`. Customer/contact/
category/member/ticket/comment quedan protegidos. Ticket **uno** → comments,
attachments,status histories,assignment histories **muchos**. Organization member
es parent de assignees/actors. Un insert SQL directo cross-tenant debe fallar.

La tabla puente Knowledge Base no se crea aquí: Pasada B la agrega cuando ambos
parents existen y también usa FK compuesta.

## Migración

Orden: categories, tickets, comments, attachments, histories, FKs/índices. `down`
invierte. No migres binarios, folios ni knowledge links.
