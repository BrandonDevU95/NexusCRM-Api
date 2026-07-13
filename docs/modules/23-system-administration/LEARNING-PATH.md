# Ruta de aprendizaje: administración del sistema

## Identidad

| Dato             | Valor                            |
| ---------------- | -------------------------------- |
| Alcance original | Módulo 23: System Administration |
| Código           | `ADMIN`                          |
| Rama             | `sdd/add-system-administration`  |
| Hito             | Cierra `v0.9.0`                  |

## Decisión principal

Administration no es dueño de users, roles, permissions, catalogs, pipelines,
price lists, taxes, templates o audit logs. No crea `admin_settings`,
`admin_users` ni otra copia. Ofrece un overview, access review y bootstrap
multi-owner; las mutaciones ordinarias permanecen en los endpoints propietarios.

## Recorrido

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/add-system-administration
```

1. Completa
   [`database/task-001-no-administration-schema.md`](database/task-001-no-administration-schema.md)
   y demuestra por qué no hay migración.
2. Completa
   [`development/task-001-administration-orchestration.md`](development/task-001-administration-orchestration.md).
3. Completa
   [`seeds/task-001-administration-seed-verification.md`](seeds/task-001-administration-seed-verification.md).
4. Completa
   [`tests/task-001-administration-tests.md`](tests/task-001-administration-tests.md).

```powershell
git add src/system-administration src/app.module.ts
git commit -m "feat(admin): add system administration orchestration"
git add src/seed
git commit -m "test(seed): verify administration dependencies"
git add src/system-administration/*.spec.ts test/integration/system-administration test/e2e/system-administration
git commit -m "test(admin): cover owner orchestration and access"
```

No hagas un commit `feat(database)` ni una migración vacía.

## Definition of Done

- [ ] No existe entity/repository/table de Administration.
- [ ] `system-admin:access` solo abre el área; cada operación exige owner
      permission.
- [ ] `X-Organization-Id` y membership activa nunca se omiten.
- [ ] Overview y access review llaman read services propietarios.
- [ ] Bootstrap es idempotente, transaccional y no sobrescribe personalización.
- [ ] CRUD ordinario usa rutas de Users, Access Control, Platform, Pipelines,
      Price Lists, Notifications y Audit.
- [ ] Audit registra bootstrap y cambios en su owner.
- [ ] Seed no crea admin rows ni wildcard permission.
- [ ] Unit, Integration, E2E, migration-from-empty y build pasan.

## Cierre `v0.9.0`

Ejecuta migraciones desde base vacía, seed maestro dos veces y el cierre exacto:

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
git push -u origin sdd/add-system-administration
gh pr create --base main --head sdd/add-system-administration --title "feat(admin): add system administration orchestration"
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-system-administration
git push origin main
git branch -d sdd/add-system-administration
git push origin --delete sdd/add-system-administration
```

Luego:

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
git tag -a v0.9.0 -m "v0.9.0 - reporting import export audit and administration"
git push origin v0.9.0
gh release create v0.9.0 --title "v0.9.0 - Visibility and administration" --generate-notes
```

El release incluye Reports, Import/Export, Audit Parte B, Administration,
migraciones, files, retention, seeds, pruebas, permissions y limitaciones. No
crees `v1.0.0`: todavía falta hardening y aceptación end-to-end del roadmap.

## Siguiente paso

Regresa a `docs/START-HERE.md` para el hito de hardening `v1.0.0`.
