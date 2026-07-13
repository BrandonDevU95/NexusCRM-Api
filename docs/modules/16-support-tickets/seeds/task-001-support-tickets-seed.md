# Seed task 001: tickets de soporte

**Código:** `SEED-TICKET-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 4.
**Regresa a:** `../LEARNING-PATH.md`, paso 5.
**No continúes hasta:** dos ejecuciones sin duplicar ticket, comments, links o histories.

## Dataset

Por tenant crea categories `GENERAL`, `BILLING`, `TECHNICAL`, `DELIVERY` y:

- Ticket NEW unassigned.
- Ticket OPEN assigned priority HIGH.
- Ticket IN_PROGRESS con public reply e internal note.
- Ticket WAITING_CUSTOMER con reminder/notification fixture relacionado.
- Ticket CRITICAL con notification idempotente.
- Ticket RESOLVED con resolution summary.
- Ticket CLOSED con history completo.
- Ticket REOPENED con reason.
- Attachment metadata demo. El knowledge article link se agrega únicamente al
  ejecutar la extensión de seed de Knowledge Base B después de integrar Tickets.

Faker seeded genera subjects/descriptions/comments con contenido seguro; category
codes, folios, states, dates base, customer/contact/agents e idempotency keys son
deterministas. No subas binarios reales.

## Orden e idempotencia

1. Resuelve tenant, support memberships, customer/contact, articles/templates.
2. Upsert categories por code.
3. Upsert tickets por `(organization_id, ticket_number)`.
4. Inserta histories/assignments/comments/attachments por fixture IDs
   deterministas, sin buscar por texto Faker.
5. Invoca Notifications mediante eventos/keys fijas.

El runner abre una sola transacción y comparte su `EntityManager`; este seeder no
abre nested transactions ni usa repositories globales. Conserva advisory lock,
no reabre/cierra de nuevo un ticket construido y no ejecuta en production.

## Verificación

Contact/customer/agent comparten tenant; public/internal counts correctos;
timestamps corresponden a estados; critical notification no se duplica; segunda
ejecución conserva IDs/conteos. Knowledge Base B verificará article/link.
