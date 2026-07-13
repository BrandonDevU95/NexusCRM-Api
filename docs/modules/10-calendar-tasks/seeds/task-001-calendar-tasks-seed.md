# Seed task 001: tareas y calendario

**Código:** `SEED-CAL-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 5.
**Regresa a:** `../LEARNING-PATH.md`, paso 6.
**No continúes hasta:** dos ejecuciones con los mismos conteos y claves.

## Dataset

Por organización demo crea con Faker seeded y fechas relativas a una fecha base
fija, no al reloj del sistema:

- Task pendiente futura con dos assignees y reminder.
- Task en progreso ligada a deal/activity.
- Task completada con assignment histórico.
- Task vencida derivada: status `PENDING`, `due_at` anterior; nunca status OVERDUE.
- Evento timed con organizer, dos attendees y reminder.
- Evento all-day con fechas civiles.
- Evento cancelado cuyos reminders están cancelados.

## Idempotencia y orden

1. Resuelve organization, members y parents CRM por claves demo.
2. Upsert tasks por code determinista del fixture.
3. Upsert assignments activos/históricos.
4. Upsert events y attendees.
5. Upsert reminders por `idempotency_key` estable.

Si no existe columna pública `code`, el registry del seed conserva IDs UUIDv5
derivados del namespace demo; no busques por título Faker. El runner comparte una
sola transacción/`EntityManager`; no abras nested transactions ni uses repositories
globales. Mantén advisory lock y bloqueo en producción.

## Verificación

Valida que assignees/attendees sean miembros activos, que all-day no tenga
timestamps, que timed no tenga dates y que la segunda ejecución no reactive una
asignación retirada.
