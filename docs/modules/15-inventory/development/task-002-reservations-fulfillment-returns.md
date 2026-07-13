# Development task 002: reservas, surtidos y devoluciones

**Código:** `DEV-INV-B-002`
**Vienes de:** `../LEARNING-PATH.md`, Recorrido B paso 2.
**Regresa a:** `../LEARNING-PATH.md`, Recorrido B paso 3.
**No continúes hasta:** demostrar all-or-nothing reservation y no double fulfillment.

## Tenant

`X-Organization-Id` obligatorio; guard valida membership y context. Inventory y
Orders consultan todos los parents por tenant. Rechaza tenant desde body/JWT.

## Endpoints/permisos B

- `POST /orders/:id/confirm`: `orders:confirm` + `inventory:reserve`.
- `GET /orders/:id/reservations`: `orders:read`/`inventory:read`.
- `POST /orders/:id/fulfillments`: `orders:fulfill`.
- `POST /orders/:id/fulfillments/:fulfillmentId/post`: `orders:fulfill`.
- `POST /orders/:id/fulfillments/:fulfillmentId/cancel`: `orders:fulfill`, solo DRAFT.
- `POST /orders/:id/cancel`: `orders:cancel`, libera remaining.
- `POST /orders/:id/returns`: `orders:return`.
- `POST /orders/:id/returns/:returnId/post`: `orders:return`.
- `POST /orders/:id/returns/:returnId/cancel`: `orders:return`, solo DRAFT.

DTOs reciben cantidades/location/idempotency key/reason/disposition; el service
persiste request fingerprint; nunca reciben
balances/deltas/status calculados.

## Transacciones críticas

### Confirmar y reservar

1. Lock order draft y valida items/estado/tenant.
2. Ordena tracked items/stock rows por ID para locks deterministas.
3. Selecciona solo locations ACTIVE+SELLABLE; DAMAGED/QUARANTINE no son reservables.
4. Comprueba available para todos. Si uno falla, rollback de todos.
5. Inserta reservations y movements `RESERVATION` con reserved delta positivo.
6. Actualiza stocks, order `CONFIRMED`, histories, audit/outbox.
7. Commit; una idempotency key repetida devuelve el mismo resultado.

### Surtir parcial o total

1. Crea fulfillment DRAFT y líneas sin exceder remaining reservado.
2. Al confirmar, lock reservations/stocks/order.
3. Por línea crea movement `SALE`: onHand y reserved disminuyen en quantity.
4. Actualiza `consumed_quantity` y status ACTIVE/PARTIALLY_CONSUMED/CONSUMED.
5. Deriva order status: partial o completed por suma de items.
6. Confirma fulfillment/history/audit en la misma transacción.

### Cancelar

Libera `reservation.quantity - consumed - released`, crea movement `RELEASE` con
reserved delta negativo y status reservation RELEASED cuando corresponda. Incluso
`PARTIALLY_FULFILLED → CANCELLED` conserva fulfillment SALE ya posteado, libera
solo remanente y exige return si se quiere recuperar stock surtido.

### Devolver

Valida cantidad acumulada devuelta <= fulfilled. Confirmar crea movement `RETURN`
para `RESTOCK` en SELLABLE o `DAMAGED` en location DAMAGED no sellable. Nunca
borra movement SALE. Order pasa a RETURNED solo si toda cantidad surtida fue devuelta; parcial se
refleja en return records y summary.

## Concurrencia e idempotencia

- Row lock en stock/reservation/order y unique keys son obligatorios.
- Orden de locks consistente previene deadlocks.
- Cada reservation/fulfillment/return/action persiste key+fingerprint. Retry
  idéntico devuelve el mismo resultado; key reutilizada con payload distinto da `409`.
- Un fulfillment/return POSTED no se cancela ni edita; se compensa con return u
  otra operación permitida. Solo DRAFT guarda cancel member/time/reason.
- Nunca llama repositories de Orders fuera del transaction manager coordinado.

## Alerts, auditoría y eventos

Reevalúa low stock después de sale/return/release. Audita reserve, release,
fulfillment, cancel y return. Emite tras commit: `inventory.reserved`,
`inventory.released`, `order.confirmed`, `order.partially_fulfilled`,
`order.completed`, `inventory.returned`, `order.returned`, stock alerts.

## Orden de implementación

1. Reservation service y adapter del puerto Orders.
2. Confirm order all-or-nothing.
3. Fulfillment draft/confirm y status derivado.
4. Cancel/release.
5. Return/disposition.
6. Policies, Swagger, audit/outbox e idempotency.
