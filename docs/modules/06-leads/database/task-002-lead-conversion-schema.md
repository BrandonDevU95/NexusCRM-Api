# Database task 002: persistencia de conversión

## Navegación

- **Código:** DB-LEAD-002
- **Vienes de:** `../LEARNING-PATH.md`, parte B paso 1.
- **Regresa a:** `../LEARNING-PATH.md`, parte B paso 2.
- **No continúes hasta:** demostrar una sola conversión y mismo tenant en todos los resultados.

## Prerrequisitos

Ya existen `customers`, `contacts`, `pipelines`, `pipeline_stages` y `deals`.

## lead_conversions

| Campo                  | Tipo         | Null | Default  | Regla                               | Motivo                                   |
| ---------------------- | ------------ | ---: | -------- | ----------------------------------- | ---------------------------------------- |
| id                     | uuid         |   no | generado | PK                                  | Identifica conversión.                   |
| organization_id        | uuid         |   no | —        | FK organizations.id                 | Refuerza tenant.                         |
| idempotency_key        | varchar(100) |   no | —        | unique por organization             | Identifica el intento del cliente.       |
| request_fingerprint    | char(64)     |   no | —        | SHA-256 hex unique por organization | Detecta la misma intención con otra key. |
| lead_id                | uuid         |   no | —        | FK leads.id, unique                 | Impide convertir dos veces.              |
| customer_id            | uuid         |   no | —        | FK customers.id                     | Resultado obligatorio.                   |
| contact_id             | uuid         |   sí | null     | FK contacts.id                      | Resultado opcional.                      |
| deal_id                | uuid         |   sí | null     | FK deals.id                         | Resultado comercial opcional.            |
| converted_by_member_id | uuid         |   sí | null     | FK organization_members.id          | Actor de negocio.                        |
| created_at             | timestamptz  |   no | now      | —                                   | Evidencia temporal.                      |

Un lead es lado **uno** y tiene cero o una conversión; `UQ_lead_conversions_lead_id` y la FK compuesta `(organization_id, lead_id)` con `onDelete: RESTRICT` implementan el 1:1. Customer es lado **uno** y puede aparecer en **muchas** conversiones; la FK compuesta `(organization_id, customer_id)` con `RESTRICT` implementa el 1:N. Contact y deal también son lados uno respecto a conversiones y usan FKs compuestas nullable con `RESTRICT`. Actor usa `(organization_id, converted_by_member_id)` y `SET NULL (converted_by_member_id)`.

Todas las referencias tenant-owned usan obligatoriamente `(organization_id, parent_id)` hacia el `UQ(parent.organization_id, parent.id)` correspondiente; no basta una validación del service.

Constraints e índices explícitos:

- `UQ_lead_conversions_organization_id_id` permite futuras referencias tenant-safe.
- `UQ_lead_conversions_lead_id` impide una segunda conversión del lead.
- `UQ_lead_conversions_organization_idempotency_key` sobre `(organization_id, idempotency_key)` impide reutilizar una key con otra solicitud.
- `UQ_lead_conversions_organization_fingerprint` sobre `(organization_id, request_fingerprint)` detecta la misma intención aunque llegue con una key distinta. El fingerprint incluye organization, lead y payload normalizado; nunca guarda el payload ni secretos.
- Índices para customer, contact y deal comienzan por `organization_id` y sirven a consultas inversas.

## Migración

Crea la tabla solo después de Deals. No agregues `customer_id`, `contact_id` y `deal_id` sueltos a leads además de esta tabla; duplicaría la fuente de verdad.

    pnpm migration:show
    pnpm migration:generate src/database/migrations/CreateLeadConversions
    pnpm migration:run
    pnpm migration:revert
    pnpm migration:run
