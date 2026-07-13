# Development task 001: gestión de tareas

**Código:** `DEV-TASK-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 3.
**Regresa a:** `../LEARNING-PATH.md`, paso 4.
**No continúes hasta:** completar CRUD, assignments y máquina de estados con tenant scope.

## Dependencias que se instalan aquí

Calendario/Tareas es el primer módulo que necesita reglas explícitas de zona
horaria y ejecución periódica de reminders/overdue. Instala una sola vez:

```powershell
pnpm add -E luxon@3.7.2 @nestjs/schedule@6.1.3
pnpm add -D -E @types/luxon@3.7.2
```

- Luxon convierte instantes usando zonas IANA y evita depender de la timezone del
  servidor. Sus tipos se agregan como dependencia de desarrollo.
- Nest Schedule ejecuta evaluaciones periódicas. Cada job debe ser idempotente;
  si hay varias réplicas, requiere coordinación/lock y no puede depender solo de
  que “cron se ejecuta una vez”.

Revisa `package.json` y `pnpm-lock.yaml`; no vuelvas a instalar estos paquetes en
la task de calendar events.

## Tenant y seguridad

Exige `X-Organization-Id`; el guard valida membership activa y crea tenant
context. Services consultan por `(id, organization_id)`. Rechaza
`organizationId` en body y nunca fija el tenant dentro del JWT.

## Casos de uso y endpoints

- `POST /tasks` (`tasks:create`): crea task y assignments atómicamente.
- `GET /tasks` (`tasks:read`): lista por assignee, creator, status, priority,
  vencida, rango y parent.
- `GET/PATCH /tasks/:id` (`tasks:read`/`tasks:update`).
- `POST /tasks/:id/assignments` (`tasks:assign`).
- `DELETE /tasks/:id/assignments/:assignmentId` (`tasks:assign`): marca
  `unassigned_at`, no borra.
- `POST /tasks/:id/start`, `/complete`, `/cancel` con permiso apropiado.
- `POST/DELETE /tasks/:id/reminders` para receptor autorizado.

DTOs: `CreateTaskDto`, `UpdateTaskDto`, `QueryTasksDto`, `AssignTaskDto`,
`CompleteTaskDto`, `CancelTaskDto`, `CreateReminderDto`. Valida UUID, título,
priority/status permitido, fechas futuras razonables, límites de página y arrays
de assigneeMemberIds sin duplicados; actions/reminders incluyen idempotencyKey.

## Reglas y transacciones

- Assignees deben ser memberships activas del mismo tenant.
- Assign/unassign persisten key+fingerprint en assignment history row; retries
  idénticos no duplican ni reactivan asignaciones.
- Contact/customer/deal se validan como conjunto coherente.
- `PENDING → IN_PROGRESS → COMPLETED`; pendiente/en progreso pueden cancelarse.
- Un terminal no se reabre en este alcance; se crea una nueva task enlazada si se
  necesita seguimiento.
- `OVERDUE` es `dueAt < now` y status no terminal. Devuélvelo como campo calculado
  y filtro, sin persistirlo.
- Completar fija actor/fecha y cancela reminders pendientes en una transacción.
- Start/complete/cancel persisten key+fingerprint en task status history; reminder
  persiste ambos campos. Reutilizar key con otro payload devuelve `409`.
- Usa `version` para rechazar ediciones concurrentes perdidas con `409`.
- Quitar el último assignee es válido para una task interna si la policy lo permite.

## Orden de implementación

1. DTOs y estado derivado overdue.
2. Crear/listar/detalle tenant-scoped.
3. Assignment history.
4. Transiciones con versionado y cancelación de reminders.
5. Policies/CASL y permisos.
6. Swagger, eventos y auditoría.

Eventos: `task.created`, `task.assigned`, `task.unassigned`, `task.started`,
`task.completed`, `task.cancelled`, `task.overdue_detected`. El último lo genera
un job idempotente futuro, no el getter de listado.
