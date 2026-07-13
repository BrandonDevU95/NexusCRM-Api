# Seed task 001: historial demo de Audit

## Navegación

- Código: `SEED-AUD-001`.
- Vienes de: `../LEARNING-PATH.md`, Parte B paso 3.
- Regresas a: Parte B paso 4.

Parte A no inventa audit rows: las operaciones reales de Security/Organizations
demuestran el writer. Parte B registra un demo dataset separado para filtros y
retention, con dependencia de todos los módulos relevantes.

`SEED_AUDIT_LOGS_COUNT` y `SEED_SECURITY_LOGS_COUNT` usan límites Joi, offsets
Faker distintos y fechas base distribuidas antes/después de un cutoff demo.
Correlation IDs, action/entity/member references son determinísticos. Snapshots
solo contienen fields allowlisted y metadata marca `source: DEMO_SEED`.

Idempotencia: encuentra por organization + correlation + action + entity y no
duplica. No agrega un unique de negocio que impida eventos reales. Security
subjects usan hashes determinísticos de identifiers locales, nunca emails reales.

Seed usa `EntityManager` compartido, no endpoints, y jamás ejecuta retention. La
segunda ejecución conserva conteos/IDs lógicos. Referencia cross-tenant o
prohibited key falla antes de persistir.

## Definition of Done

- [ ] Dataset cubre critical actions y security outcomes.
- [ ] No contiene credentials/tokens/email real.
- [ ] Fechas permiten probar filtros/preview sin borrar.
- [ ] Segunda ejecución no duplica.
- [ ] Prod rechaza demo logs.
