# Database task 001: tasks, assignments y reminders

**Código:** `DB-TASK-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 1.
**Regresa a:** `../LEARNING-PATH.md`, paso 2.
**No continúes hasta:** verificar constraints, índices y reversión de la migración.

## Diccionario de datos

### Tabla `tasks`

| Columna | Tipo | Regla | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `title` | `varchar(200)` | no nulo | Trabajo concreto. |
| `description` | `text` | nulo | Instrucciones. |
| `priority` | `varchar(20)` | `MEDIUM` | `LOW`, `MEDIUM`, `HIGH`, `URGENT`. |
| `status` | `varchar(20)` | `PENDING` | `PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. |
| `created_by_member_id` | `uuid` | no nulo | Membership creadora del tenant. |
| `completed_by_member_id` | `uuid` | nulo | Membership que completó. |
| `customer_id` | `uuid` | nulo | Contexto customer. |
| `contact_id` | `uuid` | nulo | Contexto contact. |
| `lead_id` | `uuid` | nulo | Contexto lead. |
| `deal_id` | `uuid` | nulo | Contexto deal. |
| `activity_id` | `uuid` | nulo | Actividad que originó el trabajo. |
| `starts_at` | `timestamptz` | nulo | Inicio planeado. |
| `due_at` | `timestamptz` | nulo | Vencimiento. |
| `completed_at` | `timestamptz` | nulo | Cierre real. |
| `cancelled_at` | `timestamptz` | nulo | Cancelación. |
| `version` | `integer` | `1` | Control de concurrencia optimista. |
| `created_at` | `timestamptz` | no nulo | Auditoría. |
| `updated_at` | `timestamptz` | no nulo | Auditoría. |
| `archived_at` | `timestamptz` | nulo | Archivo lógico. |

Constraints: `CK_tasks_priority`, `CK_tasks_status`, rango `due_at > starts_at`
cuando ambos existan, `version > 0`, campos terminales coherentes y al menos un
contexto comercial opcional solo cuando el negocio lo requiera; una tarea interna
puede no tener parent. No agregues `OVERDUE` al check: se deriva con
`due_at < now()` y estado no terminal.

Agrega `UQ_tasks_organization_id_id` en `(organization_id,id)` para todas las FKs
compuestas de assignments, reminders e history.

Índices: `(organization_id, status, due_at)`, `(organization_id, priority, due_at)`,
`(organization_id, created_by_member_id, created_at desc)` e índices parciales por cada FK
de contexto no nula.

### Tabla `task_assignments`

| Columna | Tipo | Regla | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Permite historial. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `task_id` | `uuid` | no nulo | Task padre. |
| `assignee_member_id` | `uuid` | no nulo | Membership asignada. |
| `assigned_by_member_id` | `uuid` | no nulo | Membership que asigna. |
| `idempotency_key` | `varchar(150)` | no nulo | Assign action. |
| `request_fingerprint` | `char(64)` | no nulo | Hash task/assignee. |
| `assigned_at` | `timestamptz` | no nulo | Inicio. |
| `unassigned_by_member_id` | `uuid` | nulo | Membership que retira. |
| `unassigned_at` | `timestamptz` | nulo | Fin; nulo significa vigente. |
| `unassign_idempotency_key` | `varchar(150)` | nulo | Acción de retiro. |
| `unassign_request_fingerprint` | `char(64)` | nulo | Hash; par obligatorio al retirar. |

Usa `UQ_task_assignments_active_task_member` parcial en `(task_id, assignee_member_id)` donde
`unassigned_at is null`, check de pares unassigned y rango temporal. Índices por
`(organization_id, assignee_member_id, unassigned_at, assigned_at)` y task.
Unique tenant para ambas keys y checks de fingerprints.

### Tabla `reminders`

| Columna | Tipo | Regla | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `task_id` | `uuid` | nulo | Parent task. |
| `calendar_event_id` | `uuid` | nulo | FK diferida creada en task 002. |
| `recipient_member_id` | `uuid` | no nulo | Membership receptora. |
| `remind_at` | `timestamptz` | no nulo | Instante de entrega. |
| `channel` | `varchar(20)` | `IN_APP` | `IN_APP`, `EMAIL`. |
| `status` | `varchar(20)` | `PENDING` | `PENDING`, `SENT`, `CANCELLED`, `FAILED`. |
| `idempotency_key` | `varchar(150)` | no nulo | Evita entrega duplicada. |
| `request_fingerprint` | `char(64)` | no nulo | Distingue retry idéntico de reutilización incorrecta. |
| `sent_at` | `timestamptz` | nulo | Entrega. |
| `cancelled_at` | `timestamptz` | nulo | Cancelación. |
| `failure_reason` | `varchar(500)` | nulo | Diagnóstico redactado. |
| `created_at` | `timestamptz` | no nulo | Auditoría. |
| `updated_at` | `timestamptz` | no nulo | Auditoría. |

Constraints: exactamente uno de `task_id`/`calendar_event_id` después de task 002,
status/timestamps coherentes, fingerprint hexadecimal y unique
`(organization_id, idempotency_key)`.
Índice parcial `(organization_id, status, remind_at)` donde `status='PENDING'`.

### Tabla `task_status_history`

| Columna | Tipo | Regla/FK/check/onDelete | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Registro append-only. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `task_id` | `uuid` | FK compuesta no nula a tasks, `RESTRICT` | Task padre. |
| `from_status` | `varchar(20)` | nulo | Nulo solo al crear. |
| `to_status` | `varchar(20)` | no nulo | Estado aplicado. |
| `actor_type` | `varchar(10)` | `USER`; USER/SYSTEM | Origen. |
| `changed_by_member_id` | `uuid` | nulo, FK compuesta a organization_members, `RESTRICT` | USER exige member; SYSTEM exige nulo. |
| `reason` | `varchar(500)` | nulo | Motivo. |
| `idempotency_key` | `varchar(150)` | no nulo | Identidad persistida del comando. |
| `request_fingerprint` | `char(64)` | no nulo, hexadecimal | Detecta payload distinto. |
| `created_at` | `timestamptz` | no nulo | Orden. |

Unique `(organization_id,idempotency_key)`; índice `(organization_id,task_id,
created_at,id)`; checks de actor y estados distintos.

## Integridad tenant compuesta

Tasks declara `UQ_tasks_organization_id_id`; assignments, reminders e history
usan `(organization_id,task_id)`. Cada membership/context parent declara
`UQ_<parent>_organization_id_id`, y el child referencia `(organization_id,
<parent>_id)`. Un insert directo que mezcle tenant y parent debe fallar en DB.

## Relaciones

- Organization **uno** → tasks/assignments/reminders **muchos**; FK no nula,
  `onDelete: RESTRICT`.
- Task **uno** → assignments/reminders **muchos**; FK en dependientes,
  `onDelete: RESTRICT` para conservar trazabilidad.
- Organization member **uno** → assignments/reminders/tasks creadas **muchos**;
  FK compuesta y `RESTRICT`.
- Customer/contact/lead/deal/activity **uno** → tasks **muchas**; FKs nulas,
  `RESTRICT`. El service valida mismo tenant y coherencia contact/customer/deal.

## Migración en dos pasos

En esta task crea reminders con `calendar_event_id` nullable sin FK ni check de
exclusividad final, porque `calendar_events` aún no existe. Task 002 agrega la FK
y el check en la misma rama antes del merge; no integres un estado intermedio.
