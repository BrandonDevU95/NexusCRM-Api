# Ruta de aprendizaje: importación y exportación

## Identidad

| Dato | Valor |
| --- | --- |
| Alcance original | Módulo 21: Import and Export |
| Código | `IO` |
| Rama | `sdd/add-import-export-jobs` |
| Hito | Parte de `v0.9.0`; Administration crea el tag |

## Resultado esperado

Podrás previsualizar y confirmar imports CSV/XLSX de customers, contacts, leads
y products, con resultado por fila. Podrás generar exports CSV/XLSX de datos y
reports, y delegar PDF de quotes/orders a sus services propietarios. Los files
no viven como blobs en PostgreSQL.

## Recorrido

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/add-import-export-jobs
```

1. Completa
   [`database/task-001-import-export-schema.md`](database/task-001-import-export-schema.md)
   y la migración.
2. Completa
   [`development/task-001-import-export-jobs.md`](development/task-001-import-export-jobs.md).
3. Completa [`seeds/task-001-import-export-seed.md`](seeds/task-001-import-export-seed.md).
4. Completa [`tests/task-001-import-export-tests.md`](tests/task-001-import-export-tests.md).

```powershell
git add src/import-export src/database/migrations
git commit -m "feat(database): add import and export jobs schema"
git add src/import-export src/app.module.ts package.json pnpm-lock.yaml .env.example .env.test.example
git commit -m "feat(import-export): add preview import and export jobs"
git add src/seed
git commit -m "feat(seed): add deterministic import export jobs"
git add src/import-export/*.spec.ts test/integration/import-export test/e2e/import-export
git commit -m "test(import-export): cover files rows and tenant isolation"
```

## Definition of Done

- [ ] Upload valida tamaño, extensión, MIME/magic, checksum y storage key.
- [ ] Preview no escribe entities de negocio.
- [ ] Confirm es idempotente y procesa rows en batches transaccionales.
- [ ] Cada row conserva error seguro y target ID cuando aplica.
- [ ] Import usa validators/ports de owner modules, no salta reglas.
- [ ] Export revalida permission al crear y descargar.
- [ ] CSV/XLSX neutraliza formula injection.
- [ ] PDF reutiliza snapshots de Quotes/Orders.
- [ ] Files expiran y cleanup está tenant-safe.
- [ ] Seeds y pruebas no dependen de almacenamiento externo real.

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
git push -u origin sdd/add-import-export-jobs
gh pr create --base main --head sdd/add-import-export-jobs --title "feat(import-export): add import and export jobs"
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-import-export-jobs
git push origin main
git branch -d sdd/add-import-export-jobs
git push origin --delete sdd/add-import-export-jobs
```

No crees tag hasta completar Audit Parte B y Administration.
