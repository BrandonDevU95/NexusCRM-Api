# Ruta de aprendizaje: clientes

## Propósito

Construir el agregado central del CRM con responsable, clasificación, notas, etiquetas, cambios de estado, búsqueda y archivo sin perder historial.

## Prerrequisitos

- Plataforma, Organizaciones y Seguridad partes A/B terminadas.
- Auditoría disponible o contrato de eventos definido para integrarla sin reescribir services.

## Registro de avance

Actualiza este registro durante tu implementación. Marca `[x]` únicamente cuando
tengas evidencia real; escribe el nombre de migración, commit o resultado, no
solo “listo”.

| Checkpoint                                   | Estado | Evidencia / commit | Fecha |
| -------------------------------------------- | ------ | ------------------ | ----- |
| DB-CUST-001 schema y `up/down/up`            | [ ]    | —                  | —     |
| DEV-CUST-001 endpoints, permisos y auditoría | [ ]    | —                  | —     |
| SEED-CUST-001 dos ejecuciones idempotentes   | [ ]    | —                  | —     |
| TEST-CUST-001 unit/integration/E2E           | [ ]    | —                  | —     |
| PR revisado, merge y limpieza de rama        | [ ]    | —                  | —     |

## Rama exacta

    git switch main
    git pull --ff-only origin main
    git switch -c sdd/customers

## Recorrido

1. Ve a `database/task-001-customers-schema.md`, sección **Aggregate root: customers**. Diseña tablas y migración; prueba `up/down` y regresa.
2. Ve a `development/task-001-customers-use-cases.md`, sección **Orden de implementación**. Implementa primero service/repository y después endpoints.
3. Ve a `seeds/task-001-customers-seed.md`, sección **Dataset**. Pobla dos tenants y ejecuta dos veces.
4. Ve a `tests/task-001-customers-tests.md`, sección **E2E**. Comprueba especialmente IDs de otro tenant.
5. Revisa migración, Swagger, permisos, auditoría y eventos.

## Commits sugeridos

Reemplaza `<timestamp>` por el archivo real mostrado por `git status`; no uses
`git add .` ni stages un directorio ajeno al checkpoint.

    git add src/customers/entities/customer.entity.ts src/customers/entities/customer-note.entity.ts src/customers/entities/tag.entity.ts src/customers/entities/customer-tag.entity.ts src/customers/entities/customer-status-history.entity.ts src/customers/customers.module.ts src/database/migrations/<timestamp>-CreateCustomerAggregate.ts src/app.module.ts
    git commit -m "feat(customers): add customer aggregate schema"
    git add src/customers/dto src/customers/policies src/customers/events src/customers/customers.controller.ts src/customers/customers.service.ts src/customers/customers.repository.ts
    git commit -m "feat(customers): implement customer lifecycle"
    git add package.json pnpm-lock.yaml src/seed/seed.registry.ts src/seed/seeders/customers.seeder.ts
    git commit -m "feat(seed): add deterministic customer dataset"
    git add ":(glob)src/customers/**/*.spec.ts" src/seed/seeders/customers.seeder.spec.ts test/integration/customers test/e2e/customers
    git commit -m "test(customers): cover search history and tenant isolation"

## Integración

    git push -u origin sdd/customers
    git switch main
    git pull --ff-only origin main
    git merge --no-ff sdd/customers
    git push origin main
    git branch -d sdd/customers
    git push origin --delete sdd/customers

## Definición de terminado

- Toda consulta se delimita por organización.
- Responsable es una membresía válida del mismo tenant.
- Cambiar estado genera historial y auditoría.
- Archivar no borra notas, tags ni history.
- Tax ID normalizado es único entre customers activos del tenant y el tipo no codifica su origen desde Lead.
- Hijos y actores usan FKs compuestas con organization, probadas contra inserts cross-tenant.
- Listado tiene búsqueda, filtros, orden y paginación acotada.
- Seed idempotente y suites completas pasan.

No crees tag: Customers es parte de `v0.3.0`, pero Leads cerrará ese hito después de que Contacts, Products, Price Lists y Pipelines también estén integrados.
