# Test task 002: workflow y documentos de quote

**Código:** `TEST-QUOTE-002`
**Vienes de:** `../LEARNING-PATH.md`, paso 6.
**Regresa a:** `../LEARNING-PATH.md`, cierre.
**No continúes hasta:** pasar estados, approvals, PDF, auditoría e idempotencia.

## Matriz

### Unit

- Todas las transiciones válidas/invalidas.
- Regla de approvals materializa secuencia y quoteRevisionId.
- Expiración usa fecha civil/timezone documentada.
- Nombre/checksum/revision del PDF.
- Freeze copia party/legal/contact/addresses/totals y las revisiones no mutan.

### Integration

- Approval concurrente produce una decisión.
- State+history+audit se confirman/revierten juntos.
- Unique current PDF y cleanup compensatorio simulado.
- Retry de PDF con key/fingerprint igual devuelve document previo; hash distinto `409`.
- Job expire repetido no duplica history/event.
- Igual idempotency key+fingerprint devuelve el mismo estado; fingerprint distinto
  da `409` sin nuevo history.
- Direct insert approval/document/revision item cross-tenant falla por FK compuesta.

### E2E

- Submit, approve/reject, send, accept, cancel y generate/list PDF.
- Empty draft no submit; no approver no decide; invalid transition `409`.
- PDF referencia la revision solicitada; un PDF de revision anterior permanece
  histórico y no se reasigna a la revision aceptada.
- Acceptance exige `quotes:accept` y fija accepted revision; Order podrá copiarla.
- Usuario sin `quotes:approve/send` recibe `403`.
- Tenant cruzado devuelve `404`.
- No existe endpoint que marque CONVERTED sin Order.
- Cada acción crítica crea history y audit una sola vez.
