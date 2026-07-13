# Ruta de aprendizaje: automatizaciones

## Identidad

| Dato | Valor |
| --- | --- |
| Alcance original | Módulo 18: Automations |
| Código | `AUTO` |
| Rama | `sdd/add-automations` |
| Hito | Cierra Notifications + Automations como `v0.8.0` |

## Resultado esperado

El CRM reaccionará a eventos durables con reglas, triggers, condiciones,
acciones e historial. El motor usará services propietarios para asignar users,
crear tasks, cambiar states, registrar activities/audit y solicitar
notifications; nunca escribirá tablas ajenas de forma dinámica.

## Prerrequisitos

Notifications, Tasks, Deals, Quotes, Orders, Inventory y Tickets deben exponer
services y reglas estables. Audit Parte A debe estar activo.

## Recorrido

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/add-automations
```

1. Completa
   [`database/task-001-automations-schema.md`](database/task-001-automations-schema.md)
   y la migración `CreateAutomationsSchema`; confirma que `outbox_events` ya
   existe desde Audit A.
2. Confirma entity + migración.
3. Completa
   [`development/task-001-automation-engine.md`](development/task-001-automation-engine.md),
   incluyendo producers, worker y acciones allowlisted.
4. Completa [`seeds/task-001-automations-seed.md`](seeds/task-001-automations-seed.md).
5. Completa [`tests/task-001-automations-tests.md`](tests/task-001-automations-tests.md).

```powershell
git add src/automations src/database/migrations
git commit -m "feat(database): add automations schema"
git add src/automations src/leads src/deals src/quotes src/orders src/inventory src/tickets src/app.module.ts
git commit -m "feat(automations): add durable rule engine"
git add src/seed
git commit -m "feat(seed): add deterministic automation rules"
git add src/automations/*.spec.ts test/integration/automations test/e2e/automations
git commit -m "test(automations): cover rules idempotency and recursion"
```

## Definition of Done

- [ ] Todo event se escribe en outbox dentro de la transacción propietaria.
- [ ] Rules/conditions/actions aceptan catálogos cerrados, no código arbitrario.
- [ ] Worker concurrente usa locks, unique keys y retries.
- [ ] Una rule/event produce máximo un run lógico.
- [ ] Actions llaman owner services con idempotency y organization context.
- [ ] Recursion depth y causation detienen loops.
- [ ] Runs conservan input y resultados redactados.
- [ ] Notifications se solicitan, no se envían directamente.
- [ ] Seed, unit, integration y E2E pasan.

## Cierre `v0.8.0`

Ejecuta el cierre exacto:

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
git diff --check
git status
git push -u origin sdd/add-automations
gh pr create --base main --head sdd/add-automations --title "feat(automations): add durable automation engine"
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-automations
git push origin main
git branch -d sdd/add-automations
git push origin --delete sdd/add-automations
```

Después, desde `main` actualizado y limpio:

```powershell
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
git tag -a v0.8.0 -m "v0.8.0 - notifications and automations"
git push origin v0.8.0
gh release create v0.8.0 --title "v0.8.0 - Notifications and automations" --generate-notes
```

El release explica outbox, worker, retries, idempotency, recursion guard,
channels de Notifications, migraciones, seeds, pruebas y limitación de que no
se ejecuta código definido por usuarios.

## Siguiente paso

Regresa a `docs/START-HERE.md` para Reports and Dashboards.
