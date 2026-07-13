# Database task 001: esquema de cotizaciones y revisiones

**Código:** `DB-QUOTE-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 1.
**Regresa a:** `../LEARNING-PATH.md`, paso 2.
**No continúes hasta:** verificar borrador editable, revisiones inmutables, FKs tenant e idempotencia con `up/down/up`.

## Decisión de agregado

`quotes` y `quote_items` representan el área de trabajo editable. Al enviar a
aprobación se congelan `quote_revisions` y `quote_revision_items`. Approval, PDF,
aceptación y Order apuntan a esa revisión; nunca reconstruyen un documento
histórico consultando datos actuales.

## Tabla `quotes`

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK, no nulo | Identidad del agregado. |
| `organization_id` | `uuid` | no nulo | FK a organizations, `RESTRICT`; tenant. |
| `quote_number` | `varchar(60)` | no nulo | Folio único por tenant. |
| `customer_id` | `uuid` | no nulo | FK compuesta a customers, `RESTRICT`. |
| `contact_id` | `uuid` | nulo | FK compuesta a contacts, `RESTRICT`. |
| `deal_id` | `uuid` | nulo | FK compuesta a deals, `RESTRICT`. |
| `owner_member_id` | `uuid` | no nulo | FK compuesta a organization_members, `RESTRICT`. |
| `price_list_id` | `uuid` | nulo | FK compuesta a price_lists, `RESTRICT`; fuente de draft. |
| `accepted_revision_id` | `uuid` | nulo | FK triple a una revision de esta misma quote, `RESTRICT`. |
| `status` | `varchar(30)` | `DRAFT` | `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `CANCELLED`, `CONVERTED`. |
| `currency` | `char(3)` | no nulo | Currency del draft. |
| `issued_on` | `date` | no nulo | Fecha civil del draft. |
| `valid_until` | `date` | no nulo | Expiración civil. |
| `subtotal` | `numeric(19,4)` | `0` | Total de trabajo, no documento aceptado. |
| `discount_total` | `numeric(19,4)` | `0` | Total draft. |
| `tax_total` | `numeric(19,4)` | `0` | Total draft. |
| `grand_total` | `numeric(19,4)` | `0` | `subtotal-discount+tax`. |
| `notes` | `text` | nulo | Contenido de trabajo. |
| `terms` | `text` | nulo | Condiciones de trabajo. |
| `draft_version` | `integer` | `1` | Concurrencia optimista. |
| `last_revision_number` | `integer` | `0` | Secuencia de revisiones congeladas. |
| `approved_at`/`sent_at`/`accepted_at`/`rejected_at`/`expired_at`/`cancelled_at`/`converted_at` | `timestamptz` | nulos | Hitos, no sustituyen histories. |
| `sent_by_member_id`/`cancelled_by_member_id` | `uuid` | nulos | FKs compuestas a memberships, `RESTRICT`. |
| `rejection_reason`/`cancellation_reason` | `varchar(500)` | nulos | Motivos terminales. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría técnica. |
| `archived_at` | `timestamptz` | nulo | Archivo lógico. |

Constraints/índices: `UQ_quotes_organization_number`,
`UQ_quotes_organization_id_id(organization_id,id)`, money no negativo y total
coherente, currency mayúscula, `valid_until>=issued_on`, versiones no negativas,
status/timestamps/reasons coherentes. `ACCEPTED` y `CONVERTED` exigen
`accepted_revision_id`. Índices tenant+customer/status/date, deal, owner y
validUntil.

## Tabla `quote_items` — borrador mutable

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad de línea de trabajo. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `quote_id` | `uuid` | no nulo | FK compuesta a quotes, `RESTRICT`. |
| `line_number` | `smallint` | no nulo, >0 | Orden. |
| `product_id` | `uuid` | no nulo | FK compuesta a products, `RESTRICT`. |
| `product_type_snapshot` | `varchar(20)` | no nulo | `PRODUCT`/`SERVICE`. |
| `sku_snapshot` | `varchar(80)` | no nulo | Snapshot. |
| `name_snapshot` | `varchar(180)` | no nulo | Snapshot. |
| `description_snapshot` | `text` | nulo | Snapshot. |
| `unit_code_snapshot` | `varchar(30)` | no nulo | Snapshot. |
| `quantity` | `numeric(19,4)` | no nulo | >0. |
| `unit_price` | `numeric(19,4)` | no nulo | >=0. |
| `price_source` | `varchar(30)` | no nulo | `BASE`, `LIST_FIXED`, `LIST_DISCOUNT`, `MANUAL`. |
| `price_list_item_id` | `uuid` | nulo | FK compuesta `RESTRICT`; items se cierran, no se borran. |
| `override_reason` | `varchar(500)` | nulo | Obligatorio si source MANUAL. |
| `overridden_by_member_id` | `uuid` | nulo | FK compuesta; obligatorio si MANUAL. |
| `discount_type` | `varchar(20)` | `NONE` | `NONE`, `PERCENT`, `FIXED`. |
| `discount_value` | `numeric(19,4)` | `0` | Entrada validada. |
| `line_subtotal`/`discount_total`/`taxable_base`/`tax_total`/`line_total` | `numeric(19,4)` | no nulos, >=0 | Resultados persistidos. |
| `tax_code_snapshot` | `varchar(60)` | nulo | Código histórico. |
| `tax_rate_snapshot` | `numeric(5,2)` | `0` | `0..100`. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría. |

