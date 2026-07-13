# Test task 001: productos y servicios

**Código:** `TEST-PROD-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 4.
**Regresa a:** `../LEARNING-PATH.md`, cierre.
**No continúes hasta:** pasar unit, integration y E2E con PostgreSQL migrado.

## Matriz mínima

### Unit

- Normalización SKU y validación money/currency.
- Anti-cycle de categories.
- Service nunca tracks inventory.
- Proyección oculta cost sin permiso.
- Cambio de precio construye periodo anterior/nuevo sin solapamiento.

### Integration

- SKU/code unique por tenant permite el mismo valor en otro tenant.
- Check service/inventory y money no negativo.
- Unique parcial de precio vigente.
- FKs `RESTRICT` bloquean borrado de unit/category/product usados.
- Insert SQL directo con product organization A y category/unit/member de B falla
  por FK compuesta.
- Cambio de snapshot+historial+audit hace commit o rollback conjunto.
- Cambio de precio repetido con key/fingerprint no abre dos periodos.
- Retry de status con key+fingerprint igual no duplica history; fingerprint distinto `409`.

### E2E

- CRUD, filtros, archive y price history.
- Header ausente, membership inactiva, `organizationId` en body y tenant cruzado.
- Category/unit/tax de otra organización responde `404`.
- Falta `products:read-cost`: respuesta no expone cost.
- SKU duplicado: `409`; service con inventory: `422`.
- Dos cambios con misma version: uno gana y otro `409`.
- Cambio de precio crea auditoría redactada según policy.
