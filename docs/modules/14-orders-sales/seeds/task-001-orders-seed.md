# Seed task 001: órdenes base

**Código:** `SEED-ORDER-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 4.
**Regresa a:** `../LEARNING-PATH.md`, paso 5.
**No continúes hasta:** dos ejecuciones sin order/line/history duplicados.

## Dataset base

Por tenant crea:

- Order manual draft con service.
- Order manual confirmed services-only.
- Order desde quote accepted, convirtiendo quote a CONVERTED.
- Order cancelled con reason.
- Order draft con tracked products que Inventory B usará para reserva/surtido.

No marques tracked order como confirmed antes de Inventory B. Usa folios demo
deterministas coordinados con `number_sequences`; snapshots/totales vienen de la
calculadora y quote, no de números inventados.

## Idempotencia y orden

1. Resuelve tenant, customer, quote accepted revision, products y memberships.
2. Upsert orders por `(organization_id, order_number)`.
3. Upsert items por line number e histories por fixture key controlada.
4. Conversión quote/order se ejecuta una sola vez y reconoce order existente.

El runner abre una sola transacción y comparte su `EntityManager`; este seeder no
abre nested transactions ni usa repositories globales. Conserva advisory lock y
bloqueo production. Inventory B extiende el mismo order fixture.

## Verificación

Una accepted revision → una order; party/items/totals coinciden; orderedAt y
confirmedAt conservan semánticas distintas; status/timestamps/history coherentes;
tracked draft sin reservation; segunda ejecución conserva IDs y conteos.
