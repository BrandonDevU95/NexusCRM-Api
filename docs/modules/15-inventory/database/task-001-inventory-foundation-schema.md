# Database task 001: fundación de inventario

**Código:** `DB-INV-A-001`
**Vienes de:** `../LEARNING-PATH.md`, Recorrido A paso 1.
**Regresa a:** `../LEARNING-PATH.md`, Recorrido A paso 2.
**No continúes hasta:** demostrar ledger/projection, locations vendibles, transfer agregado y FKs tenant con `up/down/up`.

## Principio

`inventory_stocks` es proyección; `inventory_movements` es evidencia append-only.
No existe `setStock`. Transferencia es `inventory_transfers` **uno** con dos
movements **muchos** (`TRANSFER_OUT` y `TRANSFER_IN`), no movements enlazados entre sí.

## Tabla `warehouses`

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | FK organization, `RESTRICT`. |
| `code` | `varchar(40)` | no nulo | Clave tenant. |
| `name` | `varchar(140)` | no nulo | Nombre. |
| `description` | `text` | nulo | Detalle. |
| `status` | `varchar(20)` | `ACTIVE` | `ACTIVE`, `INACTIVE`. |
| `is_default` | `boolean` | `false` | Default por tenant. |
| `address` | `jsonb` | nulo | Estructura validada. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría. |
| `archived_at` | `timestamptz` | nulo | Archivo. |

Unique `(organization_id,code)`, default ACTIVE parcial y
`UQ_warehouses_organization_id_id`. Índice tenant+status+name.

## Tabla `warehouse_locations`

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `warehouse_id` | `uuid` | no nulo | FK compuesta warehouse, `RESTRICT`. |
| `code` | `varchar(50)` | no nulo | Clave dentro del warehouse. |
| `name` | `varchar(120)` | no nulo | Nombre. |
| `location_type` | `varchar(20)` | no nulo | `SELLABLE`, `RECEIVING`, `SHIPPING`, `DAMAGED`, `QUARANTINE`. |
| `is_sellable` | `boolean` | `false` | Solo SELLABLE puede ser true. |
| `status` | `varchar(20)` | `ACTIVE` | `ACTIVE`, `INACTIVE`. |
| `is_default` | `boolean` | `false` | Default dentro del warehouse. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría. |
| `archived_at` | `timestamptz` | nulo | Archivo. |

Checks: `SELLABLE ↔ is_sellable=true`; los otros tipos exigen false. Unique
`(organization_id,warehouse_id,code)`, default parcial por warehouse y
`UQ_warehouse_locations_organization_id_id`. `DAMAGED`/`QUARANTINE` nunca
contribuyen a available ni aceptan reservations.

## Tabla `inventory_stocks`

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Lock target. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `warehouse_id` | `uuid` | no nulo | FK compuesta warehouse, `RESTRICT`. |
| `location_id` | `uuid` | no nulo | FK compuesta location, `RESTRICT`. |
| `product_id` | `uuid` | no nulo | FK compuesta tracked product, `RESTRICT`. |
| `quantity_on_hand` | `numeric(19,4)` | `0` | >=0. |
| `quantity_reserved` | `numeric(19,4)` | `0` | >=0 y <= on hand. |
| `minimum_quantity` | `numeric(19,4)` | `0` | >=0. |
| `reorder_quantity` | `numeric(19,4)` | `0` | >=0. |
| `version` | `integer` | `1` | >0. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría. |

Unique `(organization_id,location_id,product_id)` y
`UQ_inventory_stocks_organization_id_id`. `reservable_quantity` es
`on_hand-reserved` solo si location ACTIVE+SELLABLE+isSellable; en otro tipo es
cero. No guardes available. Índices tenant+product+warehouse/location.

## Tabla `inventory_transfers`

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Parent de dos movements. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `product_id` | `uuid` | no nulo | FK compuesta product, `RESTRICT`. |
| `from_warehouse_id`/`from_location_id` | `uuid` | no nulos | FKs compuestas origen, `RESTRICT`. |
| `to_warehouse_id`/`to_location_id` | `uuid` | no nulos | FKs compuestas destino, `RESTRICT`. |
| `quantity` | `numeric(19,4)` | no nulo | >0. |
| `status` | `varchar(20)` | `POSTED` | `POSTED`; una corrección usa transferencia compensatoria. |
| `reason` | `varchar(500)` | no nulo | Explicación. |
| `created_by_member_id` | `uuid` | no nulo | FK compuesta membership, `RESTRICT`. |
| `idempotency_key` | `varchar(150)` | no nulo | Identidad del comando. |
| `request_fingerprint` | `char(64)` | no nulo | Hash hexadecimal. |
| `posted_at`/`created_at` | `timestamptz` | no nulos | Negocio/auditoría. |

