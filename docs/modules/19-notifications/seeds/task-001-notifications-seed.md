# Seed task 001: templates y notificaciones demo

## Navegación

- Código: `SEED-NOTIF-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 5.
- Regresas a: paso 6.

Registra `notifications` después de organizations, memberships y tasks. Reference
data crea por organization templates versionados para assignment, reminder,
quote expiration, low stock y critical ticket, por IN_APP y EMAIL cuando
aplique. Upsert por organization/code/channel/locale/version.

Demo data usa `SEED_NOTIFICATIONS_COUNT`, offset Faker propio, recipients activos
y keys determinísticas. Crea PENDING/SENT/FAILED/unread/read sin ejecutar SMTP;
un seed nunca envía comunicaciones reales. Usa addresses bajo un dominio local
reservado y provider fake en test.

La segunda ejecución conserva IDs y no agrega attempts. Valida variables de
template antes de persistir y rollback ante membership de otro tenant.

## Definition of Done

- [ ] Templates reference son estables y versionados.
- [ ] Demo no llama SMTP.
- [ ] Idempotency keys y recipients son determinísticos.
- [ ] Dos ejecuciones conservan conteos/IDs.
- [ ] Prod rechaza demo.
