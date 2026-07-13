# Test task 001: lifecycle y asignación de tickets

**Código:** `TEST-TICKET-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 5.
**Regresa a:** `../LEARNING-PATH.md`, paso 6.
**No continúes hasta:** pasar state machine, assignments, tenant y auditoría.

## Matriz

### Unit

- Todas las transiciones permitidas/prohibidas.
- Resolve/close/reopen requieren summary/reason.
- Policy agente propio vs manager.
- Priority critical produce event idempotente.
- Assignment valida member/role activo.

### Integration

- Unique folio/category, checks de status/timestamps y FKs RESTRICT.
- Create+number+history+audit/outbox es atómico.
- Assign current+history+notification es atómico.
- Dos updates con version igual: uno gana, otro conflicto.
- Job/event repetido no duplica status history/notification.
- Igual key+fingerprint en assign/status devuelve resultado previo; misma key con
  fingerprint distinto da `409`.
- Insert directo ticket/history/assignment con organization A y customer/category/
  member B falla por FK compuesta.

### E2E

- Create/list/detail/update priority/category/assign/state actions.
- Filtros status/priority/category/agent/customer/date y paginación.
- Header ausente, membership inactiva, organizationId body, tenant cruzado.
- Contact de otro customer, category/agent de otro tenant: rechazo.
- Agente sin assign/close/reopen: `403`.
- Invalid transition: `409`; duplicate folio protegido.
- Critical y assignment crean notification/audit una vez.