Unique `(organization_id,idempotency_key)`,
`UQ_inventory_transfers_organization_id_id`; checks locations diferentes,
quantity/fingerprint/status. Same key+fingerprint retorna transfer; otro hash `409`.

## Tabla `inventory_movements`

| Columna | Tipo | Null/default | FK/check/onDelete y motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Evidencia. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `warehouse_id`/`location_id`/`product_id` | `uuid` | no nulos | FKs compuestas, `RESTRICT`. |
| `transfer_id` | `uuid` | nulo | FK compuesta inventory_transfers, `RESTRICT`. |
| `movement_type` | `varchar(30)` | no nulo | A: `RECEIPT`, `ISSUE`, `ADJUSTMENT_POSITIVE`, `ADJUSTMENT_NEGATIVE`, `TRANSFER_IN`, `TRANSFER_OUT`; B amplía. |
| `quantity` | `numeric(19,4)` | >0 | Magnitud positiva. |
| `on_hand_delta`/`reserved_delta` | `numeric(19,4)` | no nulos | Deltas derivados, no DTO. |
| `balance_on_hand_after`/`balance_reserved_after` | `numeric(19,4)` | no nulos | >=0 y reserved<=onHand. |
| `source_type` | `varchar(40)` | no nulo | Allowlist. |
| `source_id` | `uuid` | nulo | Referencia externa controlada. |
| `reason` | `varchar(500)` | no nulo | Motivo. |
| `idempotency_key` | `varchar(150)` | no nulo | Unique por tenant. |
| `request_fingerprint` | `char(64)` | no nulo | Hash del command. |
| `created_by_member_id` | `uuid` | no nulo | FK compuesta membership, `RESTRICT`. |
| `occurred_at`/`created_at` | `timestamptz` | no nulos | Negocio/técnico. |
| `metadata` | `jsonb` | `{}` | Allowlist. |

Unique `(organization_id,idempotency_key)`,
`UQ_inventory_movements_organization_id_id`; checks deltas/balances/fingerprint.
TRANSFER_IN/OUT exigen `transfer_id`, tipos restantes lo prohíben. Unique
`(transfer_id,movement_type)` garantiza exactamente un OUT y un IN una vez
posteado. Índices tenant+product+occurred, location, source y transfer. No hay
`paired_movement_id`.

## Tabla `inventory_alerts`

Campos completos: `id uuid PK`, `organization_id uuid not null`,
`inventory_stock_id uuid not null`, `alert_type varchar(20) not null`, `status
varchar(20) not null default OPEN`, `threshold_quantity numeric(19,4) not null`,
`observed_quantity numeric(19,4) not null`, `first_detected_at timestamptz not
null`, `last_detected_at timestamptz not null`, `acknowledged_by_member_id uuid
null`, `acknowledged_at timestamptz null`, `resolved_at timestamptz null`,
`created_at/updated_at timestamptz not null`.

FK compuesta stock/member y `RESTRICT`; codes `LOW_STOCK`/`OUT_OF_STOCK`,
`OPEN`/`ACKNOWLEDGED`/`RESOLVED`; actor/time checks. Unique parcial alert activo
por stock/type, `UQ_inventory_alerts_organization_id_id`; observed disponible se
calcula únicamente sobre location sellable.

## Integridad tenant y relaciones

Cada parent declara `UQ_<table>_organization_id_id`; cada child/FK redundante usa
`(organization_id,parent_id)` y `onDelete: RESTRICT`. Location→warehouse,
stock/movement→warehouse+location+product, transfer→origen/destino/product/member,
movement→transfer y alert→stock/member quedan protegidos por DB. Un insert directo
cross-tenant debe fallar.

## Migración

Orden: warehouses, locations, stocks, transfers, movements, alerts e índices.
`down` invierte. B amplía movement types con nueva migración; no edita A.
