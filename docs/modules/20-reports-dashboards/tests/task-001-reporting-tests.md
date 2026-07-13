# Test task 001: Reporting

## Navegación

- Código: `TEST-RPT-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 4.
- Regresas a: LEARNING-PATH para merge.

## Unit

Date range, filter/dimension compatibility, currency grouping, conversion cero,
forecast formula, permission resolution, cache key tenant-safe y widget grid.
Rechaza query key, sort, field y SQL-like input no allowlisted.

## Integration

Usa un dataset pequeño con resultados calculables a mano:

- Pipeline por stage y organization.
- Lead conversion sin duplicar conversion records.
- Sales por seller/customer/product sin double counting de order items.
- Average cycle/resolution con timestamps definidos.
- Low stock según stock balance/movements.
- Read-only snapshot coherente.
- `EXPLAIN ANALYZE` usa índices esperados en queries críticas.
- Seed dos veces conserva saved personal configuration.

## E2E

Dashboard, ejecutar report, guardar/editar/archivar, widgets personal/org,
missing header, permission denied, range demasiado grande, filtros inválidos y
cross-tenant IDs. Confirma pagination, `asOf`, correlation y error envelope.

Prueba que cache o batching nunca devuelva resultados de otra organization. No
dependas del seed global: fixtures incluyen montos/fechas explícitos.

## Definition of Done

- [ ] Fórmulas tienen asserts numéricos claros.
- [ ] PostgreSQL valida joins, índices y tenant filters.
- [ ] E2E cubre límites y permissions.
- [ ] Ningún test ejecuta SQL enviado por request.
- [ ] Suites pasan solas y en quality gate.
