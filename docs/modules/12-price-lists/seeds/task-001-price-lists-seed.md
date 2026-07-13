# Seed task 001: listas de precios

**Código:** `SEED-PRICE-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 3.
**Regresa a:** `../LEARNING-PATH.md`, paso 4.
**No continúes hasta:** dos ejecuciones con una sola default y sin assignments/items duplicados.

## Dataset

Por organización y moneda base crea:

- `PUBLIC` default prioridad 10, sin descuento.
- `DISTRIBUTOR` prioridad 30, descuento base 10%.
- `WHOLESALE` prioridad 20, con tiers por cantidad.
- `SPECIAL_DEMO` prioridad 100, asignada a un customer y con fixed price.
- Un list DRAFT futuro para probar vigencias/filtros.

Usa products/customers deterministas existentes. Faker seeded solo genera nombre
descriptivo; codes, vigencias, cantidades, currency y porcentajes son constantes.

## Orden e idempotencia

1. Resuelve tenant/currency/products/customers.
2. Upsert lists por `(organization_id, code)`.
3. Upsert items por `(price_list_id, product_id, minimum_quantity)`.
4. Upsert assignment vigente por customer/list.
5. Verifica una default activa por currency.

El runner abre una sola transacción y comparte su `EntityManager`; no abras nested
transactions ni uses repositories globales. Conserva advisory lock. No reemplaces
precios manuales fuera del namespace demo ni ejecutes en producción.

## Comprobaciones de ejemplo

Resuelve el mismo product para customer sin assignment, distribuidor y especial;
documenta origen y precio esperado. Ejecuta otra vez y confirma IDs/conteos.
