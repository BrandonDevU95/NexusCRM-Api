# Test task 002: calendario y reminders

**Código:** `TEST-CAL-002`
**Vienes de:** `../LEARNING-PATH.md`, paso 7.
**Regresa a:** `../LEARNING-PATH.md`, verificación final.
**No continúes hasta:** pasar unit, integration y E2E del calendario.

## Matriz

### Unit

- DTO discriminado rechaza mezcla de timestamps y dates.
- Conversión timed conserva instante UTC y timezone; all-day conserva fecha civil.
- Response de attendee solo modifica la asistencia propia.
- Idempotency key de reminder es estable.

### Integration

- Checks timed/all-day, range y cancelación.
- Unique attendee y parent exclusivo de reminder.
- Insert directo de attendee/organizer/event con organizations distintas falla por FK compuesta.
- Cancelación repetida con idempotency key no duplica status history.
- Cancelar evento, reminders y audit event hace commit/rollback conjunto.
- Índices de rango soportan consulta calendar mensual por tenant/usuario.

### E2E

- `calendar:read` permite los dos GET, pero niega todas las mutaciones.
- `calendar:manage` más la policy correspondiente permite crear o modificar;
  tener solo `tasks:read` no concede acceso a eventos.
- Crear, listar por rango, editar y cancelar timed/all-day.
- Attendee responde; otro usuario no suplanta su respuesta.
- Rango excesivo o timezone inválida: `400/422`.
- Evento B con header A: `404`.
- Organizer sin membership activa: rechazo.
- `organizationId` en body: rechazo.
- Cancelación conserva evento, cancela reminder y genera auditoría.

Usa reloj falso para unit tests y fechas absolutas en integration/E2E. No dependas
de la zona horaria del equipo que ejecuta la suite.
