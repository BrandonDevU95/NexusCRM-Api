# Ruta de aprendizaje: pipeline comercial

## Propósito

Construir la configuración ordenada que determina por qué etapas avanzan las oportunidades. Este módulo configura el tablero; Deals registrará los movimientos de cada oportunidad.

## Prerrequisitos

- Plataforma, Organizaciones, Seguridad B y Auditoría.
- Comprender transacciones y constraints únicos.

## Registro de avance

| Checkpoint                           | Estado | Evidencia / commit | Fecha |
| ------------------------------------ | ------ | ------------------ | ----- |
| DB-PIPE-001 schema y `up/down/up`    | [ ]    | —                  | —     |
| DEV-PIPE-001 configuración y reorder | [ ]    | —                  | —     |
| SEED-PIPE-001 ejecutado dos veces    | [ ]    | —                  | —     |
| TEST-PIPE-001 unit/integration/E2E   | [ ]    | —                  | —     |
| PR revisado, merge y limpieza        | [ ]    | —                  | —     |

Marca `[x]` únicamente con evidencia reproducible.

## Rama exacta

    git switch main
    git pull --ff-only origin main
    git switch -c sdd/sales-pipeline

## Recorrido

1. Ve a `database/task-001-pipeline-schema.md`, sección **pipelines**. Diseña tablas, constraints e índices, ejecuta/revierte/aplica la migración y regresa.
2. Ve a `development/task-001-pipeline-configuration.md`, sección **Reordenamiento transaccional**. Implementa los casos de uso y regresa.
3. Ve a `seeds/task-001-pipeline-seed.md`, sección **Dataset**. Ejecuta dos veces y regresa.
4. Ve a `tests/task-001-pipeline-tests.md`, sección **Integración y concurrencia**. Completa todas las capas.
5. Revisa que configuración history no se confunda con `deal_stage_history`.

## Commits sugeridos

Reemplaza `<timestamp>` por el archivo real mostrado por `git status`.

    git add src/pipelines/entities/pipeline.entity.ts src/pipelines/entities/pipeline-stage.entity.ts src/pipelines/entities/pipeline-stage-history.entity.ts src/pipelines/pipelines.module.ts src/database/migrations/<timestamp>-CreateSalesPipelines.ts src/app.module.ts
    git commit -m "feat(pipelines): add pipeline and stage configuration"
    git add src/pipelines/dto src/pipelines/policies src/pipelines/events src/pipelines/pipelines.controller.ts src/pipelines/pipelines.service.ts src/pipelines/pipelines.repository.ts
    git commit -m "feat(pipelines): implement transactional stage ordering"
    git add src/seed/seed.registry.ts src/seed/seeders/sales-pipeline.seeder.ts
    git commit -m "feat(seed): add deterministic sales pipeline"
    git add ":(glob)src/pipelines/**/*.spec.ts" src/seed/seeders/sales-pipeline.seeder.spec.ts test/integration/pipelines test/e2e/pipelines
    git commit -m "test(pipelines): cover terminal stages and concurrency"

## Publicación e integración

    git push -u origin sdd/sales-pipeline
    git switch main
    git pull --ff-only origin main
    git merge --no-ff sdd/sales-pipeline
    git push origin main
    git branch -d sdd/sales-pipeline
    git push origin --delete sdd/sales-pipeline

## Definición de terminado

- Cada pipeline pertenece a una organización y tiene etapas ordenadas sin posiciones duplicadas.
- Existe una etapa inicial y reglas coherentes para OPEN, WON y LOST.
- Reordenar es atómico y auditable.
- Pipelines, stages e histories usan FKs compuestas tenant-safe y se prueban con inserts directos inválidos.
- Pipelines o etapas utilizadas se archivan; no se borran.
- Seeds idempotentes y suites pasan en dos tenants.

No crees tag: Pipelines forma parte de `v0.3.0` y Leads cerrará ese hito cuando
Customers, Contacts, Products y Price Lists también estén integrados.
