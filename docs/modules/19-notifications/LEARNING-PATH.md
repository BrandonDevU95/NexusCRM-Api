# Ruta de aprendizaje: notificaciones

## Identidad y orden real

| Dato | Valor |
| --- | --- |
| Alcance original | Módulo 19: Notifications |
| Código | `NOTIF` |
| Rama | `sdd/add-notifications` |
| Momento | Después de Calendar/Tasks, antes de Quotes, Orders y Tickets |
| Hito inicial | Cierra Deals/Activities/Calendar/Notifications como `v0.4.0` |
| Hito completo | Automations + outbox cierran `v0.8.0` |

Notifications se adelanta porque recordatorios, stock bajo y tickets críticos
deben usar un dueño común desde su primera implementación. El número original
identifica alcance, no obliga a retrasar la dependencia.

## Recorrido

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/add-notifications
```

1. Ve a
   [`database/task-001-notifications-schema.md`](database/task-001-notifications-schema.md).
2. Crea y prueba la migración `CreateNotificationsSchema`.
3. Confirma entity y migración:

```powershell
git add src/notifications src/database/migrations
git commit -m "feat(database): add notifications schema"
```

4. Ve a
   [`development/task-001-notification-delivery.md`](development/task-001-notification-delivery.md)
   y completa in-app, email, preferences, templates y worker.
5. Ve a [`seeds/task-001-notifications-seed.md`](seeds/task-001-notifications-seed.md)
   y ejecuta dos veces.
6. Ve a [`tests/task-001-notifications-tests.md`](tests/task-001-notifications-tests.md)
   y completa unit, integration y E2E.

```powershell
git add src/notifications src/app.module.ts package.json pnpm-lock.yaml .env.example .env.test.example
git commit -m "feat(notifications): add in-app and email delivery"
git add src/seed
git commit -m "feat(seed): add notification templates and preferences"
git add src/notifications/*.spec.ts test/integration/notifications test/e2e/notifications
git commit -m "test(notifications): cover delivery and preferences"
```

## Definition of Done

- [ ] Cada fila pertenece a organization y recipient membership.
- [ ] In-app soporta unread/read y paginación.
- [ ] Email usa SMTP validado, snapshots y retries.
- [ ] Preferences y quiet hours se respetan salvo eventos obligatorios.
- [ ] Idempotency evita duplicados por evento/canal/recipient.
- [ ] Templates validan variables permitidas.
- [ ] Worker reclama filas concurrentemente sin doble envío.
- [ ] Audit cubre cambios de templates/preferences y retries manuales.
- [ ] Seed y tests son determinísticos.

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
git push -u origin sdd/add-notifications
gh pr create --base main --head sdd/add-notifications --title "feat(notifications): add in-app and email notifications"
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-notifications
git push origin main
git branch -d sdd/add-notifications
git push origin --delete sdd/add-notifications
```

Si Deals, Activities y Calendar/Tasks ya cumplen su Definition of Done, crea
desde `main` el tag `v0.4.0` y su release. Explica que Notifications ya soporta
channels y recordatorios, mientras la orquestación durable de rules se completa
en `v0.8.0`.

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
git tag -a v0.4.0 -m "v0.4.0 - pipeline activities calendar and notifications"
git push origin v0.4.0
gh release create v0.4.0 --title "v0.4.0 - Commercial follow-up" --generate-notes
```

## Siguiente paso

Regresa a `docs/START-HERE.md`; continúa con el módulo marcado por el roadmap,
no necesariamente Automations inmediatamente.
