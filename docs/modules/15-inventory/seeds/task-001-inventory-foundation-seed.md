# Seed task 001: inventario A

**Código:** `SEED-INV-A-001`
**Vienes de:** `../LEARNING-PATH.md`, Recorrido A paso 3.
**Regresa a:** `../LEARNING-PATH.md`, Recorrido A paso 4.
**No continúes hasta:** dos ejecuciones sin duplicar movements ni cambiar balances.

## Dataset A

Por tenant crea:

- Warehouse `MAIN` default con locations tipo `RECEIVING`, `SELLABLE` (`PICKING`),
  `SHIPPING`, `DAMAGED` y `QUARANTINE`; solo PICKING tiene `is_sellable=true`.
- Warehouse `SECONDARY` con location default.
- Stock inicial de tres tracked products mediante `RECEIPT`, nunca UPDATE directo.
- Transfer pareado de una cantidad fija MAIN → SECONDARY.
- Adjustment positivo y negativo con reason demo.
- Un stock por debajo de minimum con alert OPEN y otro recuperado/resuelto.

Faker seeded genera nombres/direcciones; codes, quantities, products, keys y fecha
base son deterministas.

## Idempotencia y transacción

Upsert warehouses/locations por code. Ejecuta transfers/movements a través del
service con keys/fingerprints deterministas. El runner abre una única transacción
y pasa su `EntityManager`; el seeder no abre nested transactions ni usa
repositories globales. No borres inventory manual ni ejecutes en production.

## Verificación

Recalcula la suma de deltas por stock y compárala con projection; transfer parent
tiene exactamente OUT/IN y neto global cero; damaged/quarantine available=0;
segunda ejecución deja balances,
movement count y alerts iguales.
