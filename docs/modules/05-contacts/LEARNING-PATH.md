# Ruta de aprendizaje: contactos

## Propósito

Modelar personas relacionadas con un cliente, su contacto principal y preferencias, conservando tenant isolation.

## Prerrequisitos

- Clientes integrado.
- Membresías, permisos y auditoría disponibles.

## Registro de avance

Marca `[x]` solo con evidencia real y conserva el commit o resultado que permite
retomar esta ruta sin adivinar qué quedó pendiente.

| Checkpoint                                       | Estado | Evidencia / commit | Fecha |
| ------------------------------------------------ | ------ | ------------------ | ----- |
| DB-CONT-001 schema y `up/down/up`                | [ ]    | —                  | —     |
| DEV-CONT-001 lifecycle y principal transaccional | [ ]    | —                  | —     |
| SEED-CONT-001 dos ejecuciones idempotentes       | [ ]    | —                  | —     |
| TEST-CONT-001 unit/integration/E2E               | [ ]    | —                  | —     |
| PR revisado, merge y limpieza de rama            | [ ]    | —                  | —     |

## Rama exacta

    git switch main
    git pull --ff-only origin main
    git switch -c sdd/contacts

## Recorrido

1. Ve a `database/task-001-contacts-schema.md`, sección **contacts**. Diseña la regla de contacto principal y migra.
2. Ve a `development/task-001-contacts-use-cases.md`, sección **Cambio de principal**.
3. Ve a `seeds/task-001-contacts-seed.md`, sección **Coherencia**.
4. Ve a `tests/task-001-contacts-tests.md`, sección **Concurrencia y aislamiento**.
5. Ejecuta también las pruebas de Customers.

## Commits e integración

Reemplaza `<timestamp>` por el archivo real mostrado por `git status`.

    git add src/contacts/entities/contact.entity.ts src/contacts/entities/contact-preference.entity.ts src/contacts/contacts.module.ts src/database/migrations/<timestamp>-CreateCustomerContacts.ts src/app.module.ts
    git commit -m "feat(contacts): add customer contacts and preferences"
    git add src/contacts/dto src/contacts/policies src/contacts/events src/contacts/contacts.controller.ts src/contacts/contacts.service.ts src/contacts/contacts.repository.ts
    git commit -m "feat(contacts): implement contact lifecycle"
    git add src/seed/seed.registry.ts src/seed/seeders/contacts.seeder.ts
    git commit -m "feat(seed): add deterministic contact dataset"
    git add ":(glob)src/contacts/**/*.spec.ts" src/seed/seeders/contacts.seeder.spec.ts test/integration/contacts test/e2e/contacts
    git commit -m "test(contacts): cover primary contact and isolation"
    git push -u origin sdd/contacts
    git switch main
    git pull --ff-only origin main
    git merge --no-ff sdd/contacts
    git push origin main
    git branch -d sdd/contacts
    git push origin --delete sdd/contacts

## Definición de terminado

- Cada contacto pertenece a un customer del mismo tenant.
- Hay máximo un contacto principal activo por customer.
- Cero contactos principales es válido y archivar uno nunca elige reemplazo automáticamente.
- Customer, contact y preferences quedan protegidos por FKs compuestas tenant-safe.
- Preferences no se confunden con datos de contacto.
- Archivar principal deja una decisión explícita: seleccionar otro o quedar sin principal.
- CRUD, permisos, auditoría, seed y pruebas pasan.

No crees tag: Contacts es parte de `v0.3.0`; Leads publicará el hito cuando Products, Price Lists y Pipelines también estén integrados.
