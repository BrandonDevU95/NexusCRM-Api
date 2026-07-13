# Ruta de aprendizaje: actividades y seguimiento

**Código:** `MOD-09`

## Objetivo

Registrar interacciones de negocio —llamadas, correos, reuniones, WhatsApp,
visitas, notas, demos y seguimientos— y exponerlas en una línea de tiempo sin
convertir el timeline en una segunda fuente de verdad.

## Vienes de

- `../08-deals/LEARNING-PATH.md` completado.
- Tenant context, permisos y auditoría inicial activos.
- Lee [convenciones de nombres](../../project/NAMING-CONVENTIONS.md),
  [arquitectura](../../project/ARCHITECTURE.md) y
  [Definition of Done](../../project/DEFINITION-OF-DONE.md).

## Rama exacta

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/add-activities-timeline
```

No continúes si hay cambios ajenos o si la rama activa no es
`sdd/add-activities-timeline`.

## Recorrido único

1. Ve a `database/task-001-activities-schema.md`, sección **Diccionario de datos**.
2. Regresa aquí cuando la migración complete `run → inspect → revert → inspect → run`.
3. Ve a `development/task-001-activities-timeline.md`, sección **Orden de implementación**.
4. Regresa aquí cuando los casos de uso apliquen tenant, permisos y transacciones.
5. Ve a `seeds/task-001-activities-seed.md`, sección **Dataset y orden**.
6. Regresa aquí después de ejecutar el seeder dos veces sin cambiar conteos.
7. Ve a `tests/task-001-activities-tests.md`, sección **Matriz mínima**.
8. Regresa aquí y ejecuta la verificación final.

## Registro de avance

Marca una casilla únicamente después de regresar del archivo indicado y comprobar
su condición de salida.

- [ ] Rama `sdd/add-activities-timeline` creada desde `main` limpio.
- [ ] `DB-ACT-001`: migración ejecutada `run → inspect → revert → inspect → run`.
- [ ] `DEV-ACT-001`: tenant, memberships, permisos, estados y attachments completos.
- [ ] `SEED-ACT-001`: dos ejecuciones con mismos IDs y conteos.
- [ ] `TEST-ACT-001`: unit, integration y E2E en verde.
- [ ] Diff/lockfile revisados y commits pedagógicos creados.
- [ ] Rama publicada, Pull Request aprobado y merge `--no-ff` integrado.
- [ ] Siguiente destino confirmado: Calendar/Tasks.

## Checkpoints y commits sugeridos

```powershell
git add src/activities/entities src/database/migrations
git commit -m "feat(database): add activities schema"

git add src/activities src/app.module.ts package.json pnpm-lock.yaml
git commit -m "feat(activities): add interaction timeline"

git add src/seed
git commit -m "feat(seed): add deterministic activities dataset"

git add src/activities test
git commit -m "test(activities): cover interactions and timeline"
```

Usa rutas reales y específicas; no ejecutes `git add .`.

## Verificación, publicación e integración

```powershell
git status
git diff --check
git diff --stat main...HEAD
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
git push -u origin sdd/add-activities-timeline
gh pr create --base main --head sdd/add-activities-timeline --title "feat(activities): add interaction timeline"
```

Después de revisar y aprobar el Pull Request:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-activities-timeline
git push origin main
git branch -d sdd/add-activities-timeline
git push origin --delete sdd/add-activities-timeline
```

## Definition of Done del módulo

- Cada actividad pertenece a una organización y al menos a un recurso comercial.
- La relación con customer/contact/lead/deal se valida dentro del mismo tenant.
- Comentarios y metadatos de adjuntos conservan autor e historial.
- Completar o cancelar una actividad respeta una máquina de estados explícita.
- El timeline se construye como lectura; no copia eventos a una tabla `timelines`.
- Listados soportan paginación, fecha, tipo, estado, owner y recurso relacionado.
- Seeds son reproducibles e idempotentes.
- Pruebas unitarias, integración y E2E cubren aislamiento, permisos y auditoría.

## Siguiente destino

Continúa en `../10-calendar-tasks/LEARNING-PATH.md`.
