# Database task 002: reservas, surtidos y devoluciones

**Código:** `DB-INV-B-002`
**Vienes de:** `../LEARNING-PATH.md`, Recorrido B paso 1.
**Regresa a:** `../LEARNING-PATH.md`, Recorrido B paso 2.
**No continúes hasta:** comprobar cantidades, idempotencia, cancel metadata, FKs tenant y `up/down/up`.

## Tabla `inventory_reservations`

| Columna                   | Tipo            | Null/default | FK/check/onDelete y motivo                                                |
| ------------------------- | --------------- | ------------ | ------------------------------------------------------------------------- |
| `id`                      | `uuid`          | PK           | Aggregate de compromiso.                                                  |
| `organization_id`         | `uuid`          | no nulo      | Tenant.                                                                   |
| `order_item_id`           | `uuid`          | no nulo      | FK compuesta order item, `RESTRICT`.                                      |
| `product_id`              | `uuid`          | no nulo      | FK compuesta product, `RESTRICT`.                                         |
| `warehouse_id`            | `uuid`          | no nulo      | FK compuesta warehouse, `RESTRICT`; debe ser el warehouse de la location. |
| `location_id`             | `uuid`          | no nulo      | FK compuesta location vendible, `RESTRICT`.                               |
| `quantity`                | `numeric(19,4)` | no nulo      | >0 originalmente reservada.                                               |
| `consumed_quantity`       | `numeric(19,4)` | `0`          | Cantidad convertida en SALE.                                              |
| `released_quantity`       | `numeric(19,4)` | `0`          | Cantidad liberada.                                                        |
| `status`                  | `varchar(30)`   | `ACTIVE`     | `ACTIVE`, `PARTIALLY_CONSUMED`, `CONSUMED`, `RELEASED`.                   |
| `created_by_member_id`    | `uuid`          | no nulo      | FK compuesta membership, `RESTRICT`.                                      |
| `idempotency_key`         | `varchar(150)`  | no nulo      | Comando reserve.                                                          |
| `request_fingerprint`     | `char(64)`      | no nulo      | Hash del request.                                                         |
| `created_at`/`updated_at` | `timestamptz`   | no nulos     | Auditoría.                                                                |

Checks `consumed+released<=quantity` y status exacto respecto a acumulados;
fingerprint hexadecimal. Unique `(organization_id,idempotency_key)`, parcial una
ACTIVE/PARTIALLY_CONSUMED por orderItem+location y
`UQ_inventory_reservations_organization_id_id`. La location debe ser ACTIVE,
`location_type=SELLABLE` e `is_sellable=true`; DAMAGED/QUARANTINE nunca reserva.

## Tabla `order_fulfillments`

| Columna                      | Tipo           | Null/default | FK/check/onDelete y motivo                                           |
| ---------------------------- | -------------- | ------------ | -------------------------------------------------------------------- |
| `id`                         | `uuid`         | PK           | Identidad de surtido.                                                |
| `organization_id`            | `uuid`         | no nulo      | Tenant.                                                              |
| `order_id`                   | `uuid`         | no nulo      | FK compuesta order, `RESTRICT`.                                      |
| `warehouse_id`               | `uuid`         | no nulo      | FK compuesta warehouse, `RESTRICT`.                                  |
| `fulfillment_number`         | `varchar(60)`  | no nulo      | Folio por tenant.                                                    |
| `status`                     | `varchar(20)`  | `DRAFT`      | `DRAFT`, `POSTED`, `CANCELLED`.                                      |
| `notes`                      | `text`         | nulo         | Observación.                                                         |
| `created_by_member_id`       | `uuid`         | no nulo      | FK compuesta membership, `RESTRICT`.                                 |
| `idempotency_key`            | `varchar(150)` | no nulo      | Creación idempotente.                                                |
| `request_fingerprint`        | `char(64)`     | no nulo      | Fingerprint creación.                                                |
| `post_idempotency_key`       | `varchar(150)` | nulo         | Identidad persistida del comando de posteo; obligatoria en `POSTED`. |
| `post_request_fingerprint`   | `char(64)`     | nulo         | Hash del comando de posteo; obligatorio en `POSTED`.                 |
| `posted_by_member_id`        | `uuid`         | nulo         | FK compuesta membership; obligatoria en `POSTED`.                    |
| `posted_at`                  | `timestamptz`  | nulo         | Instante del posteo; obligatorio en `POSTED`.                        |
| `cancel_idempotency_key`     | `varchar(150)` | nulo         | Identidad del comando que cancela un draft.                          |
| `cancel_request_fingerprint` | `char(64)`     | nulo         | Hash del comando de cancelación.                                     |
| `cancelled_by_member_id`     | `uuid`         | nulo         | FK compuesta membership; actor de la cancelación del draft.          |
| `cancelled_at`               | `timestamptz`  | nulo         | Instante de cancelación del draft.                                   |
| `cancellation_reason`        | `varchar(500)` | nulo         | Obligatorio CANCELLED.                                               |
| `created_at`/`updated_at`    | `timestamptz`  | no nulos     | Auditoría.                                                           |

