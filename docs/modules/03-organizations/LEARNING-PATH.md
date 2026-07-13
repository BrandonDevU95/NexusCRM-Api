# Ruta de aprendizaje: organizaciones

## Propósito

Crear la frontera multiempresa que delimita todos los datos comerciales y desbloquea la parte B de Seguridad.

## Prerrequisitos

- Plataforma terminada.
- Seguridad parte A integrada.

## Registro real de avance

Marca cada casilla solo después de anotar migración, commit o resultado de suite.

- [ ] `ORG-001` — Schema, normalized tax ID y FKs Platform pasan `up -> down -> up`.
- [ ] `ORG-002` — Tenant context, memberships y endpoints implementados.
- [ ] `ORG-003` — Organization bootstrap crea membership **sin role**.
- [ ] `ORG-004` — `OrganizationsSeeder` invoca `PlatformOrganizationSeeder` con el mismo `EntityManager`; dos corridas conservan IDs.
- [ ] `ORG-005` — Unit, integration, migrations y E2E pasan, incluidos inserts cross-tenant directos.
- [ ] `ORG-006` — Rama Organizations mergeada sin tag; salida a Security B.
- [ ] `ORG-007` — Retorno desde Security B confirma Super Admin bootstrap, permissions y regresiones; salida a Audit A.

## Rama exacta

    git switch main
    git pull --ff-only origin main
    git switch -c sdd/organizations

## Recorrido

1. Ve a `database/task-001-organizations-schema.md`, sección **Diseño**; regresa y marca `ORG-001` después de `up/down/up`.
2. Ve a `development/task-001-organization-context.md`, sección **Orden de implementación**; regresa y marca `ORG-002`/`ORG-003`.
3. Ve a `seeds/task-001-organizations-seed.md`, sección **Orden**; regresa y marca `ORG-004`.
4. Ve al contrato de retorno B de `../01-platform-configuration/LEARNING-PATH.md`; prueba configuración por organization y regresa aquí a `ORG-004`.
5. Ve a `tests/task-001-organizations-tests.md`, sección **E2E de aislamiento**; regresa y marca `ORG-005`.
6. Publica, integra sin tag, marca `ORG-006` y sal a Security Parte B.

## Commits sugeridos

Reemplaza `<timestamp>` por el archivo real mostrado por `git status`.

    git add src/organizations/entities/organization.entity.ts src/organizations/entities/organization-member.entity.ts src/organizations/entities/organization-setting.entity.ts src/organizations/organizations.module.ts src/database/migrations/<timestamp>-CreateOrganizationsAndTenantRelations.ts src/app.module.ts
    git commit -m "feat(organizations): add tenant schema and platform relations"
    git add src/organizations/dto src/organizations/events src/organizations/guards src/organizations/repositories src/organizations/services src/organizations/controllers src/organizations/tenant-context
    git commit -m "feat(organizations): establish request tenant context"
    git add src/seed/seed.registry.ts src/seed/seeders/organizations.seeder.ts
    git commit -m "feat(seed): add organization bootstrap and platform settings"
    git add ":(glob)src/organizations/**/*.spec.ts" src/seed/seeders/organizations.seeder.spec.ts test/integration/organizations test/migrations/organizations.migration-spec.ts test/e2e/organizations test/e2e/platform
    git commit -m "test(organizations): cover membership and isolation"

## Integración

    git push -u origin sdd/organizations
    git switch main
    git pull --ff-only origin main
    git merge --no-ff sdd/organizations
    git push origin main
    git branch -d sdd/organizations
    git push origin --delete sdd/organizations

Marca `ORG-006` y vuelve a Security Parte B. Después de su merge, regresa a
`ORG-007`; verifica que Security B, no Organizations, asignó Super Admin a la
membership bootstrap. Continúa después a Audit A.

## Definición de terminado

- Usuario global puede tener membresías en varias organizaciones.
- Cada request de negocio tiene una organización activa validada.
- No se acepta `organization_id` arbitrario desde payload.
- Settings, secuencias, tasas y catálogos personalizados tienen FK real.
- Tax ID normalizado es unique global entre organizations no archivadas.
- Bootstrap crea membership sin role; Security B asigna Super Admin.
- Runner posee la única transacción y todos los seeders comparten EntityManager.
- Inactivar membresía u organización corta el acceso.
- Tests de aislamiento y regresión pasan.

No crees tag: Audit A cierra `v0.2.0` después de Platform, Security A/B y
Organizations.
