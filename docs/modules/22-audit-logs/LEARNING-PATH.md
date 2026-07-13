# Ruta de aprendizaje: auditoría y security logs

## Identidad y dos pasadas

| Dato | Parte A | Parte B |
| --- | --- | --- |
| Momento | Después de Security/Organizations | Después de Import/Export, antes de Administration |
| Rama | `sdd/add-audit-foundation` | `sdd/add-audit-query-retention` |
| Resultado | Escritura inmutable y redacción | Consulta, índices, export y retención |
| Hito | Cierra `v0.2.0` | Parte de `v0.9.0` |

Audit se inicia temprano para que Customers, Deals, Quotes, Orders, Inventory y
Tickets no tengan que reconstruirse al final. La Parte B espera a conocer
patrones reales de consulta y a tener Export Jobs disponible.

## Parte A — recorder temprano

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/add-audit-foundation
```

1. Completa
   [`database/task-001-audit-foundation-schema.md`](database/task-001-audit-foundation-schema.md)
   y `CreateAuditAndOutboxFoundation`.
2. Completa
   [`development/task-001-audit-recording.md`](development/task-001-audit-recording.md)
   e integra Security y Organizations.
3. Completa la sección Parte A de
   [`tests/task-001-audit-recording-tests.md`](tests/task-001-audit-recording-tests.md).

```powershell
git add src/audit src/database/migrations
git commit -m "feat(database): add audit and security logs"
git add src/audit src/auth src/access-control src/organizations src/app.module.ts
git commit -m "feat(audit): record security and organization events"
git add src/audit/*.spec.ts test/integration/audit test/e2e/audit
git commit -m "test(audit): cover immutable audit recording"
```

Ejecuta el quality gate y cierra la rama antes del tag:

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
git push -u origin sdd/add-audit-foundation
gh pr create --base main --head sdd/add-audit-foundation --title "feat(audit): add audit foundation"
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-audit-foundation
git push origin main
git branch -d sdd/add-audit-foundation
git push origin --delete sdd/add-audit-foundation
```

Si Platform, Security A/B y Organizations están terminados, crea `v0.2.0` y un
release que explique identity, tenant isolation, RBAC, sessions, audit/outbox
foundation, migraciones y pruebas.

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
git tag -a v0.2.0 -m "v0.2.0 - identity tenant isolation audit and outbox foundation"
git push origin v0.2.0
gh release create v0.2.0 --title "v0.2.0 - Identity and isolation" --generate-notes
```

## Regla para módulos intermedios

Cada `LEARNING-PATH` posterior debe enumerar sus audit actions y escribirlas con
el `EntityManager` de la transacción propietaria. No esperes a Parte B. Un state
history no sustituye audit: uno explica evolución del agregado y el otro actor,
request y old/new values.

## Parte B — consulta y retención

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/add-audit-query-retention
```

1. Completa
   [`database/task-002-audit-query-indexes.md`](database/task-002-audit-query-indexes.md).
2. Completa
   [`development/task-002-audit-query-retention.md`](development/task-002-audit-query-retention.md).
3. Completa [`seeds/task-001-audit-seed.md`](seeds/task-001-audit-seed.md).
4. Completa
   [`tests/task-002-audit-query-retention-tests.md`](tests/task-002-audit-query-retention-tests.md).

```powershell
git add src/database/migrations
git commit -m "feat(database): add audit query indexes"
git add src/audit src/import-export src/platform
git commit -m "feat(audit): add audit queries export and retention"
git add src/seed
git commit -m "feat(seed): add deterministic audit history"
git add src/audit/*.spec.ts test/integration/audit test/e2e/audit
git commit -m "test(audit): cover query access and retention"
```

### Quality gate y cierre de la Parte B

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
git diff --check
git status
git push -u origin sdd/add-audit-query-retention
gh pr create --base main --head sdd/add-audit-query-retention --title "feat(audit): add audit query and retention"
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-audit-query-retention
git push origin main
git branch -d sdd/add-audit-query-retention
git push origin --delete sdd/add-audit-query-retention
```

## Definition of Done

- [ ] `audit_logs` y `security_logs` son append-only fuera de retention.
- [ ] Secrets/tokens/passwords nunca entran a snapshots o metadata.
- [ ] Business audit comparte transacción con el cambio.
- [ ] Authentication failures se registran sin requerir organization.
- [ ] Todas las critical actions de la propuesta tienen code estable.
- [ ] Query requiere header, membership y permission sensible.
- [ ] Entity timeline no depende de FK polimórfica.
- [ ] Retention usa settings del owner Platform; no tabla duplicada.
- [ ] Purge es batch, previewable, auditable y no toca legal/disabled policy.
- [ ] Export delega a Export Jobs y revalida permission.

Parte B se mergea sin tag. Administration verifica el conjunto y cierra
`v0.9.0`.
