# Ruta de aprendizaje: reportes y dashboards

## Identidad

| Dato             | Valor                                      |
| ---------------- | ------------------------------------------ |
| Alcance original | Módulo 20: Reports and Dashboards          |
| Código           | `RPT`                                      |
| Rama             | `sdd/add-reports-dashboards`               |
| Hito             | Parte de `v0.9.0`; no crea tag por sí solo |

## Resultado esperado

El dashboard mostrará métricas comerciales y operativas tenant-safe. Los
reportes usarán definiciones allowlisted, filtros, paginación y límites; no
ejecutarán SQL guardado por un usuario ni bloquearán el flujo principal.

## Recorrido

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/add-reports-dashboards
```

1. Completa
   [`database/task-001-reporting-schema.md`](database/task-001-reporting-schema.md)
   y `CreateReportingConfiguration`.
2. Completa
   [`development/task-001-reporting-queries.md`](development/task-001-reporting-queries.md).
3. Completa [`seeds/task-001-reporting-seed.md`](seeds/task-001-reporting-seed.md).
4. Completa [`tests/task-001-reporting-tests.md`](tests/task-001-reporting-tests.md).

```powershell
git add src/reports src/database/migrations
git commit -m "feat(database): add reporting configuration schema"
git add src/reports src/app.module.ts
git commit -m "feat(reports): add dashboards and bounded reports"
git add src/seed
git commit -m "feat(seed): add report definitions and dashboard widgets"
git add src/reports/*.spec.ts test/integration/reports test/e2e/reports
git commit -m "test(reports): cover metrics filters and tenant isolation"
```

## Definition of Done

- [ ] Todos los reportes de la propuesta tienen definición y owner query.
- [ ] Definition JSON no acepta SQL, table names o expressions arbitrarias.
- [ ] Fechas, dimensions, metrics, sorts, page size y timeout tienen límites.
- [ ] Todas las queries incluyen organization scope desde el primer join.
- [ ] Dashboard no hace una consulta por widget sin batching/caching razonado.
- [ ] Saved reports y widgets respetan personal/organization visibility.
- [ ] Export grande se delega a Export Jobs, no se genera en request síncrono.
- [ ] Unit, Integration, E2E y seed pasan.

## Quality gate y cierre Git

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
git diff --check
git status
git push -u origin sdd/add-reports-dashboards
gh pr create --base main --head sdd/add-reports-dashboards --title "feat(reports): add reports and dashboards"
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-reports-dashboards
git push origin main
git branch -d sdd/add-reports-dashboards
git push origin --delete sdd/add-reports-dashboards
```

No etiquetes todavía; Import/Export, Audit Parte B y Administration completan
`v0.9.0`.
