# Ruta de aprendizaje: seguridad, usuarios y permisos

## Identidad

| Dato        | Valor                         |
| ----------- | ----------------------------- |
| Orden       | `02A`, retorno `02B`          |
| Código      | `SEC`                         |
| Rama A      | `sdd/security-authentication` |
| Rama B      | `sdd/security-authorization`  |
| Hito        | Parte de `v0.2.0`             |
| Publica tag | No                            |

## Propósito

Security tiene dos retornos deliberados. A crea identidad y autenticación
global. Después se sale de esta ruta para construir Organizations. Solo cuando
existen memberships y tenant context se regresa a B para persistir roles,
permissions, CASL y decorators tenant-scoped.

## Prerrequisitos

### Para iniciar la Parte A

- [x] Platform etapa A está mergeada (`PLAT-007`).
- [x] Las migraciones y suites de Platform pasan.
- [x] No hay cambios ajenos en el working tree.

### Para regresar a la Parte B

Este requisito se revisa después de completar `SEC-A06`; no bloquea el inicio
de la Parte A.

- [ ] Organizations está mergeado y `ORG-006` está completo.

## Registro real de avance

### Parte A — authentication global

- [ ] `SEC-A01` — Schema users/sessions/tokens aplicado, revertido y reaplicado.
- [ ] `SEC-A02` — Auth flows implementados con rotación atómica y replay.
- [ ] `SEC-A03` — Usuario bootstrap constante creado sin organization ni role.
- [ ] `SEC-A04` — Unit, integration y E2E de Authentication pasan.
- [ ] `SEC-A05` — Rama A publicada y mergeada sin tag.
- [ ] `SEC-A06` — Salida confirmada hacia Organizations; no se inició B antes.

### Parte B — authorization organizacional

- [ ] `SEC-B00` — Retorno recibido desde Organizations con tenant context y
      membership bootstrap sin role.
- [ ] `SEC-B01` — Roles, permissions y FKs compuestas migrados `up -> down -> up`.
- [ ] `SEC-B02` — Constantes tipadas, decorators, guard y CASL implementados.
- [ ] `SEC-B03` — 121 permissions, diez roles y member role bootstrap sembrados
      de forma idempotente.
- [ ] `SEC-B04` — Matriz, cruce de tenants, constantes y decorators probados.
- [ ] `SEC-B05` — Regresiones de Platform/Organizations/Auth pasan y rama B se
      mergeó sin tag.
- [ ] `SEC-B06` — Retorno a Organizations confirmado; siguiente paso Audit A.

## Parte A: inicio y recorrido

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/security-authentication
```

1. Abre `database/task-001-authentication-schema.md`, completa schema y ciclo de
   migración, y marca `SEC-A01`.
2. Abre `development/task-001-authentication.md`, implementa su orden completo
   y marca `SEC-A02`.
3. Abre `seeds/task-001-security-seed.md`, ejecuta solo **Etapa A** y marca
   `SEC-A03`.
4. Abre `tests/task-001-authentication-tests.md`, registra evidencia y marca
   `SEC-A04`.

## Commits exactos de A

Reemplaza `<timestamp>` por el archivo real; no uses staging amplio.

```powershell
git add src/users/entities/user.entity.ts src/auth/entities/user-session.entity.ts src/auth/entities/refresh-token.entity.ts src/auth/entities/email-verification-token.entity.ts src/auth/entities/password-reset-token.entity.ts src/database/migrations/<timestamp>-CreateAuthenticationSchema.ts src/users/users.module.ts src/auth/auth.module.ts src/app.module.ts
git diff --cached --check
git commit -m "feat(auth): add users sessions and token persistence"

git add package.json pnpm-lock.yaml src/auth/dto src/auth/guards src/auth/services src/auth/strategies src/auth/auth.controller.ts src/users/dto src/users/users.controller.ts src/users/users.service.ts src/main.ts
git diff --cached --check
git commit -m "feat(auth): implement secure authentication flows"

git add .env.example .env.test.example src/config src/seed/seed.registry.ts src/seed/seeders/security-authentication.seeder.ts
git diff --cached --check
git commit -m "feat(seed): add authentication bootstrap user"

