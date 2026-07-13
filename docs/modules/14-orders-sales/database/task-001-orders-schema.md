# Database task 001: esquema base de órdenes

**Código:** `DB-ORDER-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 1.
**Regresa a:** `../LEARNING-PATH.md`, paso 2.
**No continúes hasta:** verificar accepted revision, snapshots, idempotencia y migración `up/down/up`.

## Tabla `orders`

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant/FK organization `RESTRICT`. |
| `order_number` | `varchar(60)` | no nulo | Folio humano. |
| `order_source` | `varchar(20)` | no nulo | `MANUAL`, `QUOTE`. |
| `quote_id` | `uuid` | nulo | FK compuesta quote, `RESTRICT`. |
| `quote_revision_id` | `uuid` | nulo | FK compuesta a accepted revision, `RESTRICT`. |
| `conversion_idempotency_key` | `varchar(150)` | nulo | Obligatoria si source QUOTE. |
| `conversion_request_fingerprint` | `char(64)` | nulo | Obligatorio si source QUOTE; hash del request normalizado. |
| `customer_id` | `uuid` | no nulo | FK compuesta customer, `RESTRICT`. |
| `contact_id` | `uuid` | nulo | FK compuesta contact, `RESTRICT`. |
| `deal_id` | `uuid` | nulo | FK compuesta deal, `RESTRICT`. |
| `owner_member_id` | `uuid` | no nulo | FK compuesta organization_members, `RESTRICT`. |
| `status` | `varchar(30)` | `DRAFT` | `DRAFT`, `CONFIRMED`, `PREPARING`, `PARTIALLY_FULFILLED`, `COMPLETED`, `CANCELLED`, `RETURNED`. |
| `currency` | `char(3)` | no nulo | Currency de snapshots. |
| `ordered_at` | `timestamptz` | no nulo | Fecha de negocio de la orden; no significa confirmación. |
| `customer_name_snapshot` | `varchar(180)` | no nulo | Party snapshot. |
| `customer_legal_name_snapshot` | `varchar(220)` | nulo | Legal snapshot. |
| `customer_tax_id_snapshot` | `varchar(40)` | nulo | Fiscal snapshot. |
| `contact_name_snapshot` | `varchar(180)` | nulo | Contact snapshot. |
| `contact_email_snapshot` | `varchar(320)` | nulo | Contact snapshot. |
| `contact_phone_snapshot` | `varchar(40)` | nulo | Contact snapshot. |
| `billing_address_snapshot` | `jsonb` | no nulo | Dirección validada/congelada. |
| `shipping_address_snapshot` | `jsonb` | nulo | Destino congelado. |
| `subtotal` | `numeric(19,4)` | `0`, no negativo | Importe antes de descuentos e impuestos. |
| `discount_total` | `numeric(19,4)` | `0`, no negativo | Descuento total congelado. |
| `tax_total` | `numeric(19,4)` | `0`, no negativo | Impuesto total congelado. |
| `grand_total` | `numeric(19,4)` | `0`, no negativo | Total final congelado. |
| `notes` | `text` | nulo | Observación congelada al confirmar. |
| `version` | `integer` | `1` | Concurrencia. |
| `confirmed_at` | `timestamptz` | nulo | Instante de transición a `CONFIRMED`; es distinto de `ordered_at`. |
| `completed_at` | `timestamptz` | nulo | Instante de transición a `COMPLETED`. |
| `cancelled_at` | `timestamptz` | nulo | Instante de transición a `CANCELLED`. |
| `returned_at` | `timestamptz` | nulo | Instante de transición a `RETURNED`. |
| `confirmed_by_member_id` | `uuid` | nulo | FK compuesta membership, `RESTRICT`; actor de la confirmación. |
| `cancelled_by_member_id` | `uuid` | nulo | FK compuesta membership, `RESTRICT`; actor de la cancelación. |
| `cancellation_reason` | `varchar(500)` | nulo | Obligatorio al cancelar. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría. |
| `archived_at` | `timestamptz` | nulo | Archivo lógico. |

Constraints/índices:

- `UQ_orders_organization_number` y `UQ_orders_organization_id_id`.
- Unique parcial `(organization_id,quote_id)` donde quote no nula: una order por quote.
- Unique parcial `(organization_id,conversion_idempotency_key)` donde no nula.
- `QUOTE` exige quote, quote revision, key y fingerprint; `MANUAL` exige esos
  cuatro campos nulos. La FK triple garantiza que revision pertenece a quote.
- Fingerprint hexadecimal, money/total/currency/version y status/timestamps coherentes.
- Índices tenant+customer/status/orderedAt, quote/revision, deal y owner member.

## Tabla `order_items`

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad que Inventory reserva. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `order_id` | `uuid` | no nulo | FK compuesta order, `RESTRICT`. |
| `quote_revision_item_id` | `uuid` | nulo | FK compuesta immutable revision item, `RESTRICT`. |
| `line_number` | `smallint` | >0 | Orden. |
| `product_id` | `uuid` | no nulo | FK compuesta product, `RESTRICT`. |
| `product_type_snapshot` | `varchar(20)` | no nulo | `PRODUCT`/`SERVICE`. |
| `tracks_inventory_snapshot` | `boolean` | no nulo | Contrato con Inventory. |
| `sku_snapshot` | `varchar(80)` | no nulo | Snapshot. |
| `name_snapshot` | `varchar(180)` | no nulo | Snapshot. |
| `unit_code_snapshot` | `varchar(30)` | no nulo | Snapshot. |
| `description_snapshot` | `text` | nulo | Snapshot. |
| `quantity` | `numeric(19,4)` | no nulo, >0 | Ordered quantity. |
| `unit_price` | `numeric(19,4)` | no nulo, >=0 | Precio unitario congelado. |
| `line_subtotal` | `numeric(19,4)` | no nulo, >=0 | `quantity * unit_price` antes de descuentos. |
| `discount_total` | `numeric(19,4)` | no nulo, >=0 | Descuento congelado de la línea. |
| `taxable_base` | `numeric(19,4)` | no nulo, >=0 | Base gravable después del descuento. |
| `tax_total` | `numeric(19,4)` | no nulo, >=0 | Impuesto congelado de la línea. |
| `line_total` | `numeric(19,4)` | no nulo, >=0 | Total final congelado de la línea. |
| `discount_type` | `varchar(20)` | `NONE` | `NONE`, `PERCENT`, `FIXED`. |
| `discount_value` | `numeric(19,4)` | `0` | Entrada histórica. |
| `tax_code_snapshot` | `varchar(60)` | nulo | Fiscal. |
| `tax_rate_snapshot` | `numeric(5,2)` | `0` | `0..100`. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría; updates solo en draft manual. |

Unique `(order_id,line_number)`, unique parcial `quote_revision_item_id`,
`UQ_order_items_organization_id_id`; checks de quantity/money/totals. Una order
QUOTE exige que todas sus líneas apunten a la accepted revision.

## Tabla `order_status_history`

| Columna | Tipo | Null/default | FK/check/onDelete |
|---|---|---|---|
| `id` | `uuid` | PK | Append-only. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `order_id` | `uuid` | no nulo | FK compuesta orders, `RESTRICT`. |
| `from_status` | `varchar(30)` | nulo | Nulo solo al crear. |
| `to_status` | `varchar(30)` | no nulo | Estado aplicado. |
| `actor_type` | `varchar(10)` | `USER` | `USER`/`SYSTEM`. |
| `changed_by_member_id` | `uuid` | nulo | FK compuesta membership, `RESTRICT`; USER exige member, SYSTEM nulo. |
| `reason` | `varchar(500)` | nulo | Motivo. |
| `metadata` | `jsonb` | `{}` | Cantidades/refs allowlisted. |
| `idempotency_key` | `varchar(150)` | no nulo | Identidad persistida de transición. |
| `request_fingerprint` | `char(64)` | no nulo | Hash hexadecimal. |
| `created_at` | `timestamptz` | no nulo | Orden. |

Unique `(organization_id,idempotency_key)`, índice order+created+id, checks de
status distintos, actor/member y fingerprint. Misma key/fingerprint devuelve el
resultado previo; misma key con otro fingerprint produce `409`.

## Integridad tenant y relaciones

Todos los parents tenant declaran `UQ_<table>_organization_id_id`; todos los
children usan FKs `(organization_id,parent_id)` y `onDelete: RESTRICT`. La FK
`(organization_id,quote_id,quote_revision_id)` referencia una revision de esa quote.
Order **uno** → items/history **muchos**; quote **uno** → cero/una order; accepted
revision item **uno** → cero/un order item. Organization member es parent de
owner/confirm/cancel/history. Inserts directos cross-tenant deben fallar en DB.

Inventory B agregará children de `order_items`; por eso cada item expone
`UQ_order_items_organization_id_id`.

## Migración

Orden: orders sin FK triple, order items, history, FKs compuestas/triple e índices.
No crees fulfillments/reservations todavía. `down` elimina primero children/FKs.
