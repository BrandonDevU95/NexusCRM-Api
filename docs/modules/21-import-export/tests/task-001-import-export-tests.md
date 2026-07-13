# Test task 001: Import and Export

## Navegación

- Código: `TEST-IO-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 4.
- Regresas a: LEARNING-PATH para merge.

## Unit

Header normalization, mapping, required columns, email/SKU validation, duplicate
policy, state transitions, batch resume, filename/storage key, formula
neutralization y expiry. Usa in-memory fake storage y files mínimos.

## Integration

- Job/rows/counts y unique idempotency.
- Preview no crea domain rows.
- Confirm concurrente inicia una sola ejecución.
- Batch failure revierte batch y produce PARTIAL sin duplicar otros.
- Contact/customer y product/SKU siempre same tenant.
- Export obtiene exactamente filters/columns autorizados.
- Storage failure no marca COMPLETED; compensación limpia orphan.
- Seed dos veces conserva checksum/IDs.

## E2E

Upload CSV/XLSX, mapping, preview rows/errors, confirm, poll, cancel, create
export, download y expired file. Casos: oversized, extension/MIME mismatch,
duplicate headers, formula cells, missing header, wrong permission, requester
inactive y cross-tenant job como not found.

SMTP/network/object storage reales no participan. PDF test compara metadata y
contenido esencial del snapshot, no bytes completos frágiles.

## Definition of Done

- [ ] Unit cubre seguridad de file y states.
- [ ] Integration demuestra idempotency, batches y compensación.
- [ ] E2E cubre contrato multipart/download y tenant isolation.
- [ ] Fixtures se eliminan solo del test storage allowlisted.
- [ ] Suites pasan solas y en quality gate.