Unique tenant+number y uniques tenant para cada idempotency key no nula;
`UQ_order_fulfillments_organization_id_id`; checks de pares key/fingerprint,
actor/time/status. Un fulfillment POSTED **no puede cancelarse**: una corrección
se modela con `order_returns`/movements compensatorios.

## Tabla `order_fulfillment_items`

| Columna                    | Tipo            | Null/default | FK/check/onDelete y motivo                                              |
| -------------------------- | --------------- | ------------ | ----------------------------------------------------------------------- |
| `id`                       | `uuid`          | PK           | Identidad.                                                              |
| `organization_id`          | `uuid`          | no nulo      | Tenant.                                                                 |
| `order_fulfillment_id`     | `uuid`          | no nulo      | FK compuesta fulfillment, `RESTRICT`.                                   |
| `order_item_id`            | `uuid`          | no nulo      | FK compuesta order item, `RESTRICT`.                                    |
| `inventory_reservation_id` | `uuid`          | no nulo      | FK compuesta reservation, `RESTRICT`.                                   |
| `product_id`               | `uuid`          | no nulo      | FK compuesta product, `RESTRICT`; debe coincidir con la línea de orden. |
| `location_id`              | `uuid`          | no nulo      | FK compuesta location, `RESTRICT`; origen real del surtido.             |
| `quantity`                 | `numeric(19,4)` | no nulo      | >0.                                                                     |
| `inventory_movement_id`    | `uuid`          | nulo         | FK compuesta movement, `RESTRICT`; obligatorio cuando parent POSTED.    |
| `created_at`               | `timestamptz`   | no nulo      | Auditoría; immutable al postear.                                        |

Unique fulfillment+orderItem+location, movement unique parcial,
`UQ_order_fulfillment_items_organization_id_id`; cantidades no exceden remaining.

## Tabla `order_returns`

| Columna                      | Tipo           | Null/default | FK/check/onDelete y motivo                                  |
| ---------------------------- | -------------- | ------------ | ----------------------------------------------------------- |
| `id`                         | `uuid`         | PK           | Identidad de devolución.                                    |
| `organization_id`            | `uuid`         | no nulo      | Tenant.                                                     |
| `order_id`                   | `uuid`         | no nulo      | FK compuesta order, `RESTRICT`.                             |
| `order_fulfillment_id`       | `uuid`         | nulo         | FK compuesta posted fulfillment, `RESTRICT`.                |
| `return_number`              | `varchar(60)`  | no nulo      | Folio por tenant.                                           |
| `status`                     | `varchar(20)`  | `DRAFT`      | `DRAFT`, `POSTED`, `CANCELLED`.                             |
| `reason`                     | `varchar(500)` | no nulo      | Motivo.                                                     |
| `created_by_member_id`       | `uuid`         | no nulo      | FK membership, `RESTRICT`.                                  |
| `idempotency_key`            | `varchar(150)` | no nulo      | Identidad persistida de creación.                           |
| `request_fingerprint`        | `char(64)`     | no nulo      | Hash del request de creación.                               |
| `post_idempotency_key`       | `varchar(150)` | nulo         | Identidad del comando de posteo; obligatoria en `POSTED`.   |
| `post_request_fingerprint`   | `char(64)`     | nulo         | Hash del comando de posteo; obligatorio en `POSTED`.        |
| `posted_by_member_id`        | `uuid`         | nulo         | FK compuesta membership; obligatoria en `POSTED`.           |
| `posted_at`                  | `timestamptz`  | nulo         | Instante del posteo; obligatorio en `POSTED`.               |
| `cancel_idempotency_key`     | `varchar(150)` | nulo         | Identidad del comando de cancelación del draft.             |
| `cancel_request_fingerprint` | `char(64)`     | nulo         | Hash del comando de cancelación.                            |
| `cancelled_by_member_id`     | `uuid`         | nulo         | FK compuesta membership; actor de la cancelación del draft. |
| `cancelled_at`               | `timestamptz`  | nulo         | Instante de la cancelación del draft.                       |
| `cancellation_reason`        | `varchar(500)` | nulo         | Obligatorio CANCELLED.                                      |
| `created_at`/`updated_at`    | `timestamptz`  | no nulos     | Auditoría.                                                  |

