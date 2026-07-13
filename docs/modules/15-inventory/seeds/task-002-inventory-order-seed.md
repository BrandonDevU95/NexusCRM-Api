# Seed task 002: operaciones de orden e inventario

**Código:** `SEED-INV-B-002`
**Vienes de:** `../LEARNING-PATH.md`, Recorrido B paso 3.
**Regresa a:** `../LEARNING-PATH.md`, Recorrido B paso 4.
**No continúes hasta:** segunda ejecución sin volver a reservar, surtir o devolver.

## Dataset B

Extiende orders del seed base, no crea copias:

- Order confirmed con reservations completas en MAIN.
- Order partially fulfilled con dos items/locations y reservations PARTIALLY_CONSUMED.
- Order completed con fulfillment POSTED y reservations CONSUMED.
- Order cancelled después de reservar, con release total.
- Order completed con return parcial RESTOCK.
- Order RETURNED con devolución total; una línea DAMAGED va a location adecuada.

Usa quantities que quepan en stock A y keys deterministas por operación. Faker
seeded genera notes/reasons no claves.

## Orden e idempotencia

1. Resuelve orders/items/products/stocks A.
2. Llama confirm service con `seed:<tenant>:order:<code>:confirm`.
3. Llama fulfillment con key por documento/línea.
4. Llama cancel/release o returns con keys fijas.
5. Verifica summaries/status.

No insertes movements ni actualices stocks manualmente. El runner comparte un
solo `EntityManager`/transaction con el seeder maestro; no abras nested
transactions ni uses repositories globales. Services reconocen key+fingerprint;
advisory lock y entorno development/test únicamente.

## Verificación

Ledger = projection; reserved nunca negativo; consumed/returned no exceden
ordered; order histories coherentes; segunda ejecución mantiene counts/balances.
