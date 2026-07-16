# Registro de avance de NexusCRM API

Este es el único registro manual de avance. Actualízalo en la misma rama de la
tarea; no marques un módulo completo si todavía falta database, development,
seed, tests, merge o tag.

## Último checkpoint

```text
Fecha: 2026-07-15
Rama: main
Módulo/pasada: 00 — Foundation
Checkpoint terminado: Foundation integrada y publicada como v0.1.0
Siguiente archivo y sección: modules/01-platform-configuration/LEARNING-PATH.md — Prerrequisitos y PLAT-001
Último merge: PR #4 — 6b8d6d2
Bloqueo o nota: Ninguno; Platform comienza desde main actualizado.
```

Al retomar, primero ejecuta `git status --short --branch` y confirma que coincide
con este bloque. Si no coincide, no cambies de rama hasta entender dónde quedó el
trabajo.

## Ruta completa

- [x] 00 — Foundation — `v0.1.0`
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

- [x] Rama `sdd/add-api-foundation` creada desde `main` actualizado.
- [x] FND-001: scaffold NestJS seguro.
- [x] FND-002: entorno validado con Joi y Compose.
- [x] FND-003/FND-004: DataSource compartido y migración `run → revert → run`.
- [x] FND-005: contrato HTTP versionado, observable y documentado.
- [x] FND-006: SeedModule CLI modular y seguro.
- [x] FND-007: unit, integration, migrations y E2E.
- [x] Commits con staging específico y Conventional Commits.
- [x] Quality gate completo, incluido PostgreSQL test desechable y build.
- [x] Push y Pull Request #4.
- [x] Merge y limpieza de `sdd/add-api-foundation`.
- [x] Tag y release `v0.1.0` por cierre de hito.
