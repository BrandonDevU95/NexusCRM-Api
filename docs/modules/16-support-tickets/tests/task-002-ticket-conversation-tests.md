# Test task 002: conversación, attachments y timeline

**Código:** `TEST-TICKET-002`
**Vienes de:** `../LEARNING-PATH.md`, paso 6.
**Regresa a:** `../LEARNING-PATH.md`, cierre.
**No continúes hasta:** pasar visibilidad, métricas, compensaciones e integraciones.

## Matriz

### Unit

- Author type exige IDs correctos.
- Public reply vs internal note determina métricas/notificación.
- Customer reply en WAITING_CUSTOMER propone transición única.
- Attachment allowlist/tamaño/checksum y visibility inheritance.
- Timeline mapper redacta internal según permiso.

### Integration

- Checks de author/visibility, unique storage/link y FKs RESTRICT.
- Insert directo comment/attachment con tenant A y ticket/member/contact B falla por FK compuesta.
- Retry reply/note/attachment no duplica; key reutilizada con otro fingerprint da `409`.
- First response se fija una sola vez bajo respuestas concurrentes.
- Customer reply+status history+metrics+outbox commit/rollback conjunto.
- Storage DB failure ejecuta compensación simulada; retry outbox no duplica.
- La frontera que consumirá Knowledge Base confirma ticket por tenant y no expone
  acceso directo a repositories.

### E2E

- Public reply, internal note, customer reply, edit permitido y list comments.
- Usuario sin internal permission no recibe note en SQL/response.
- Register attachment válido; MIME/tamaño/key inválidos no dejan row.
- Los casos link/unlink/article visible se ejecutan en la Pasada B de Knowledge
  Base, después de integrar esta rama.
- Closed ticket rechaza reply hasta reopen.
- Customer timeline muestra created/status/closed sin internal leakage ni duplicado.
- Header/membership/body tenant/cross-tenant en subresources.
- Cada reply relevante genera notification/audit exactamente una vez.

## Regresión postventa

Ejecuta Customers, Contacts, Activities timeline, Knowledge Base, Notifications y
Tickets. Los tests crean factories propias sobre PostgreSQL migrado; no consumen
el seed de desarrollo.
