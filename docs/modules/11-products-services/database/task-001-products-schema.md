# Database task 001: catálogo de productos y servicios

**Código:** `DB-PROD-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 1.
**Regresa a:** `../LEARNING-PATH.md`, paso 2.
**No continúes hasta:** inspeccionar constraints funcionales, FKs tenant y migración reversible.

## Diccionario completo

### Tabla `product_categories`

| Columna                   | Tipo           | Regla    | Motivo                                              |
| ------------------------- | -------------- | -------- | --------------------------------------------------- |
| `id`                      | `uuid`         | PK       | Identidad.                                          |
| `organization_id`         | `uuid`         | no nulo  | Tenant.                                             |
| `parent_category_id`      | `uuid`         | nulo     | Jerarquía de un nivel lógico ilimitado, sin cycles. |
| `code`                    | `varchar(60)`  | no nulo  | Clave estable de configuración.                     |
| `name`                    | `varchar(120)` | no nulo  | Etiqueta visible.                                   |
| `description`             | `text`         | nulo     | Explicación.                                        |
| `status`                  | `varchar(20)`  | `ACTIVE` | `ACTIVE`, `INACTIVE`.                               |
| `created_at`/`updated_at` | `timestamptz`  | no nulos | Auditoría.                                          |
| `archived_at`             | `timestamptz`  | nulo     | Archivo lógico.                                     |

Unique `UQ_product_categories_organization_code` sobre `(organization_id, code)`;
unique `UQ_product_categories_organization_id_id` sobre `(organization_id,id)`;
checks de code normalizado y status; índice por parent/status. La regla anti-cycle
se valida en service y se prueba con consulta recursiva.

### Tabla `product_units`

Campos: `id uuid PK`, `organization_id uuid not null`, `code varchar(30) not
null`, `name varchar(80) not null`, `symbol varchar(20) not null`,
`decimal_scale smallint not null default 0`, `status varchar(20) not null default
ACTIVE`, timestamps y `archived_at`.

Constraints: unique `(organization_id, code)`, `decimal_scale between 0 and 4`,
status permitido, nombres no vacíos y
`UQ_product_units_organization_id_id(organization_id,id)`. Índice
`(organization_id, status, name)`.

### Tabla `products`

| Columna                   | Tipo            | Regla               | Motivo                                     |
| ------------------------- | --------------- | ------------------- | ------------------------------------------ |
| `id`                      | `uuid`          | PK                  | Identidad.                                 |
| `organization_id`         | `uuid`          | no nulo             | Tenant.                                    |
| `sku`                     | `varchar(80)`   | no nulo             | Identificador comercial por tenant.        |
| `name`                    | `varchar(180)`  | no nulo             | Nombre vendible.                           |
| `description`             | `text`          | nulo                | Descripción comercial.                     |
| `product_type`            | `varchar(20)`   | no nulo             | `PRODUCT`, `SERVICE`.                      |
| `category_id`             | `uuid`          | nulo                | Clasificación administrable.               |
| `unit_id`                 | `uuid`          | no nulo             | Unidad de medida.                          |
| `default_tax_rate_id`     | `uuid`          | nulo                | Tasa sugerida; cotización guarda snapshot. |
| `base_price`              | `numeric(19,4)` | no nulo             | Fallback de precio vigente.                |
| `cost`                    | `numeric(19,4)` | no nulo default `0` | Costo interno, sujeto a permiso.           |
| `currency`                | `char(3)`       | no nulo             | ISO 4217, normalmente moneda base.         |
| `tracks_inventory`        | `boolean`       | `false`             | Habilita Inventory.                        |
| `status`                  | `varchar(20)`   | `ACTIVE`            | `ACTIVE`, `INACTIVE`.                      |
| `version`                 | `integer`       | `1`                 | Concurrencia optimista.                    |
| `created_at`/`updated_at` | `timestamptz`   | no nulos            | Auditoría.                                 |
| `archived_at`             | `timestamptz`   | nulo                | Retiro lógico.                             |

Constraints:

- `UQ_products_organization_sku` como índice unique funcional en
  `(organization_id, lower(sku))`.
- `UQ_products_organization_id_id` en `(organization_id,id)` para children de
  Price Lists, Quotes, Orders e Inventory.
- `CK_products_money_nonnegative` para base price/cost.
- `CK_products_type_inventory`: `SERVICE` exige `tracks_inventory=false`.
- Currency tres letras mayúsculas, status/type permitido y version positiva.

Índices: `(organization_id, status, name)`, `(organization_id, category_id,
status)`, parcial `(organization_id, id)` donde `tracks_inventory=true` para
consultas de Inventory. No expongas `cost` a quien solo tenga `products:read`.

### Tabla `product_prices`

Esta tabla conserva el historial del precio base; las listas especiales viven en
el módulo 12.

| Columna                | Tipo            | Regla          | Motivo                               |
| ---------------------- | --------------- | -------------- | ------------------------------------ |
| `id`                   | `uuid`          | PK             | Identidad.                           |
| `organization_id`      | `uuid`          | no nulo        | Tenant.                              |
| `product_id`           | `uuid`          | no nulo        | Producto padre.                      |
| `amount`               | `numeric(19,4)` | no nulo, `>=0` | Precio base de la vigencia.          |
| `currency`             | `char(3)`       | no nulo        | Moneda del precio.                   |
| `valid_from`           | `timestamptz`   | no nulo        | Inicio.                              |
| `valid_to`             | `timestamptz`   | nulo           | Fin; nulo es precio actual.          |
| `reason`               | `varchar(300)`  | nulo           | Motivo del cambio.                   |
| `created_by_member_id` | `uuid`          | no nulo        | Membership que creó el periodo.      |
| `idempotency_key`      | `varchar(150)`  | no nulo        | Cambio de precio persistido.         |
| `request_fingerprint`  | `char(64)`      | no nulo        | Hash product/amount/currency/reason. |
| `created_at`           | `timestamptz`   | no nulo        | Inmutabilidad temporal.              |

Unique parcial `UQ_product_prices_current_product_currency` en
`(product_id, currency)` donde `valid_to is null`; check `valid_to > valid_from`;
índice por `(organization_id, product_id, valid_from desc)`. El registro histórico
no se edita: se cierra y se inserta otro. Agrega
`UQ_product_prices_organization_id_id`, unique tenant+idempotency key y check de
fingerprint hexadecimal.

### Tabla `product_status_history`

Campos completos: `id uuid PK`, `organization_id uuid not null`, `product_id uuid
not null`, `from_status varchar(20) null`, `to_status varchar(20) not null`,
`actor_type varchar(10) not null default USER`, `changed_by_member_id uuid null`,
`reason varchar(500) null`, `idempotency_key varchar(150) not null`,
`request_fingerprint char(64) not null`, `created_at timestamptz not null`.

FKs compuestas product/member usan `RESTRICT`; USER exige member, SYSTEM nulo;
statuses distintos y fingerprint hexadecimal. Unique `(organization_id,
idempotency_key)`, índice product+created+id y append-only.

## Integridad tenant compuesta

- La self FK de category usa `(organization_id,parent_category_id)` →
  `product_categories(organization_id,id)`.
- Products usa FKs compuestas para category, unit y default tax rate.
- Product prices usa `(organization_id,product_id)` y
  `(organization_id,created_by_member_id)`.
- Todos los parents tenant declaran `UQ_<table>_organization_id_id`; no se permite
  una FK simple para un child comercial.

## Relaciones

- Organization **uno** → categories/units/products/prices **muchos**;
  `organization_id` no nulo y `onDelete: RESTRICT`.
- Category padre **uno** → subcategories **muchas**; self FK nula,
  `onDelete: RESTRICT` para impedir huérfanos.
- Category **uno** → products **muchos**; FK nula y `RESTRICT`: se permite producto
  sin categoría, pero no borrar una usada.
- Unit **uno** → products **muchos**; FK no nula y `RESTRICT` porque documentos
  necesitan una unidad válida.
- Tax rate **uno** → products **muchos**; FK nula, `RESTRICT`; el quote copia
  code/porcentaje, no depende de cambios posteriores.
- Product **uno** → product_prices **muchos**; FK no nula y `RESTRICT`.
- Product **uno** → status histories **muchos**; FK compuesta y `RESTRICT`.
- Organization member **uno** → product_prices creados **muchos**; FK compuesta y
  `RESTRICT`.

El service valida reglas de negocio, y las FKs compuestas rechazan también un
insert SQL directo category/unit/tax/member cross-tenant.

## Migración

Orden: categories, units, products, product_prices, status history; luego índices funcionales y
parciales. En `down`, prices antes que products y catálogos. No uses cascada.