Unique tenant+returnNumber y cada idempotency key; UQ tenant+id; checks de pares,
fingerprints, actor/time/status. Return POSTED tampoco se cancela: se compensa con
otra operación controlada, no borrando movements.

## Tabla `order_return_items`

| Columna                     | Tipo            | Null/default | FK/check/onDelete y motivo                                              |
| --------------------------- | --------------- | ------------ | ----------------------------------------------------------------------- |
| `id`                        | `uuid`          | PK           | Identidad.                                                              |
| `organization_id`           | `uuid`          | no nulo      | Tenant.                                                                 |
| `order_return_id`           | `uuid`          | no nulo      | FK compuesta return, `RESTRICT`.                                        |
| `order_item_id`             | `uuid`          | no nulo      | FK compuesta order item, `RESTRICT`.                                    |
| `order_fulfillment_item_id` | `uuid`          | nulo         | FK compuesta fulfillment item, `RESTRICT`.                              |
| `product_id`                | `uuid`          | no nulo      | FK compuesta product, `RESTRICT`; debe coincidir con la línea devuelta. |
| `location_id`               | `uuid`          | no nulo      | FK compuesta location, `RESTRICT`; destino según `disposition`.         |
| `quantity`                  | `numeric(19,4)` | no nulo      | >0 y <= returnable.                                                     |
| `disposition`               | `varchar(20)`   | no nulo      | `RESTOCK`, `DAMAGED`, `OTHER`.                                          |
| `inventory_movement_id`     | `uuid`          | nulo         | FK compuesta movement, `RESTRICT`; obligatorio POSTED si mueve stock.   |
| `created_at`                | `timestamptz`   | no nulo      | Auditoría.                                                              |

Unique return+fulfillmentItem+location, movement unique parcial,
`UQ_order_return_items_organization_id_id`. RESTOCK exige location SELLABLE;
DAMAGED exige location_type DAMAGED e `is_sellable=false`; OTHER exige política
sin sumarlo a disponible.

## Movements y relaciones

La migración B amplía tipos con `RESERVATION`, `RELEASE`, `SALE`, `RETURN` sin
editar A. Reservation/release tienen onHand delta cero; SALE reduce onHand y
reserved; RETURN solo aumenta onHand en la location de disposition válida.

Todos los parents tenant declaran `UQ_<table>_organization_id_id`; todos los
children usan FK `(organization_id,parent_id)` con `onDelete: RESTRICT`. Order
item **uno** tiene reservations/fulfillment/return items **muchos**; fulfillment
y return **uno** tienen items **muchos**; reservation **uno** se consume por
fulfillment items **muchos**. Memberships son parents de todos los actores.

Service valida además que product/order/location/warehouse coincidan, pero un
insert SQL directo cross-tenant debe fallar en PostgreSQL.

## Migración

Orden: ampliar movement check, reservations, fulfillments/items, returns/items,
FKs/indices. `down` elimina dependientes y solo restaura check A si no existen
movements B; una reversión con ventas reales puede ser insegura y debe detenerse.
