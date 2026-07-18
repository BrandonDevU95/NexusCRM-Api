# Ruta de aprendizaje: plataforma y configuración

## Identidad

| Dato            | Valor                              |
| --------------- | ---------------------------------- |
| Orden           | `01`                               |
| Código          | `PLAT`                             |
| Rama de etapa A | `sdd/platform-configuration`       |
| Hito            | Parte de `v0.2.0`                  |
| Publica tag     | No; Foundation ya publicó `v0.1.0` |

## Propósito

Crear las primeras tablas de dominio y sus casos de uso sobre la Foundation ya
publicada. Platform no reconstruye Joi, Compose, TypeORM, SeedModule ni la
infraestructura de pruebas: los consume y verifica antes de avanzar.

## Prerrequisitos

- [x] `v0.1.0` está integrado en `main`.
- [x] `docs/START-HERE.md` dirige a este módulo.
- [x] `.env` local existe, está ignorado y no contiene valores compartidos.
- [x] No hay cambios ajenos en el working tree.

## Git: inicio de etapa A

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/platform-configuration
```

## Registro real de avance

Marca una casilla solo después de ejecutar la evidencia indicada. Si
interrumpes el trabajo, este registro identifica el punto exacto de regreso.

- [x] `PLAT-001` — Preflight Foundation completado; evidencia: comandos y
      Definition of Done de `development/task-001-environment-and-config.md`.
- [x] `PLAT-002` — Entities y constraints diseñados; evidencia: revisión de
      **Diseño de tablas** en `database/task-001-platform-schema.md`.
- [x] `PLAT-003` — Migración `up -> down -> up`; evidencia: schema final y
      `migration:show` sin pendientes.
- [x] `PLAT-004` — Etapa A de services globales terminada; evidencia: no hay
      endpoints administrativos desprotegidos.
- [x] `PLAT-005` — `PlatformReferenceSeeder` y contrato de
      `PlatformOrganizationSeeder` implementados; evidencia: dos corridas de A con
      IDs estables.
- [ ] `PLAT-006` — Suites de etapa A pasan; evidencia: nombres de comandos y
      resultados registrados.
- [ ] `PLAT-007` — Rama A revisada, publicada y mergeada sin tag.
- [ ] `PLAT-008` — Retorno desde Organizations: FKs, seed B, numeración, tasas
      y aislamiento probados con dos tenants.
- [ ] `PLAT-009` — Retorno desde Security B/Audit A: endpoints sensibles tienen
      permisos explícitos y cambios críticos producen auditoría.

## Recorrido de etapa A

1. Abre `development/task-001-environment-and-config.md` y completa el
   preflight; regresa a `PLAT-001` sin modificar archivos.
2. Abre `database/task-001-platform-schema.md`, diseña las cinco tablas y
   regresa a `PLAT-002`.
3. Abre `database/task-002-migration-workflow.md`; ejecuta y documenta
   `run -> revert -> run`, luego marca `PLAT-003`.
4. Abre `development/task-002-settings-catalogs-numbering.md`, completa solo
   **Etapa A** y regresa a `PLAT-004`.
5. Abre `seeds/task-001-platform-seed.md`, completa **Etapa A** y el contrato de
   B, y regresa a `PLAT-005`.
6. Abre `tests/task-001-platform-tests.md`, ejecuta **Gate A** y regresa a
   `PLAT-006`.

## Commits exactos de etapa A

Reemplaza `<timestamp>` por el único archivo real que muestre `git status`. No
uses `git add .`, `git add src` ni `git add test`.

```powershell
git status --short
git add src/platform/entities/system-setting.entity.ts src/platform/entities/catalog.entity.ts src/platform/entities/catalog-option.entity.ts src/platform/entities/number-sequence.entity.ts src/platform/entities/tax-rate.entity.ts src/platform/platform.module.ts src/database/migrations/<timestamp>-CreatePlatformConfiguration.ts src/app.module.ts
git diff --cached --check
git commit -m "feat(platform): add configuration schema"

git add src/platform/dto src/platform/repositories src/platform/services src/platform/controllers/public-settings.controller.ts
git diff --cached --check
git commit -m "feat(platform): add global settings and catalogs"

git add src/seed/seed.registry.ts src/seed/seed.types.ts src/seed/seeders/platform-reference.seeder.ts src/seed/seeders/platform-organization.seeder.ts
git diff --cached --check
git commit -m "feat(seed): add platform reference seeders"

git add src/platform/*.spec.ts test/integration/platform test/migrations/platform.migration-spec.ts test/e2e/platform
git diff --cached --check
git commit -m "test(platform): cover configuration foundation"
```

Platform no instala dependencias: `package.json` y `pnpm-lock.yaml` no deben
cambiar ni incluirse en estos commits. `compose.yaml` pertenece a Foundation;
se verifica en `PLAT-001`, pero tampoco se edita ni se stagea aquí.

## Gate A y merge

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test -- platform
pnpm test:integration -- platform
pnpm test:migrations -- platform.migration-spec.ts
pnpm test:e2e -- platform
git diff --check
git status
```

No ejecutes build: Platform no cierra hito. Después publica, revisa y mergea:

```powershell
git push -u origin sdd/platform-configuration
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/platform-configuration
git push origin main
git branch -d sdd/platform-configuration
git push origin --delete sdd/platform-configuration
```

Marca `PLAT-007` y continúa a Security parte A.

## Contrato de retorno B

Organizations vuelve a esta ruta desde `ORG-004`, dentro de la rama
`sdd/organizations`. En ese retorno:

1. Aplica las FKs organizacionales creadas por la migración del módulo 03.
2. Invoca `PlatformOrganizationSeeder` desde `OrganizationsSeeder` con el mismo
   `EntityManager` y sin transacción anidada.
3. Prueba catálogos, tasas y folios independientes para dos tenants.
4. Ejecuta **Gate B** de la tarea de tests y marca `PLAT-008`.
5. Regresa a `docs/modules/03-organizations/LEARNING-PATH.md`, `ORG-004`.

Security B vuelve conceptualmente para aplicar los ocho permisos de Platform a
controllers administrativos; Audit A agrega before/after. Esas regresiones
marcan `PLAT-009`, pero sus commits pertenecen a las ramas de esos módulos.

## Release gate

No crees tag ni GitHub release en esta ruta. `v0.1.0` ya fue publicado por
Foundation. Platform forma parte de `v0.2.0` junto con Security A/B,
Organizations y Audit A. Audit A es el único que ejecuta el gate integral,
crea el tag y publica el release.

## Definición de terminado

- [ ] `PLAT-001` a `PLAT-009` tienen evidencia real.
- [ ] Una base vacía alcanza el schema actual solo con migraciones.
- [ ] El seed A es idempotente y B queda probado con dos tenants.
- [ ] Runner, no seeders, posee una sola transacción.
- [ ] Numeración concurrente no repite folios.
- [ ] Ningún secreto o valor operativo se persistió como setting.
- [ ] No se creó tag en esta ruta.
