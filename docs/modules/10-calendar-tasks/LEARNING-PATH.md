# Ruta de aprendizaje: calendario y tareas

**Código:** `MOD-10`

## Objetivo

Crear trabajo accionable con múltiples asignados, vencimientos, recordatorios y
eventos de calendario. `OVERDUE` se calcula a partir de `due_at`; no se persiste
como estado porque el tiempo puede volverlo verdadero sin ejecutar un update.

## Vienes de

- `../09-activities/LEARNING-PATH.md` integrado.
- Tenant context, RBAC/CASL y auditoría inicial activos.
- Revisa [Definition of Done](../../project/DEFINITION-OF-DONE.md).

## Rama exacta

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/add-calendar-tasks
```

## Recorrido único

1. Ve a `database/task-001-tasks-reminders-schema.md`, sección **Diccionario de datos**; regresa al terminar su migración.
2. Ve a `database/task-002-calendar-events-schema.md`, sección **Diccionario de datos**; regresa tras probar `up/down/up`.
3. Ve a `development/task-001-task-management.md`, sección **Orden de implementación**; regresa al cerrar tareas y asignaciones.
4. Ve a `development/task-002-calendar-management.md`, sección **Orden de implementación**; regresa al cerrar calendario y recordatorios.
5. Ve a `seeds/task-001-calendar-tasks-seed.md`, sección **Dataset**; regresa tras la segunda ejecución idempotente.
6. Ve a `tests/task-001-tasks-tests.md`, sección **Matriz**; regresa cuando pase.
7. Ve a `tests/task-002-calendar-tests.md`, sección **Matriz**; regresa y ejecuta la verificación final.

## Registro de avance

- [ ] Rama `sdd/add-calendar-tasks` creada desde `main` limpio.
- [ ] `DB-TASK-001`: tasks/assignments/reminders migrados y revertidos.
- [ ] `DB-CAL-002`: events/attendees y FK final de reminders verificadas.
- [ ] `DEV-TASK-001`: assignments, estados, overdue derivado y jobs completos.
- [ ] `DEV-CAL-002`: timed/all-day, attendees y calendar permissions completos.
- [ ] `SEED-CAL-001`: segunda ejecución idempotente con mismo resultado.
- [ ] `TEST-TASK-001` y `TEST-CAL-002`: unit/integration/E2E en verde.
- [ ] Diff, dependencias y lockfile revisados; commits creados.
- [ ] Push, Pull Request, merge `--no-ff` y limpieza terminados.

## Commits sugeridos

```powershell
git add src/tasks/entities src/calendar/entities src/database/migrations
git commit -m "feat(database): add tasks calendar and reminders schema"

git add src/tasks src/calendar src/app.module.ts package.json pnpm-lock.yaml
git commit -m "feat(tasks): add assignments reminders and calendar"

git add src/seed
git commit -m "feat(seed): add deterministic calendar tasks dataset"

git add src/tasks src/calendar test
git commit -m "test(tasks): cover assignments reminders and calendar"
```

## Verificación, push e integración

```powershell
git status
git diff --check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
git push -u origin sdd/add-calendar-tasks
gh pr create --base main --head sdd/add-calendar-tasks --title "feat(tasks): add calendar and task management"
```

Después de aprobación:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-calendar-tasks
git push origin main
git branch -d sdd/add-calendar-tasks
git push origin --delete sdd/add-calendar-tasks
```

## Definition of Done

- Una task acepta múltiples assignees activos y conserva historial de asignación.
- Prioridad y estados usan códigos estables; vencida es una condición calculada.
- Reminders pertenecen exactamente a una task o un calendar event.
- Eventos timed y all-day tienen constraints distintos y timezone IANA.
- Consultas por usuario, lista, calendario y vencidas aplican tenant scope.
- Notifications podrá consumir reminders sin acoplamiento circular.
- Seed doble y todas las suites pasan.

## Siguiente destino

Continúa según [mapa de dependencias](../../project/MODULE-DEPENDENCIES.md). El
módulo 19 Notifications consumirá reminders más adelante.
