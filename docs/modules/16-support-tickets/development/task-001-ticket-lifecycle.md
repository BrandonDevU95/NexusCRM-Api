# Development task 001: alta, asignación y lifecycle

**Código:** `DEV-TICKET-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 2.
**Regresa a:** `../LEARNING-PATH.md`, paso 3.
**No continúes hasta:** cumplir estados, assignments, folio y tenant en transacción.

## Tenant

Todos los endpoints requieren `X-Organization-Id`. Guard valida membership activa
y crea tenant context; service consulta por tenant desde el inicio. Rechaza
`organizationId` en body y no guarda tenant en JWT.

## Endpoints y permisos

| Endpoint | Permiso | Caso |
|---|---|---|
| `POST /tickets` | `tickets:create` | Alta, folio e history inicial. |
| `GET /tickets` | `tickets:read` | Filtros/paginación. |
| `GET /tickets/:id` | `tickets:read` | Detalle según policy. |
| `PATCH /tickets/:id` | `tickets:update` | Subject/category/priority bajo reglas. |
| `POST /tickets/:id/assign` | `tickets:assign` | `assigneeMemberId` activo. |
| `POST /tickets/:id/open` | `tickets:update` | Abre nuevo. |
| `POST /tickets/:id/start` | `tickets:update` | Pasa en progreso. |
| `POST /tickets/:id/wait-customer` | `tickets:update` | Espera externa. |
| `POST /tickets/:id/wait-internal` | `tickets:update` | Espera interna. |
| `POST /tickets/:id/resolve` | `tickets:close` | Summary requerido. |
| `POST /tickets/:id/close` | `tickets:close` | Desde resolved. |
| `POST /tickets/:id/reopen` | `tickets:reopen` | Razón obligatoria. |

DTOs validan UUID, texto, priority/status, category, assignee membership,
idempotencyKey, filtros, versión y reason/summary. El service persiste el
requestFingerprint; DTO no acepta timestamps/status history/folio.

## Máquina de estados

- `NEW → OPEN → IN_PROGRESS`.
- `OPEN/IN_PROGRESS → WAITING_CUSTOMER` o `WAITING_INTERNAL`.
- Waiting vuelve a `IN_PROGRESS` con nueva respuesta/acción.
- `OPEN/IN_PROGRESS/WAITING_* → RESOLVED` con resolution summary.
- `RESOLVED → CLOSED` con close reason según policy.
- `RESOLVED/CLOSED → REOPENED` con reopen reason; después `REOPENED → IN_PROGRESS`.

No uses endpoint genérico `PATCH status`. Cada acción valida permiso, estado,
actor, datos y side effects. No borres/reinicies timestamps históricos; history
responde la secuencia completa.

## Reglas/transacciones

- Folio TICKET se asigna por tenant mediante number sequence.
- Customer/contact/category/assigneeMember se consultan con tenant. Contact
  pertenece a customer; assignee membership está activa y policy de soporte aplica.
- Crear ticket inserta status history/audit/outbox en una transacción.
- Assign actualiza current assignee e inserta assignment history atómicamente.
- Priority CRITICAL emite notification/event idempotente.
- Usa version para concurrencia. Cada assign/state action persiste
  idempotencyKey+fingerprint en su history: retry igual retorna resultado y payload
  distinto bajo la misma key recibe `409`.
- Archivar no sustituye close y no borra conversación.

## Orden de implementación

1. DTOs/query, folio y create/list/detail.
2. Assignment history con memberships e idempotencia persistida.
3. State machine y acciones USER/SYSTEM.
4. Priority/category updates con version.
5. CASL: agente propio, manager y customer scope interno.
6. Swagger, audit/outbox y notifications.

Eventos: `ticket.created`, `ticket.assigned`, `ticket.priority_changed`,
`ticket.status_changed`, `ticket.resolved`, `ticket.closed`, `ticket.reopened`.
