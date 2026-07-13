# Test task 001: System Administration

## Navegación

- Código: `TEST-ADMIN-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 4.
- Regresas a: LEARNING-PATH para `v0.9.0`.

## Unit

Capability matrix, owner permission composition, overview section selection,
readiness aggregation, access review y bootstrap plan. Simula owner ports, no
repositories. Prueba que `system-admin:access` solo nunca autoriza una mutación.

## Integration

- Metadata TypeORM no contiene entity/table Administration.
- Bootstrap crea solo defaults faltantes con natural keys.
- Segunda ejecución reporta existing/skipped y conserva IDs.
- Custom pipeline/price/tax/template no se sobrescribe.
- Falla de un owner revierte todos los defaults y summary audit.
- Owner audit details y orchestrator summary comparten transaction.
- Header/path organization mismatch no consulta/muta.
- Seed verification detecta missing owner permission sin insertar.

## E2E

Overview completo/partial por permissions, readiness, access review, bootstrap,
missing header, membership inactive, system-admin sin owner permission,
non-admin con owner permissions pero sin entry access y cross-tenant member/org
como not found.

Después usa rutas propietarias para users, roles, catalogs, pipelines, price
lists, taxes, templates y audit; confirma que no existen duplicados `/admin/*`.
Responses conservan correlation y no contienen secrets.

## Release gate

Además de suites del módulo, aplica todas las migraciones desde DB vacía,
ejecuta seed maestro dos veces, prueba los flujos Reports/Import/Audit y ejecuta
`pnpm build`.

## Definition of Done

- [ ] Unit demuestra composición de permissions.
- [ ] Integration demuestra ausencia de schema, transacción e idempotency.
- [ ] E2E demuestra entry + owner permissions + tenant.
- [ ] No hay bypass por role name ni wildcard.
- [ ] Gate completo de `v0.9.0` pasa.