git add src/auth/*.spec.ts src/users/*.spec.ts src/seed/seeders/security-authentication.seeder.spec.ts test/integration/auth test/e2e/auth
git diff --cached --check
git commit -m "test(auth): cover session and token rotation"
```

`package.json` y `pnpm-lock.yaml` aparecen juntos en el commit que instala
Argon2, Passport, JWT, cookie parser y Throttler. Security no modifica
`compose.yaml`; consume el servicio test de Foundation.

## Gate y salida obligatoria de A

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test -- auth
pnpm test:integration -- auth
pnpm test:migrations -- authentication
pnpm test:e2e -- auth
git diff --check
git status
```

No ejecutes build ni crees tag: A no cierra hito. Publica y mergea la rama,
marca `SEC-A05` y después abre
`docs/modules/03-organizations/LEARNING-PATH.md`. Esa salida es obligatoria;
marca `SEC-A06` y no leas todavía Database B.

```powershell
git push -u origin sdd/security-authentication
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/security-authentication
git push origin main
git branch -d sdd/security-authentication
git push origin --delete sdd/security-authentication
```

## Parte B: retorno exacto

Organizations regresa a este archivo desde `ORG-006`. Confirma que `main`
contenga organizations, memberships, tenant context y las FKs de Platform;
marca `SEC-B00` y crea la rama:

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/security-authorization
```

1. Abre `database/task-002-authorization-schema.md`; marca `SEC-B01` solo tras
   probar FKs compuestas y `up -> down -> up`.
2. Abre `development/task-002-authorization.md`; aplica también decorators a
   Platform y Organizations, y marca `SEC-B02`.
3. Regresa a `seeds/task-001-security-seed.md`, ejecuta solo **Etapa B** y marca
   `SEC-B03`.
4. Abre `tests/task-002-authorization-tests.md`; ejecuta matriz y regresiones, y
   marca `SEC-B04`.

## Commits exactos de B

```powershell
git add src/access-control/entities/permission.entity.ts src/access-control/entities/role.entity.ts src/access-control/entities/role-permission.entity.ts src/access-control/entities/organization-member-role.entity.ts src/database/migrations/<timestamp>-CreateOrganizationAuthorization.ts src/access-control/access-control.module.ts src/app.module.ts
git diff --cached --check
git commit -m "feat(authz): add organization roles and permissions"

git add package.json pnpm-lock.yaml src/access-control/constants/permission-definitions.ts src/access-control/decorators/require-permissions.decorator.ts src/access-control/guards src/access-control/policies src/access-control/services src/access-control/controllers src/platform/controllers src/organizations/controllers
git diff --cached --check
git commit -m "feat(authz): enforce permissions and resource policies"

git add src/seed/seed.registry.ts src/seed/seeders/security-authorization.seeder.ts src/seed/validators/security-authorization.validator.ts
git diff --cached --check
git commit -m "feat(seed): add organization authorization matrix"

git add src/access-control/*.spec.ts src/seed/seeders/security-authorization.seeder.spec.ts src/seed/validators/security-authorization.validator.spec.ts test/integration/access-control test/e2e/access-control test/e2e/platform test/e2e/organizations
git diff --cached --check
git commit -m "test(authz): cover tenant authorization matrix"
```

CASL es la única dependencia nueva de B; por eso package y lockfile se stagean
juntos en el segundo commit. `compose.yaml` no cambia.

## Gate, merge y retorno de B

Además de las suites B ejecuta Authentication, Platform y Organizations. No
uses build porque Audit A cierra el hito.

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:migrations
pnpm test:e2e
git diff --check
git status
```

Publica y mergea `sdd/security-authorization`, sin tag. Marca `SEC-B05`; vuelve
a `docs/modules/03-organizations/LEARNING-PATH.md`, registro `ORG-007`, para
confirmar que el bootstrap membership ahora tiene Super Admin y que los
controllers organizacionales exigen permissions. Regresa después aquí, marca
`SEC-B06` y continúa a Audit A.

```powershell
git push -u origin sdd/security-authorization
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/security-authorization
git push origin main
git branch -d sdd/security-authorization
git push origin --delete sdd/security-authorization
```

## Release gate

Security A y B no crean tags. `v0.2.0` exige Platform, Security A/B,
Organizations y Audit A completos, migraciones sobre base vacía, seed dos veces,
aislamiento, permissions y auditoría. Audit A ejecuta build, crea el tag y
publica el release.

## Definición de terminado

- [ ] Todos los registros A/B tienen evidencia.
- [ ] Refresh usa `parent_token_id UNIQUE`, sin columnas duplicadas de familia.
- [ ] User solo actúa mediante membership activa.
- [ ] FKs compuestas impiden roles/actores de otro tenant.
- [ ] 120 permission codes coinciden en constants, seed y pruebas.
- [ ] Los diez roles respetan inclusiones y exclusiones.
- [ ] No se creó tag en A o B.
