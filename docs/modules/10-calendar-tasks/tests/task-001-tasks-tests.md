# Test task 001: tasks y assignments

**Código:** `TEST-TASK-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 6.
**Regresa a:** `../LEARNING-PATH.md`, paso 7.
**No continúes hasta:** pasar unit, integration y E2E de tasks.

## Matriz

### Unit

- Overdue se deriva para pending/in-progress vencida y no para terminal.
- Máquina de estados y control de versión.
- Dedupe de assignees y policy de edición/completion.
- Completar produce cancelación de reminders pendientes.

### Integration

- Unique parcial impide assignment activo duplicado y permite reasignación tras unassign.
- Insert directo con task tenant A y assignee/context tenant B falla por FK compuesta.
- Retry de estado/reminder con key+fingerprint igual no duplica; mismo key con
  fingerprint distinto devuelve conflicto.
- Checks de fechas/status y FKs RESTRICT.
- Crear task+assignments y completar+cancelar reminders son atómicos.
- Consulta tenant/assignee/status/due usa PostgreSQL real migrado.

### E2E

- CRUD, assign, unassign, start, complete, cancel.
- Header ausente, membership inactiva, body con organizationId y tenant cruzado.
- Assignee de otra organización se oculta como `404`.
- Usuario sin `tasks:assign` no asigna aunque creó la task.
- Dos PATCH con la misma version: el segundo recibe `409`.
- Filtro `overdue=true` devuelve condición derivada correcta.
- Completion crea auditoría y no entrega reminders después.
