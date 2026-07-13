# Test task 001: Notifications

## Navegación

- Código: `TEST-NOTIF-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 6.
- Regresas a: LEARNING-PATH para quality gate.

## Unit

Rendering con variables válidas/faltantes/no permitidas, preference mandatory,
quiet-hours calculation, retry backoff, error classification, redaction e
idempotency key. Simula clock y SMTP adapter; no abre DB.

## Integration

- Unique idempotency bajo dos inserciones concurrentes.
- Same tenant constraints de recipient/template.
- Owner transaction revierte notification si falla el cambio de negocio.
- Dos workers con `SKIP LOCKED` no reclaman la misma fila.
- Success/retry/final failure producen attempts y status coherentes.
- Mark read solo modifica notification propia.
- Seed dos veces no duplica ni envía email.

## E2E

Lista/unread/read/read-all, preferences, template permissions, retry automático,
membership inactive, missing `X-Organization-Id`, UUID de otro tenant como not
found y error envelope con correlation. Usa SMTP fake capturable, nunca red
externa.

Prueba que un actor no puede leer notification de otro miembro aunque comparta
organization, salvo un endpoint administrativo con permission distinta. Confirma
que response no contiene `recipient_address`, provider response o error técnico.

## Definition of Done

- [ ] Unit controla tiempo y adapter.
- [ ] Integration usa PostgreSQL real y concurrencia.
- [ ] E2E cubre recipient ownership, permission y tenant.
- [ ] Ningún test envía correo real ni depende del seed global.
- [ ] Suites pasan solas y en quality gate.
