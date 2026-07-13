# Ruta de aprendizaje: oportunidades

## Propósito

Representar una venta potencial real, conectarla con customer/contact, pipeline, productos y propietario, y registrar cada movimiento hasta ganar o perder.

## Prerrequisitos

- Customers, Contacts y Sales Pipeline terminados.
- Products and Services terminado antes de implementar `deal_products`.
- Leads parte A disponible; la asociación de conversión se completa después de Deals.

## Registro de avance

| Checkpoint                                  | Estado | Evidencia / commit | Fecha |
| ------------------------------------------- | ------ | ------------------ | ----- |
| DB-DEAL-001 schema y `up/down/up`           | [ ]    | —                  | —     |
| DEV-DEAL-001 lifecycle, productos y cierres | [ ]    | —                  | —     |
| SEED-DEAL-001 ejecutado dos veces           | [ ]    | —                  | —     |
| TEST-DEAL-001 unit/integration/E2E          | [ ]    | —                  | —     |
| PR revisado, merge y limpieza               | [ ]    | —                  | —     |

Marca `[x]` únicamente con evidencia reproducible.

## Rama exacta

    git switch main
    git pull --ff-only origin main
    git switch -c sdd/deals

## Recorrido

1. Ve a `database/task-001-deals-schema.md`, sección **deals**. Diseña schema y prueba migración.
2. Ve a `development/task-001-deal-lifecycle.md`, sección **Cambio de etapa**. Implementa lifecycle y products.
3. Ve a `seeds/task-001-deals-seed.md`, sección **Coherencia temporal y comercial**.
4. Ve a `tests/task-001-deals-tests.md`, sección **State machine e integración**.
5. Ejecuta regresión de Customers, Contacts, Pipeline y Products.
6. Al integrar, vuelve a Leads parte B para implementar `lead_conversions`.

## Commits sugeridos

Reemplaza `<timestamp>` por el archivo real mostrado por `git status`.

    git add src/deals/entities/deal-loss-reason.entity.ts src/deals/entities/deal.entity.ts src/deals/entities/deal-stage-history.entity.ts src/deals/entities/deal-product.entity.ts src/deals/deals.module.ts src/database/migrations/<timestamp>-CreateDealAggregate.ts src/app.module.ts
    git commit -m "feat(deals): add opportunity aggregate and histories"
    git add src/deals/dto src/deals/policies src/deals/events src/deals/deals.controller.ts src/deals/deals.service.ts src/deals/deals.repository.ts
    git commit -m "feat(deals): implement stage and close lifecycle"
    git add src/seed/seed.registry.ts src/seed/seeders/deals.seeder.ts
    git commit -m "feat(seed): add deterministic deal dataset"
    git add ":(glob)src/deals/**/*.spec.ts" src/seed/seeders/deals.seeder.spec.ts test/integration/deals test/e2e/deals
    git commit -m "test(deals): cover state transitions and tenant integrity"

## Publicación e integración

    git push -u origin sdd/deals
    git switch main
    git pull --ff-only origin main
    git merge --no-ff sdd/deals
    git push origin main
    git branch -d sdd/deals
    git push origin --delete sdd/deals

## Definición de terminado

- Deal enlaza customer, contacto opcional, pipeline/stage y owner del mismo tenant.
- Mover etapa registra history atómico.
- WON/LOST sincroniza status, etapa, razón y timestamps.
- Products conservan estimación/snapshot y no dependen del precio mutable.
- `amount_source` deja explícito si amount es MANUAL o se deriva de PRODUCTS.
- Customer, contact, owner, pipeline, stage, loss reason y product usan FKs compuestas tenant-safe.
- Filtros, forecast básico, permisos, auditoría, seeds y pruebas pasan.

No crees tag: Deals forma parte de `v0.4.0`, pero Notifications cerrará ese hito después de Activities y Calendar/Tasks.
