# Development task 001: registrar audit y security events

## Navegación

- Código: `DEV-AUD-001`.
- Vienes de: `../LEARNING-PATH.md`, Parte A paso 2.
- Regresas a: Parte A paso 3.
- Rama: `sdd/add-audit-foundation`.

## Servicios internos

`AuditWriterService` registra cambios de negocio. `SecurityLogWriterService`
registra authentication/authorization/security. Un `AuditRedactionService`
construye snapshots por allowlist. Ninguno tiene controller en Parte A.

`OutboxPublisherService` recibe `EntityManager`, event type, aggregate,
payload redactado, correlation e idempotency key. Solo inserta `PENDING`; no
ejecuta consumers, email ni reglas en esta etapa.

El input interno define organization, actor, action code, entity reference,
old/new snapshots, request metadata, correlation y `EntityManager` cuando
comparte transacción. No acepta un object completo para serializarlo “tal cual”.

## Transacciones

### Business event

Create/update/archive, state transition, permission assignment, quote approval,
order cancellation, inventory adjustment y ticket close escriben el log con el
mismo `EntityManager`. Si audit requerido falla, el cambio se revierte. El
service owner decide snapshot antes/después; Audit no vuelve a consultar una
entity que podría cambiar.

Cuando el cambio produce un hecho para otros módulos, el mismo `EntityManager`
inserta `outbox_events`. Cambio de negocio, audit y outbox confirman o revierten
juntos. Un Event Emitter posterior puede despertar al worker, pero nunca es la
fuente durable.

### Security event

Login failure debe registrarse aunque no exista user/organization y no debe
convertir credenciales inválidas en error 500. Se escribe en una transacción
corta independiente con subject hash, reason code y request context. Si el
storage de security log falla, el login sigue siendo rechazado y se emite una
alerta operacional sin secret; no se oculta silenciosamente.

Login success, logout, password change, refresh reuse, role/permission changes
y session revocation tienen user/session cuando estén disponibles.

## Redacción

Lista prohibida recursiva: password, passwordHash, access/refresh tokens,
authorization/cookie headers, JWT secret, API keys, SMTP/database credentials y
file contents. Metadata usa allowlist, limita profundidad/tamaño y serializa
fechas/decimals de forma estable.

Para login failure, normaliza el subject y guarda HMAC/SHA-256 con pepper de
environment, nunca email raw. IP usa tipo `inet`; user agent se trunca.

## Action codes iniciales

`LOGIN_SUCCEEDED`, `LOGIN_FAILED`, `LOGOUT`, `REFRESH_TOKEN_REUSED`,
`PASSWORD_CHANGED`, `SESSION_REVOKED`, `ROLE_ASSIGNED`, `ROLE_REMOVED`,
`PERMISSIONS_CHANGED`, `ORGANIZATION_CREATED`, `ORGANIZATION_UPDATED`,
`MEMBER_INVITED`, `MEMBER_STATUS_CHANGED`.

Cada módulo posterior agrega codes en un registry central revisado. No aceptar
action libre enviada por request.

## Organization context

Business audit toma organization de `X-Organization-Id` ya validado y confirma
membership. Security event puede tener organization null antes de selección.
Un actor system/worker usa actorType explícito, no un UUID inventado de user.

## Integración inicial

- Auth: success/failure/logout/refresh reuse/password/session.
- Security/RBAC: role y permission assignments.
- Organizations: create/update/archive y membership lifecycle.

Services reciben Audit/Outbox por dependency injection; no emiten un evento
in-memory como única evidencia. Event Emitter todavía no es durable ni está
instalado en este hito.

## Errores y observabilidad

Audit writer no devuelve snapshots al controller. Error response conserva
correlation ID, pero no dice qué tabla de audit falló. Logs técnicos incluyen
action/error code, nunca snapshot completo.

## Definition of Done

- [ ] No existe endpoint create/update/delete de logs.
- [ ] Business changes y audit son atómicos.
- [ ] Login failures admiten actor/organization null.
- [ ] Redactor usa allowlist/prohibited keys y límites.
- [ ] Codes son registry cerrado.
- [ ] Request context conserva IP, agent y correlation sin secrets.
- [ ] Security/Organizations integran events iniciales.
- [ ] Eventos requeridos se guardan en outbox dentro de la transacción propietaria.
