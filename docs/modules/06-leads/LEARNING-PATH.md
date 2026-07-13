# Ruta de aprendizaje: leads

## Propósito

Separar el prospecto aún no formal del customer y enseñar una conversión transaccional. El módulo tiene parte A de captura/calificación y parte B de conversión.

## Prerrequisitos

- Parte A: Organizaciones, Seguridad, Pipeline comercial y Auditoría.
- Parte B: además Customers, Contacts y Deals completos.

## Registro de avance: Parte A

| Checkpoint                                   | Estado | Evidencia / commit | Fecha |
| -------------------------------------------- | ------ | ------------------ | ----- |
| DB-LEAD-001 schema y `up/down/up`            | [ ]    | —                  | —     |
| DEV-LEAD-001 lifecycle, permisos y auditoría | [ ]    | —                  | —     |
| SEED-LEAD-001-A ejecutado dos veces          | [ ]    | —                  | —     |
| TEST-LEAD-001 unit/integration/E2E           | [ ]    | —                  | —     |
| Merge Parte A y release `v0.3.0`             | [ ]    | —                  | —     |

## Registro de avance: Parte B

| Checkpoint                                    | Estado | Evidencia / commit | Fecha |
| --------------------------------------------- | ------ | ------------------ | ----- |
| DB-LEAD-002 schema y `up/down/up`             | [ ]    | —                  | —     |
| DEV-LEAD-002 conversión atómica e idempotente | [ ]    | —                  | —     |
| SEED-LEAD-001-B ejecutado dos veces           | [ ]    | —                  | —     |
| TEST-LEAD-002 integración y E2E               | [ ]    | —                  | —     |
| PR revisado, merge y limpieza Parte B         | [ ]    | —                  | —     |

Marca `[x]` solo después de registrar evidencia verificable. Los dos registros son
independientes porque entre las partes se desarrolla Deals.

## Parte A: rama exacta

    git switch main
    git pull --ff-only origin main
    git switch -c sdd/leads

## Recorrido parte A

1. Ve a `database/task-001-leads-schema.md`, sección **leads**.
2. Ve a `development/task-001-lead-lifecycle.md`, sección **State machine**.
3. Ve a `seeds/task-001-leads-seed.md`, sección **Parte A**.
4. Ve a `tests/task-001-lead-lifecycle-tests.md`, sección **Casos E2E**.
5. Integra cuando migración, permisos y suites pasen.

Reemplaza `<timestamp>` por el único archivo real mostrado por `git status`; no
uses `git add .` en ninguna de las dos partes.

    git add src/leads/entities/lead-source.entity.ts src/leads/entities/lead.entity.ts src/leads/entities/lead-status-history.entity.ts src/leads/entities/lead-score.entity.ts src/leads/leads.module.ts src/database/migrations/<timestamp>-CreateLeadLifecycle.ts src/app.module.ts
    git commit -m "feat(leads): add lead qualification schema"
    git add src/leads/dto src/leads/policies src/leads/events src/leads/leads.controller.ts src/leads/leads.service.ts src/leads/leads.repository.ts
    git commit -m "feat(leads): add lead qualification lifecycle"
    git add src/seed/seed.registry.ts src/seed/seeders/leads.seeder.ts
    git commit -m "feat(seed): add deterministic lead lifecycle dataset"
    git add ":(glob)src/leads/**/*.spec.ts" src/seed/seeders/leads.seeder.spec.ts test/integration/leads test/e2e/leads
    git commit -m "test(leads): cover assignment scoring and transitions"
    git push -u origin sdd/leads
    git switch main
    git pull --ff-only origin main
    git merge --no-ff sdd/leads
    git push origin main
    git branch -d sdd/leads
    git push origin --delete sdd/leads

## Cierre del hito v0.3.0