Unique `(quote_id,line_number)`, `UQ_quote_items_organization_id_id`; checks de
money/totals y `CK_quote_items_manual_override`: MANUAL exige reason+member y otra
source exige ambos nulos. No se acepta un precio manual anónimo.

## Tabla `quote_revisions` — documento inmutable

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad del documento congelado. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `quote_id` | `uuid` | no nulo | FK compuesta a quotes, `RESTRICT`. |
| `revision_number` | `integer` | no nulo, >0 | Consecutivo por quote. |
| `customer_id`/`contact_id` | `uuid` | customer no nulo/contact nulo | FKs compuestas `RESTRICT` para trazabilidad. |
| `customer_name_snapshot` | `varchar(180)` | no nulo | Party snapshot. |
| `customer_legal_name_snapshot` | `varchar(220)` | nulo | Legal snapshot. |
| `customer_tax_id_snapshot` | `varchar(40)` | nulo | Fiscal snapshot. |
| `contact_name_snapshot` | `varchar(180)` | nulo | Contact snapshot. |
| `contact_email_snapshot` | `varchar(320)` | nulo | Contact snapshot. |
| `contact_phone_snapshot` | `varchar(40)` | nulo | Contact snapshot. |
| `billing_address_snapshot` | `jsonb` | no nulo | Estructura validada/congelada. |
| `shipping_address_snapshot` | `jsonb` | nulo | Destino congelado. |
| `currency` | `char(3)` | no nulo | Moneda. |
| `issued_on`/`valid_until` | `date` | no nulos | Fechas civiles congeladas. |
| `notes_snapshot`/`terms_snapshot` | `text` | nulos | Contenido congelado. |
| `subtotal`/`discount_total`/`tax_total`/`grand_total` | `numeric(19,4)` | no nulos | Totales inmutables. |
| `created_by_member_id` | `uuid` | no nulo | FK compuesta a membership, `RESTRICT`. |
| `created_at` | `timestamptz` | no nulo | Momento de congelado. |

Unique `(quote_id,revision_number)`, `UQ_quote_revisions_organization_id_id` y
`UQ_quote_revisions_organization_quote_id_id(organization_id,quote_id,id)` para
la FK de `accepted_revision_id`. Checks equivalentes de fechas/money/totals. No
tiene `updated_at` ni endpoint PATCH: es append-only.

## Tabla `quote_revision_items` — líneas inmutables

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `quote_revision_id` | `uuid` | no nulo | FK compuesta a revisions, `RESTRICT`. |
| `source_quote_item_id` | `uuid` | no nulo | FK compuesta al draft item, `RESTRICT`. |
| `line_number` | `smallint` | >0 | Orden. |
| `product_id` | `uuid` | no nulo | FK compuesta products, `RESTRICT`. |
| `product_type_snapshot`/`sku_snapshot`/`name_snapshot`/`unit_code_snapshot` | `varchar` limitado | no nulos | Snapshots. |
| `description_snapshot` | `text` | nulo | Snapshot. |
| `quantity`/`unit_price` | `numeric(19,4)` | no nulos | >0 / >=0. |
| `price_source` | `varchar(30)` | no nulo | Fuente congelada. |
| `price_list_item_id` | `uuid` | nulo | FK compuesta `RESTRICT`. |
| `override_reason` | `varchar(500)` | nulo | Snapshot obligatorio para MANUAL. |
| `overridden_by_member_id` | `uuid` | nulo | FK compuesta, obligatorio MANUAL. |
| `discount_type`/`discount_value` | `varchar(20)` / `numeric(19,4)` | `NONE` / `0` | Descuento. |
| `line_subtotal`/`discount_total`/`taxable_base`/`tax_total`/`line_total` | `numeric(19,4)` | no nulos | Totales. |
| `tax_code_snapshot`/`tax_rate_snapshot` | `varchar(60)` / `numeric(5,2)` | nulo / `0` | Impuesto congelado. |
| `created_at` | `timestamptz` | no nulo | Inmutabilidad. |

Unique `(quote_revision_id,line_number)`, `UQ_quote_revision_items_organization_id_id`,
checks iguales al draft y sin `updated_at`.

## Tabla `quote_status_history`

