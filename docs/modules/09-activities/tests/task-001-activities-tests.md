# Test task 001: actividades y timeline

**Código:** `TEST-ACT-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 7.
**Regresa a:** `../LEARNING-PATH.md`, paso 8.
**No continúes hasta:** pasar unit, integration y E2E sin depender del seed global.

## Matriz mínima

### Unitarias

- Validador de relaciones acepta customer+contact+deal coherentes y rechaza cruces.
- Máquina de estados permite únicamente las transiciones documentadas.
- Completar exige outcome cuando el tipo lo requiere.
- Builder del timeline ordena por fecha e ID y no duplica hechos.
- Policy limita actualización terminal y comentario ajeno.

### Integración con PostgreSQL migrado

- Checks de parent, rango de fechas, duración y estado/timestamp rechazan filas inválidas.
- FKs y `onDelete: RESTRICT` conservan historial.
- Un insert SQL directo con `organization_id` A y activity/member/customer de B
  falla por FK compuesta, no solamente por validación del service.
- Repetir una transición con igual key/fingerprint no duplica history; reutilizar
  key con fingerprint distinto devuelve conflicto.
- Comment/attachment retry no duplica filas; cambiar body/metadata con la misma key da `409`.
- Índices soportan filtro tenant+recurso; inspecciona el plan de una consulta representativa.
- Completar activity y registrar audit event hace commit conjunto o rollback conjunto.
- Fallo al guardar attachment revierte metadatos relacionados.

### E2E

- Crear, listar, consultar, iniciar, completar y cancelar con status HTTP correcto.
- Falta `X-Organization-Id`: rechazo; membership inactiva: `403`.
- ID de tenant B con header A: `404`, no filtración.
- `organizationId` en body es rechazado.
- Contact de otro customer o deal de otro tenant produce `422/404` consistente.
- Usuario sin `activities:complete` no completa aunque sea owner.
- Timeline paginado mezcla activities e historial disponible sin repetición.
- Attachment inválido no deja metadatos huérfanos.
- Acción crítica crea auditoría con actor, tenant y correlation ID.

## Factories y limpieza

Crea organizations, memberships y recursos mínimos por test. Usa fechas fijas y
base aislada aplicada por migraciones. Limpia mediante transacción/estrategia de
test; no llames al seeder de desarrollo.
