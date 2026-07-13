# Registro de avance de NexusCRM API

Este es el único registro manual de avance. Actualízalo en la misma rama de la
tarea; no marques un módulo completo si todavía falta database, development,
seed, tests, merge o tag.

## Último checkpoint

```text
Fecha:
Rama:
Módulo/pasada:
Checkpoint terminado:
Siguiente archivo y sección:
Último commit:
Bloqueo o nota:
```

Al retomar, primero ejecuta `git status --short --branch` y confirma que coincide
con este bloque. Si no coincide, no cambies de rama hasta entender dónde quedó el
trabajo.

## Ruta completa

- [ ] 00 — Foundation — `v0.1.0`
- [ ] 01 — Platform and configuration
- [ ] 02A — Security: identity and sessions
- [ ] 03 — Organizations
- [ ] 02B — Security: RBAC and CASL
- [ ] 22A — Audit foundation — `v0.2.0`
- [ ] 04 — Customers
- [ ] 05 — Contacts
- [ ] 11 — Products and services
- [ ] 12 — Price lists
- [ ] 07 — Sales pipeline
- [ ] 06A — Leads lifecycle — `v0.3.0`
- [ ] 08 — Deals
- [ ] 06B — Lead conversion
- [ ] 09 — Activities
- [ ] 10 — Calendar and tasks
- [ ] 19 — Notifications — `v0.4.0`
- [ ] 13 — Quotes
- [ ] 15A — Inventory foundation
- [ ] 14 — Orders and sales — `v0.5.0`
- [ ] 15B — Inventory/order operations — `v0.6.0`
- [ ] 17A — Knowledge Base core
- [ ] 16 — Support Tickets
- [ ] 17B — Ticket/article links — `v0.7.0`
- [ ] 18 — Automations — `v0.8.0`
- [ ] 20 — Reports and dashboards
- [ ] 21 — Import and export
- [ ] 22B — Audit query and retention
- [ ] 23 — System administration — `v0.9.0`
- [ ] Release acceptance — `v1.0.0`

## Checkpoint actual de la tarea

Copia aquí los checkpoints del `LEARNING-PATH.md` activo y marca solo los que
realmente terminaste:

- [ ] Rama creada desde `main` actualizado.
- [ ] Database: entity, migración, inspección y `run → revert → run`.
- [ ] Commit de database con staging específico.
- [ ] Development: caso de uso, HTTP, tenant, permisos y auditoría.
- [ ] Commit de development con staging específico.
- [ ] Seed: ejecución inicial, segunda ejecución y rollback deliberado.
- [ ] Commit de seed con staging específico.
- [ ] Tests: unit, integration y E2E indicados.
- [ ] Commit de tests/documentación.
- [ ] Quality gate completo.
- [ ] Push y Pull Request.
- [ ] Merge y limpieza de rama.
- [ ] Tag/release, únicamente si cierra hito.