| Columna | Tipo | Null/default | FK/check/onDelete |
|---|---|---|---|
| `id` | `uuid` | PK | Append-only. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `quote_id` | `uuid` | no nulo | FK compuesta quotes, `RESTRICT`. |
| `quote_revision_id` | `uuid` | nulo | FK compuesta revision, `RESTRICT`; requerido desde submit. |
| `from_status`/`to_status` | `varchar(30)` | from nulo/to no nulo | Distintos. |
| `actor_type` | `varchar(10)` | `USER` | `USER`/`SYSTEM`. |
| `changed_by_member_id` | `uuid` | nulo | FK compuesta membership, `RESTRICT`; USER requiere member, SYSTEM nulo. |
| `reason` | `varchar(500)` | nulo | Motivo. |
| `metadata` | `jsonb` | `{}` | Allowlist, sin secretos. |
| `idempotency_key` | `varchar(150)` | no nulo | Identidad del comando. |
| `request_fingerprint` | `char(64)` | no nulo | Hash hexadecimal del request normalizado. |
| `created_at` | `timestamptz` | no nulo | Orden. |

Unique `(organization_id,idempotency_key)` e índice quote+created+id. Misma key
y fingerprint devuelve resultado previo; fingerprint distinto produce `409`.

## Tabla `quote_approvals`

| Columna | Tipo | Null/default | FK/check/onDelete |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `quote_id` | `uuid` | no nulo | FK compuesta quotes, `RESTRICT`. |
| `quote_revision_id` | `uuid` | no nulo | FK compuesta revisions, `RESTRICT`. |
| `sequence` | `smallint` | no nulo, >0 | Orden. |
| `requested_by_member_id` | `uuid` | no nulo | FK compuesta membership, `RESTRICT`. |
| `approver_member_id` | `uuid` | no nulo | FK compuesta membership, `RESTRICT`. |
| `status` | `varchar(20)` | `PENDING` | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`. |
| `requested_at` | `timestamptz` | no nulo | Inicio. |
| `decided_at` | `timestamptz` | nulo | Decisión. |
| `comment` | `text` | nulo | Requerido al rechazar. |
| `idempotency_key` | `varchar(150)` | no nulo | Acción persistida. |
| `request_fingerprint` | `char(64)` | no nulo | Hash del comando. |

Unique `(quote_revision_id,sequence)`, unique `(organization_id,idempotency_key)`,
`UQ_quote_approvals_organization_id_id`; checks status/decision/comment/fingerprint.
Índices approver+status+requested y quote revision.

## Tabla `quote_documents`

| Columna | Tipo | Null/default | FK/check/onDelete |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `quote_revision_id` | `uuid` | no nulo | FK compuesta revision, `RESTRICT`; nunca apunta al draft. |
| `document_type` | `varchar(20)` | `PDF` | Allowlist `PDF`. |
| `storage_key` | `varchar(500)` | no nulo | Unique por tenant. |
| `file_name` | `varchar(255)` | no nulo | Presentación. |
| `mime_type` | `varchar(120)` | `application/pdf` | Check exacto para PDF. |
| `byte_size` | `bigint` | no nulo, >0 | Límite. |
| `checksum_sha256` | `char(64)` | no nulo | Hexadecimal. |
| `generated_by_member_id` | `uuid` | no nulo | FK compuesta membership, `RESTRICT`. |
| `generated_at` | `timestamptz` | no nulo | Auditoría. |
| `is_current` | `boolean` | `true` | Una salida vigente por revision/type. |
| `idempotency_key` | `varchar(150)` | no nulo | Generación persistida. |
| `request_fingerprint` | `char(64)` | no nulo | Hash revision/template/options. |

Unique `(organization_id,storage_key)`, unique parcial
`(quote_revision_id,document_type)` donde current, y
`UQ_quote_documents_organization_id_id`; unique tenant+idempotency key y check
fingerprint hexadecimal. No tiene contenido binario.

## Integridad tenant y relaciones

Todo parent tenant declara `UQ_<table>_organization_id_id`; todo child usa FK
compuesta `(organization_id,parent_id)` con `onDelete: RESTRICT`. Esto aplica a
customer, contact, deal, memberships, price list/items, products, quote, draft
items y revisions. La FK triple de accepted revision garantiza que la revision
pertenece a esa misma quote. PostgreSQL debe rechazar inserts directos cross-tenant.

Lados: quote **uno** → draft items/revisions/histories **muchos**; revision **uno**
→ revision items/approvals/documents **muchos**. La FK vive siempre en el lado
muchos. Ninguna relación histórica usa cascade.

## Migración

Orden `up`: quotes, draft items, revisions, revision items, accepted-revision FK,
status history, approvals, documents e índices. `down` invierte y elimina primero
la FK circular controlada. No generes folios, snapshots ni datos en migración.
