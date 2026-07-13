# Development task 002: calendario y recordatorios

**Código:** `DEV-CAL-002`
**Vienes de:** `../LEARNING-PATH.md`, paso 4.
**Regresa a:** `../LEARNING-PATH.md`, paso 5.
**No continúes hasta:** listar por rango/usuario sin mezclar tenants y cancelar reminders correctamente.

## Dependencias ya disponibles

Esta tarea reutiliza `luxon@3.7.2`, `@types/luxon@3.7.2` y
`@nestjs/schedule@6.1.3`, instalados en `task-001-task-management.md`. No ejecutes
otro `pnpm add`. Si faltan, detente y corrige el checkpoint anterior y su lockfile.

## Tenant

`X-Organization-Id` es obligatorio. El guard crea tenant context desde una
membership activa; services filtran desde la consulta. Body y JWT no deciden el
tenant.

## Endpoints

| Endpoint                              | Permiso           | Notas                                          |
| ------------------------------------- | ----------------- | ---------------------------------------------- |
| `POST /calendar/events`               | `calendar:manage` | Evento y attendees atómicos.                   |
| `GET /calendar/events`                | `calendar:read`   | Rango obligatorio y acotado.                   |
| `GET /calendar/events/:id`            | `calendar:read`   | Tenant scoped.                                 |
| `PATCH /calendar/events/:id`          | `calendar:manage` | Organizer o policy superior.                   |
| `POST /calendar/events/:id/cancel`    | `calendar:manage` | Cancela reminders pendientes.                  |
| `POST /calendar/events/:id/attendees` | `calendar:manage` | Members activos.                               |
| `POST /calendar/events/:id/respond`   | `calendar:manage` | Policy limita la respuesta al attendee propio. |
| `POST /calendar/events/:id/reminders` | `calendar:manage` | Recipient autorizado.                          |

DTOs separan timed y all-day mediante validación condicional. Timezone debe ser
IANA; no aceptes offsets como sustituto. El rango de consulta tiene máximo
configurado para evitar cargar años completos. Mutaciones/cancelación incluyen
idempotencyKey y persisten fingerprint en calendar event status history.

## Reglas

- Convierte timed input a UTC y conserva timezone para representación.
- Las fechas all-day son civiles; no las conviertas a medianoche UTC.
- Attendees deben ser memberships activas. Organizer se agrega como attendee
  requerido si esa es la convención elegida, una sola vez.
- Responder asistencia persiste response key+fingerprint; retry idéntico devuelve
  la respuesta y payload distinto bajo la misma key da `409`.
- Cancelar evento no lo elimina; registra motivo/actor, cancela reminders y emite
  evento en una transacción.
- No implementes sincronización Google Calendar en esta fase; emite eventos que
  permitan integrarla después.
- Notifications consumirá reminders `PENDING`; Calendar no envía email directo.

## Orden de implementación

1. DTO discriminado timed/all-day y validación IANA.
2. Crear/editar/cancelar eventos.
3. Attendees y respuestas.
4. Consulta por rango y usuario con índices.
5. Reminders idempotentes.
6. Policies, Swagger, auditoría y eventos.

Audita cambio de horario, organizer, asistentes, cancelación y reminders. Emite
`calendar_event.created`, `calendar_event.updated`, `calendar_event.cancelled`,
`calendar_attendee.responded`.
