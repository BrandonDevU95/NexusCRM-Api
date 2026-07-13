# Test task 001: inventario A

**Código:** `TEST-INV-A-001`
**Vienes de:** `../LEARNING-PATH.md`, Recorrido A paso 4.
**Regresa a:** `../LEARNING-PATH.md`, integración A.
**No continúes hasta:** pasar concurrencia, ledger, transfer y aislamiento.

## Matriz A

### Unit

- Derivación de deltas por movement type.
- Available, low/out-of-stock y transición de alert.
- Location type: solo ACTIVE SELLABLE aporta available; damaged/quarantine nunca.
- Lock ordering determinista de transfer.
- Rechazo service/no tracked/quantity inválida.

### Integration

- Unique warehouse/location/stock/idempotency/alert y checks.
- Movement+projection+alert+audit commit/rollback conjunto.
- Dos issues concurrentes sobre el último stock: máximo uno procede.
- Transfer fallida revierte out/in y ambos balances.
- Transfer parent tiene exactamente OUT/IN por transfer_id; no existe paired self FK.
- Suma ledger coincide con projection; FKs RESTRICT.
- Insert directo stock/movement/transfer con organization A y parent/member B falla por FK compuesta.

### E2E

- Warehouse/location CRUD, stock/movement filters, receipt/issue/adjust/transfer.
- Header ausente, member inactivo, organizationId body y tenant cruzado.
- Product no tracked/otro tenant, warehouse-location incoherente.
- Usuario read no ajusta; adjust no transfiere sin permiso.
- Repetir key+fingerprint no cambia balance; misma key con otro fingerprint da `409`.
- No existe endpoint de update directo a quantity.
- Alert abre/ack/resuelve y audita acción crítica.

Usa PostgreSQL real migrado y factories; no depende del seed A.
