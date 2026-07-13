# Seed task 001: organizaciones

## Navegación

- **Código:** SEED-ORG-001
- **Vienes de:** `../LEARNING-PATH.md`, registro `ORG-004`.
- **Regresa a:** `../LEARNING-PATH.md`, registro `ORG-004`.
- **No continúes hasta:** dos tenants tengan IDs estables y configuración aislada tras dos corridas.

## Dataset

Crea una organization demo principal y una secundaria con constantes estables para probar aislamiento. `OrganizationsSeeder` es owner de organizations/settings/memberships; después invoca `PlatformOrganizationSeeder` para secuencias, tasas y catálogos de cada tenant.

## Orden

1. Verifica que el usuario bootstrap exista.
2. Upsert organizations por slug y tax ID normalizado globalmente único.
3. Upsert organization settings por organization ID.
4. Upsert memberships por organization/user, sin role.
5. Invoca `PlatformOrganizationSeeder` con cada organization ID y el mismo `EntityManager` recibido.
6. La asignación de Super Admin ocurre exclusivamente en Seguridad etapa B.

## Datos deterministas

No instales ni uses Faker. Foundation, Platform, Security y Organizations solo usan reference/bootstrap data constante; Customers será el primer módulo autorizado para Faker. Slugs, nombres y tax IDs demo son constantes documentadas.

## Transacción

`SeedExecutorService` abre una sola transacción para todo el dependency graph y entrega el mismo `EntityManager` a `OrganizationsSeeder` y `PlatformOrganizationSeeder`. Ninguno abre, confirma o revierte una transacción anidada ni usa repositories ligados a otro manager. Cualquier fallo revierte organizations y configuración Platform juntas. No elimina organizations ajenas al dataset.

## Entorno y verificación

Solo desarrollo/test autorizado. Ejecuta dos veces; conteos, IDs y membresías deben permanecer. Comprueba que ambas organizaciones tengan configuraciones distintas.
