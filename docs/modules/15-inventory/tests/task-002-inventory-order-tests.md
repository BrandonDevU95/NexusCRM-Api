# Test task 002: Inventory B y Orders

**Código:** `TEST-INV-B-002`
**Vienes de:** `../LEARNING-PATH.md`, Recorrido B paso 4.
**Regresa a:** `../LEARNING-PATH.md`, verificación B.
**No continúes hasta:** pasar suites Inventory A, Orders y B juntas.

## Matriz B

### Unit

- Remaining reservable/fulfillable/returnable por item.
- Derivación ACTIVE/PARTIALLY_CONSUMED/CONSUMED/RELEASED y status order.
- Deltas RESERVATION/RELEASE/SALE/RETURN.
- Disposition RESTOCK/DAMAGED y lock ordering.

### Integration

- Confirm multi-item con un stock insuficiente hace rollback total.
- Dos orders concurrentes no oversell.
- Dos fulfillment confirms con misma/diferente key no duplican sale.
- Posted fulfillment/return rechaza cancelación; cancelar draft conserva member,
  timestamp, reason, key y fingerprint.
- Cancel libera exactly remaining, no fulfilled.
- Return no excede fulfilled y movement+status+alert son atómicos.
- Constraints acumulados, uniques y FKs RESTRICT.
- Ledger A+B sigue igual a stock projection.
- Insert directo reservation/fulfillment/return item cross-tenant falla por FK compuesta.
- DAMAGED/QUARANTINE no admiten reservation; return DAMAGED no suma disponible.

### E2E

- Confirm tracked order, list reservations, partial/full fulfillment.
- Cancel before/after partial según regla; release visible.
- Partial/total return y damaged disposition.
- Header/membership/body tenant/cross-tenant en cada command.
- Warehouse/location/product/orderItem incompatibles: `404/422`.
- Permisos read/adjust/fulfill/return separados.
- Key+fingerprint repetidos devuelven mismo resultado; mismo key con payload distinto `409`.
- Stock insuficiente `409` sin order CONFIRMED ni reservas parciales.
- Histories/audit/events se crean una sola vez.

## Regresión obligatoria

Ejecuta todas las suites de Products, Quotes, Orders e Inventory A. Crea una base
vacía, aplica migraciones hasta B, revierte B si no hay datos, vuelve a aplicarla y
repite integración. No depende de seeds globales.
