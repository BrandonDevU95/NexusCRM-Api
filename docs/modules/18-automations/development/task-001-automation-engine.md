# Development task 001: motor de automatizaciones

## Navegación

- Código: `DEV-AUTO-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 3.
- Regresas a: paso 4.

## Dependencias reutilizadas

Notifications ya instaló `@nestjs/event-emitter@3.1.0` y
`@nestjs/schedule@6.1.3`. Automations los reutiliza para señales locales y
scanners periódicos; no los reinstala ni agrega otro event bus/scheduler. El
outbox PostgreSQL sigue siendo la fuente durable y el lock coordina múltiples
réplicas.

Verifica versiones con `pnpm list --depth 0`; si faltan, no uses `@latest`:
regresa al checkpoint de Notifications que las instala.

## Catálogos cerrados

Triggers mínimos: lead created/assigned, deal stage changed, quote approved/
expired, order confirmed, ticket created/no response, task overdue y stock low.

Condition fields se registran por event type; operators: equals, not equals,
greater/less, contains, in y exists con tipos compatibles. No aceptar property
path, SQL, regex o JavaScript arbitrario.

Actions: assign member, create task, request notification, change allowed state,
create activity, record audit y create reminder. Cada action tiene un executor
registrado que llama al owner service.

## Producers/outbox

En cada owner module, el cambio de negocio y `outbox_events` se escriben
con el mismo `EntityManager`. Si falla el evento, falla el cambio que requiere
automatización. Payload contiene IDs, old/new state y valores necesarios; no
incluye entities completas, tokens ni datos sensibles.

Scheduled facts como overdue/no response se detectan mediante scanner
determinístico que genera una idempotency key por entity y ventana. El scanner
no ejecuta actions directamente.

## Worker y transacción

Un entrypoint Nest application context reclama `outbox_events` por batch con `FOR UPDATE
SKIP LOCKED`. Para cada event:

1. Obtiene rules ACTIVE del mismo tenant y event type por priority.
2. Inserta o encuentra el run único.
3. Evalúa conditions sobre snapshot allowlisted.
4. Si no coincide, registra SKIPPED.
5. Si coincide, ejecuta actions en orden mediante owner ports.
6. Propaga organization, actor system, correlation, causation y depth.
7. Registra resultados redactados.
8. Marca event procesado cuando todas las rules quedaron terminales.

Local actions de una rule comparten transacción cuando deben ser atómicas.
Notification action solo crea PENDING; SMTP ocurre fuera. Si la transacción
falla, registra FAILED en una transacción de diagnóstico separada sin side
effects parciales.

Un retry encuentra el run/event y action idempotency keys; no repite una acción
ya confirmada. Documenta semántica at-least-once, no prometas exactly-once
externo.

## Recursion guard

Cada event derivado conserva `causation_id` y aumenta depth. Rechaza cuando
supera `AUTOMATION_MAX_RECURSION_DEPTH`. Además, un action no vuelve a ejecutar
la misma rule para la misma causation chain. Registra run FAILED con
`RECURSION_LIMIT_REACHED` y audit técnico.

## Endpoints, DTOs y permisos

Todos requieren `X-Organization-Id`.

| Método/path | Permission | Uso |
| --- | --- | --- |
| CRUD `/api/v1/automation-rules` | `automations:manage` | Draft y edición |
| `POST /api/v1/automation-rules/:id/validate` | `automations:manage` | Errores sin ejecutar |
| `POST /api/v1/automation-rules/:id/activate` | `automations:manage` | Congelar version activa |
| `POST /api/v1/automation-rules/:id/deactivate` | `automations:manage` | Detener nuevos matches |
| `POST /api/v1/automation-rules/:id/simulate` | `automations:execute` | Evaluar snapshot sin side effects |
| `GET /api/v1/automation-runs` | `automations:read` | Filtros/paginación |
| `GET /api/v1/automation-runs/:id` | `automations:read` | Explicación redactada |

DTOs separan rule metadata, triggers, condition groups, ordered actions, query y
simulation input. IDs y references se validan contra tenant y owner service.

Activar valida al menos un trigger/action, fields/operators compatibles,
configuration de actions, permissions del owner y absence de direct cycle
obvio. Una version ACTIVE no se edita: se clona a nueva DRAFT.

## Audit

Registra create/update/activate/deactivate y manual simulation. Runs son historial
operativo y no sustituyen audit de configuración. Actions críticas generan el
audit de su owner dentro de la misma transacción.

## Definition of Done

- [ ] Ningún valor de DB se evalúa como código o SQL.
- [ ] Producers usan outbox transaccional.
- [ ] Worker, retry y action executors son idempotentes.
- [ ] Owner services conservan sus invariantes y audit.
- [ ] Simulation nunca genera side effects.
- [ ] Cross-tenant IDs son not found.
