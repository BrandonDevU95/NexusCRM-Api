# Seed task 001: productos y servicios

**Código:** `SEED-PROD-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 3.
**Regresa a:** `../LEARNING-PATH.md`, paso 4.
**No continúes hasta:** ejecutar dos veces sin duplicar SKU, unidad, categoría ni precio actual.

## Dataset

Por tenant crea codes deterministas:

- Units `PIECE` escala 0, `HOUR` escala 2 y `KILOGRAM` escala 3.
- Categories `HARDWARE`, `SUBSCRIPTIONS`, `CONSULTING`; una subcategoría válida.
- Tres products con inventory tracking y costo/precio distintos.
- Dos services sin inventory tracking, uno por hora.
- Un product inactive para filtros.
- Un historial de cambio de precio: un registro cerrado y uno vigente.

Faker seeded genera nombres/descripciones de demo; SKU, codes, currency y fechas
base son constantes. Tax rate se resuelve por code existente del tenant.

## Idempotencia, transacción y entorno

Upsert categories/units por `(organization_id, code)`, products por SKU
normalizado y precio vigente por product/currency. No cierres de nuevo un historial
ya cerrado. El runner abre una sola transacción y comparte su `EntityManager`;
este seeder no abre nested transactions ni usa repositories globales. Advisory
lock, development/test solamente y sin eliminar registros ajenos.

## Verificación

Segunda ejecución conserva IDs/conteos; solo existe un precio actual por producto;
services no rastrean inventario; todos los padres pertenecen al mismo tenant.
