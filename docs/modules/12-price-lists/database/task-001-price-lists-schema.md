# Database task 001: listas de precios

**Código:** `DB-PRICE-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 1.
**Regresa a:** `../LEARNING-PATH.md`, paso 2.
**No continúes hasta:** comprobar vigencias, uniques parciales y FKs RESTRICT.

## Diccionario completo

### Tabla `price_lists`

| Columna | Tipo | Regla | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `code` | `varchar(60)` | no nulo | Clave estable. |
| `name` | `varchar(140)` | no nulo | Etiqueta. |
| `price_list_type` | `varchar(20)` | no nulo | `PUBLIC`, `DISTRIBUTOR`, `WHOLESALE`, `SPECIAL`. |
| `currency` | `char(3)` | no nulo | Moneda única de la lista. |
| `priority` | `integer` | `0` | Mayor número gana dentro de candidatos. |
| `base_discount_percent` | `numeric(5,2)` | `0` | Descuento fallback de lista. |
| `valid_from` | `timestamptz` | no nulo | Inicio inclusivo. |
| `valid_to` | `timestamptz` | nulo | Fin exclusivo. |
| `is_default` | `boolean` | `false` | Fallback público por moneda. |
| `status` | `varchar(20)` | `DRAFT` | `DRAFT`, `ACTIVE`, `INACTIVE`. |
| `created_by_member_id` | `uuid` | no nulo | Membership creadora. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría. |
| `archived_at` | `timestamptz` | nulo | Archivo lógico. |

Constraints: unique `(organization_id, code)`, currency mayúscula, priority
acotada no negativa, descuento `0..100`, `valid_to > valid_from`, type/status.
Unique parcial para una lista default `ACTIVE` por `(organization_id, currency)`.
Agrega `UQ_price_lists_organization_id_id(organization_id,id)`. Índices
`(organization_id, status, valid_from, valid_to)` y priority.

### Tabla `price_list_items`

| Columna | Tipo | Regla | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Identidad. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `price_list_id` | `uuid` | no nulo | Lista padre. |
| `product_id` | `uuid` | no nulo | Producto/servicio. |
| `minimum_quantity` | `numeric(19,4)` | `1`, >0 | Tier por volumen. |
| `fixed_price` | `numeric(19,4)` | nulo, >=0 | Precio directo. |
| `discount_percent` | `numeric(5,2)` | nulo, `0..100` | Descuento sobre base. |
| `valid_from` | `timestamptz` | no nulo | Inicio de esta versión del item. |
| `valid_to` | `timestamptz` | nulo | Override de fin. |
| `closed_by_member_id` | `uuid` | nulo | FK compuesta membership, `RESTRICT`; actor de cierre manual. |
| `close_idempotency_key` | `varchar(150)` | nulo | Identidad persistida del close action. |
| `close_request_fingerprint` | `char(64)` | nulo | Hash del cierre. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría. |

`CK_price_list_items_one_pricing_method` exige exactamente uno de fixed/discount.
Unique parcial `(price_list_id, product_id, minimum_quantity)` donde
`valid_to is null`; check de vigencia; `UQ_price_list_items_organization_id_id` e
índices por product/list. Cerrar un item fija `valid_to`; no se elimina ni se
sobrescribe, y después puede abrirse una nueva versión del mismo tier. Los tres
campos de cierre manual son todos nulos o todos no nulos; key unique por tenant.

### Tabla `customer_price_lists`

| Columna | Tipo | Regla | Motivo |
|---|---|---|---|
| `id` | `uuid` | PK | Permite historial. |
| `organization_id` | `uuid` | no nulo | Tenant. |
| `customer_id` | `uuid` | no nulo | Customer asignado. |
| `price_list_id` | `uuid` | no nulo | Lista candidata. |
| `priority_override` | `integer` | nulo | Excepción explícita por customer. |
| `valid_from` | `timestamptz` | no nulo | Inicio inclusivo. |
| `valid_to` | `timestamptz` | nulo | Fin exclusivo. |
| `assigned_by_member_id` | `uuid` | no nulo | Membership que asignó. |
| `idempotency_key` | `varchar(150)` | no nulo | Assign action persistida. |
| `request_fingerprint` | `char(64)` | no nulo | Hash customer/list/vigencia. |
| `created_at`/`updated_at` | `timestamptz` | no nulos | Auditoría. |
| `revoked_at` | `timestamptz` | nulo | Revocación lógica. |

Unique parcial `(customer_id, price_list_id)` donde `revoked_at is null`;
checks de vigencia/priority; índice de resolución en `(organization_id,
customer_id, valid_from, valid_to)` donde no revocada.
Agrega `UQ_customer_price_lists_organization_id_id(organization_id,id)`, unique
tenant+idempotency key y check fingerprint.

### Tabla `price_list_status_history`

Campos completos: `id uuid PK`, `organization_id uuid not null`, `price_list_id
uuid not null`, `from_status varchar(20) null`, `to_status varchar(20) not null`,
`actor_type varchar(10) not null default USER`, `changed_by_member_id uuid null`,
`reason varchar(500) null`, `idempotency_key varchar(150) not null`,
`request_fingerprint char(64) not null`, `created_at timestamptz not null`.
FKs compuestas list/member `RESTRICT`; USER exige member y SYSTEM nulo; unique
tenant+key, índice list+created+id, statuses distintos y append-only.

## Integridad tenant compuesta

Cada parent tenant declara `UQ_<table>_organization_id_id`. Items referencia
price list y product mediante `(organization_id,parent_id)`; assignments hace lo
mismo con customer, price list y assigned member. `onDelete: RESTRICT` se conserva
en todas. La DB debe rechazar un insert directo que mezcle organizaciones.

## Relaciones

- Organization **uno** → lists/items/assignments **muchos**, FK no nula,
  `onDelete: RESTRICT`.
- Price list **uno** → items y customer assignments **muchos**, FK en hijos,
  `RESTRICT`; documentos históricos pueden referenciar la lista.
- Price list **uno** → status histories **muchos**, FK compuesta y `RESTRICT`.
- Product **uno** → list items **muchos**, `RESTRICT`; se inactiva, no se borra.
- Customer **uno** → customer price lists **muchas**, `RESTRICT` para historial.
- Organization member **uno** → listas/asignaciones creadas **muchas**, FK
  compuesta y `RESTRICT`.

El service valida vigencias y precedencia; la FK compuesta garantiza además el
tenant aun si se intenta un insert SQL directo.

## Migración

Orden: price_lists, items, customer assignments; luego índices parciales. `down`
invierte. No uses exclusion constraints de rango hasta dominar y probar su
operación; el service detecta empates/solapamientos y la suite los cubre.