La parte A cierra el hito CRM core porque START-HERE ya hizo obligatorios Customers, Contacts, Products, Price Lists y Pipelines antes de llegar a Leads. Desde `main`, usa una base desechable y ejecuta todas las verificaciones antes del tag:

    git switch main
    git pull --ff-only origin main
    pnpm install --frozen-lockfile
    docker compose --env-file .env.test --profile test up -d database_test
    pnpm test:migrations
    pnpm seed:run -- --env-file .env.test --module all --data-kind demo
    pnpm seed:run -- --env-file .env.test --module all --data-kind demo
    pnpm format:check
    pnpm lint
    pnpm typecheck
    pnpm test
    pnpm test:integration
    pnpm test:e2e
    pnpm build
    git diff --check
    git status --short --branch

`test:migrations` debe ejecutar el historial completo, revertir la última
migración y aplicarla otra vez sobre `database_test`; nunca apuntes este gate a
la base de desarrollo o producción. Confirma además que Swagger esté
actualizado, que no haya duplicados tras el segundo seed, que el working tree
esté limpio y que aislamiento, permisos y auditoría funcionen en todo el hito.
Solo entonces publica el tag y release exactos:

    git tag -a v0.3.0 -m "v0.3.0 - CRM core and required catalogs"
    git push origin v0.3.0
    gh release create v0.3.0 --title "v0.3.0 - CRM core and required catalogs" --generate-notes

Completa ahora
[`../08-deals/LEARNING-PATH.md`](../08-deals/LEARNING-PATH.md), integra su rama y
regresa a este archivo en **Parte B**. No avances todavía a Activities.

## Parte B: rama exacta

    git switch main
    git pull --ff-only origin main
    git switch -c sdd/lead-conversion

## Recorrido parte B

1. Ve a `database/task-002-lead-conversion-schema.md`, sección **lead_conversions**.
2. Ve a `development/task-002-lead-conversion.md`, sección **Transacción completa**.
3. Regresa a `seeds/task-001-leads-seed.md`, sección **Parte B**.
4. Ve a `tests/task-002-lead-conversion-tests.md`, sección **Rollback e idempotencia**.
5. Ejecuta suites de Customers, Contacts, Pipelines y Deals.

   git add src/leads/entities/lead-conversion.entity.ts src/database/migrations/<timestamp>-CreateLeadConversions.ts
   git commit -m "feat(leads): add lead conversion persistence"
   git add src/leads/dto/convert-lead.dto.ts src/leads/events/lead-converted.event.ts src/leads/lead-conversion.service.ts src/leads/leads.controller.ts
   git commit -m "feat(leads): convert qualified leads atomically"
   git add src/seed/seed.registry.ts src/seed/seeders/leads.seeder.ts
   git commit -m "feat(seed): add deterministic lead conversions"
   git add ":(glob)src/leads/**/*.spec.ts" src/seed/seeders/leads.seeder.spec.ts test/integration/leads test/e2e/leads
   git commit -m "test(leads): cover conversion rollback and idempotency"
   git push -u origin sdd/lead-conversion
   git switch main
   git pull --ff-only origin main
   git merge --no-ff sdd/lead-conversion
   git push origin main
   git branch -d sdd/lead-conversion
   git push origin --delete sdd/lead-conversion

## Definición de terminado

- Lead tiene fuente, owner, score e historial coherentes.
- Transiciones inválidas se rechazan.
- Conversión crea customer y opcionalmente contact/deal en una sola transacción.
- Un lead no puede convertirse dos veces.
- Conversión solo reutiliza customer mediante `existingCustomerId` explícito y registra key/fingerprint idempotentes, IDs resultantes, actor, auditoría y evento.
- Lead→conversion es 1:1; customer→conversions es 1:N; todas las FKs son tenant-safe.
- Seeds y pruebas de ambas partes pasan.

No crees otro tag al terminar la parte B: esta integración continúa el siguiente hito y Notifications publicará `v0.4.0` después de Deals, Activities y Calendar/Tasks.
