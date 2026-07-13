# Development task 002: lifecycle y contrato con Inventory

**Código:** `DEV-ORDER-002`
**Vienes de:** `../LEARNING-PATH.md`, paso 3.
**Regresa a:** `../LEARNING-PATH.md`, paso 4.
**No continúes hasta:** dejar explícito qué funciona antes y después de Inventory B.

## Tenant

Mantén header `X-Organization-Id`, membership activa y queries tenant-scoped.
Nunca aceptes tenant en body/JWT.

## Máquina de estados base

- `DRAFT → CONFIRMED`: services-only en esta rama; inventory items esperan B.
- `CONFIRMED → PREPARING`: cuando la reserva haya sido creada por B.
- `PREPARING → PARTIALLY_FULFILLED → COMPLETED`: lo decide B por cantidades.
- `DRAFT/CONFIRMED/PREPARING → CANCELLED` según cantidades surtidas.
- `PARTIALLY_FULFILLED → CANCELLED` cancela únicamente el remanente: conserva
  fulfillment/movements ya posteados y libera reservations restantes.
- `COMPLETED → RETURNED` solo si B confirma devolución total; devoluciones
  parciales viven en records de return sin mentir en status final.

No regreses states ni edites items confirmados. Una corrección operativa usa
cancelación, release, fulfillment o return con historia compensatoria.

## Contrato con Inventory B

Define una interfaz de dominio, no una importación circular de repositories:

- Consultar disponibilidad por cada order item/ubicación.
- Reservar todos los tracked items atómicamente con idempotency key.
- Liberar cantidades no surtidas al cancelar.
- Confirmar fulfillment parcial/completo y obtener resumen por order item.
- Registrar return y movimiento compensatorio.

Orders decide la transición comercial; Inventory decide si las cantidades/stock
permiten la operación. La transacción coordinada usa el mismo DataSource/manager.
No publiques `order.confirmed` antes de confirmar reservas.

## Reglas de cancelación antes de B

- Draft se cancela sin stock.
- Services-only confirmed puede cancelarse si policy lo permite.
- Tracked order no se confirma todavía: responde conflicto de capability claro,
  no crea un estado parcialmente reservado.
- Después de B, cancelación libera solo remaining reservations; si ya hay
  fulfillment, lo conserva; se requiere return para recuperar ese stock.
- `ordered_at` representa el momento de negocio informado al crear la order;
  `confirmed_at` se fija exclusivamente en la transición a CONFIRMED.

## Auditoría y eventos

Audita confirm/cancel/status. Eventos definitivos: `order.confirmed`,
`order.cancelled`, `order.partially_fulfilled`, `order.completed`,
`order.returned`. En esta rama solo emite los que ya tienen side effects completos.

## Orden de implementación

1. State machine pura y status history.
2. Confirm/cancel services-only.
3. Puerto Inventory y error de capability temporal probado.
4. Policies, idempotency, Swagger y auditoría.
5. Documenta los tests que Inventory B debe reactivar/extender.
