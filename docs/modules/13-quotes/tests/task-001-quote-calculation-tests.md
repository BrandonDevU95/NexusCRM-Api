# Test task 001: cálculo de cotización

**Código:** `TEST-QUOTE-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 5.
**Regresa a:** `../LEARNING-PATH.md`, paso 6.
**No continúes hasta:** pasar cálculo unitario, persistencia y contrato HTTP draft.

## Matriz

### Unit

- Quantity × price, percent/fixed discount, taxable base, tax y total.
- Casos de precisión/redondeo y múltiples líneas.
- Descuento excesivo, negativo, rate >100 y currency mismatch.
- Snapshot builder copia valores y `quotes:override-price` exige reason/member.

### Integration

- Unique folio/line, checks de money/status y FKs RESTRICT.
- Crear quote+folio+items+history hace rollback total ante item inválido.
- Cambio de item incrementa draft version y recalcula header; no modifica revisions.
- Mismo SKU/precio en tenant B no contamina resolución de A.
- Insert SQL directo quote/item con organization A y customer/product/member de B
  falla por FK compuesta.

### E2E

- Crear/listar/detalle/editar/add-update-delete item/recalculate.
- Header ausente, membership inactiva, body organizationId y cross-tenant.
- Customer/contact/deal incompatibles o product de B: `404/422`.
- Totales enviados por cliente se rechazan/ignoran según contrato y nunca mandan.
- Override sin permiso: `403`; SKU/product inactivo: conflicto de negocio.
- Override autorizado persiste reason y overridden member en draft y revision.
- Documento no draft rechaza edición `409`.
