# Development task 001: entrega de notificaciones

## Navegación

- Código: `DEV-NOTIF-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 4.
- Regresas a: paso 5.
- Rama: `sdd/add-notifications`.

## Dependencias y environment

Activities ya instaló Event Emitter y Calendar/Tasks ya instaló Schedule.
Confirma que siguen exactamente en `3.1.0` y `6.1.3`; no repitas su instalación
ni cambies el lockfile sin motivo. Notifications agrega únicamente SMTP:

```powershell
pnpm add -E nodemailer@8.0.1
pnpm add -D -E @types/nodemailer@8.0.1
```

Joi valida `NOTIFICATIONS_EMAIL_ENABLED`, `SMTP_HOST`, `SMTP_PORT`,
`SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`,
`NOTIFICATION_MAX_ATTEMPTS`, `NOTIFICATION_RETRY_BASE_SECONDS` y
`NOTIFICATION_WORKER_BATCH_SIZE`. Si email está habilitado, SMTP es obligatorio.
No imprimas password ni recipient address.

## Contrato interno para productores

Customers, Tasks, Inventory, Tickets y Automations solicitan una notification
mediante un service/port, no insertan repositories ni renderizan templates. La
solicitud incluye organization, recipient membership, event type, template code,
variables allowlisted, source entity, correlation e idempotency key.

Cuando la notificación es parte de una operación crítica, el owner service pasa
su `EntityManager`: crear la fila PENDING y el cambio de negocio confirman o
revierten juntos. El envío externo ocurre después del commit.

## Rendering y seguridad

- Resolver template del mismo tenant, channel y locale con fallback controlado.
- Rechazar variables no declaradas y variables faltantes.
- Escapar output de email HTML; no evaluar expresiones arbitrarias.
- Guardar title/body renderizados como snapshots.
- No guardar tokens, passwords o payload completo de la entidad.
- Mandatory security notifications pueden ignorar preference disabled; la
  allowlist de eventos obligatorios es cerrada.

## Worker

Schedule despierta el coordinador local y Event Emitter desacopla efectos dentro
del proceso, pero ninguno es durable. El worker usa filas PENDING de PostgreSQL
como fuente de verdad, reclama batches con lock y `SKIP LOCKED`, cambia a SENDING,
crea attempt y llama al channel adapter.

- Éxito: attempt y notification SENT con `sent_at`.
- Error retryable: notification vuelve PENDING con siguiente fecha.
- Error definitivo o máximo: FAILED con error code seguro.
- Quiet hours: recalcula `scheduled_at`, no hace busy loop.
- Idempotency: nunca crea otra notification para la misma key.

Un crash después del provider pero antes del commit requiere reconciliation por
provider message ID cuando exista; documenta esta limitación y no prometas
exactly-once externo. La base garantiza procesamiento único concurrente, no el
comportamiento de Internet.

## Endpoints y permisos

Todos usan `X-Organization-Id` y membership activa.

| Método y path | Permission | Acción |
| --- | --- | --- |
| `GET /api/v1/notifications` | `notifications:read` | Lista del recipient actual con filtros/paginación |
| `GET /api/v1/notifications/unread-count` | `notifications:read` | Conteo unread |
| `POST /api/v1/notifications/:id/read` | `notifications:read` | Marca propia como leída |
| `POST /api/v1/notifications/read-all` | `notifications:read` | Marca propias del tenant en transacción |
| `GET /api/v1/notification-preferences` | `notifications:read` | Preferencias propias |
| `PUT /api/v1/notification-preferences` | `notifications:update-preferences` | Upsert allowlisted |
| CRUD `/api/v1/notification-templates` | `notification-templates:manage` | Gestión y versionado |

DTOs: `NotificationQueryDto`, `UpdateNotificationPreferencesDto`,
`CreateNotificationTemplateDto`, `CreateNotificationTemplateVersionDto` y
`RetryNotificationDto`. Los filtros/sorts son allowlists.

## Audit

Registra `NOTIFICATION_TEMPLATE_CREATED`, `TEMPLATE_VERSION_ACTIVATED` y
`PREFERENCES_CHANGED`. Lectura, auto-mark y retries automáticos no requieren
audit individual. Audit nunca guarda body completo ni SMTP data.

## Definition of Done

- [ ] Producers no conocen Nodemailer ni repositories de Notifications.
- [ ] Creación PENDING comparte transacción con owner cuando aplica.
- [ ] Worker usa lock, batches, retries y exit seguro.
- [ ] Preferences, quiet hours y mandatory events están definidos.
- [ ] Email snapshots y addresses no se filtran.
- [ ] Endpoints respetan owner recipient, header, permission y tenant.
