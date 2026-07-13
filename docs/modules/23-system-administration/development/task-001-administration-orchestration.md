# Development task 001: orquestación administrativa

## Navegación

- Código: `DEV-ADMIN-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 2.
- Regresas a: paso 3.

## Estructura

```text
src/system-administration/
├── dto/
├── system-administration.controller.ts
├── system-administration.service.ts
└── system-administration.module.ts
```

No hay `entities/` ni repository. El module importa APIs/services públicos de
owners; evita ciclos exportando ports estrechos cuando sea necesario.

## Permission model

`system-admin:access` es puerta de entrada, no wildcard. Cada sección además
exige su permission exacta: `users:read`, `users:update`, `roles:manage`,
`permissions:manage`, `catalogs:manage`, `pipelines:manage`,
`price-lists:manage`, `tax-rates:manage`, `notification-templates:manage`,
`audit:read` o `security-logs:read` según la acción.

Super Admin sigue limitado a la organization de `X-Organization-Id`. No existe
un bypass por nombre de role; Permission Guard y membership se ejecutan igual.

## Rutas propietarias que no se duplican

La administración UI usa directamente:

- `/api/v1/users`, roles, permissions y memberships para access management.
- `/api/v1/settings`, catalogs y tax rates para platform configuration.
- `/api/v1/pipelines` y stages.
- `/api/v1/price-lists`.
- `/api/v1/notification-templates`.
- `/api/v1/audit-logs` y `/api/v1/security-logs`.

No crees `/admin/users` que replique validación y responses.

## Endpoints propios

| Método/path                                                                  | Permissions                                                                                                                                                | Resultado                                              |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `GET /api/v1/system-administration/overview`                                 | `system-admin:access` + owner read permissions                                                                                                             | Secciones permitidas, counts y health de configuración |
| `GET /api/v1/system-administration/configuration-readiness`                  | `system-admin:access`, `settings:read`, `catalogs:read`, `pipelines:read`, `price-lists:read`, `notification-templates:manage`                             | Missing defaults sin secrets                           |
| `GET /api/v1/system-administration/members/:memberId/access-review`          | `system-admin:access`, `organization-members:read`, `roles:manage`                                                                                         | Membership, roles y permissions efectivas              |
| `POST /api/v1/system-administration/organizations/:organizationId/bootstrap` | `system-admin:access`, `settings:update`, `catalogs:manage`, `pipelines:manage`, `price-lists:manage`, `tax-rates:manage`, `notification-templates:manage` | Crear defaults faltantes idempotentemente              |

Si el actor carece de un owner read permission, overview omite esa sección y
explica capability false; no consulta primero y filtra después.

## DTOs y response

`AdministrationOverviewQueryDto` limita secciones. `AccessReviewParamsDto`
valida UUID. `BootstrapOrganizationDto` acepta únicamente flags de componentes
allowlisted y `expectedOrganizationVersion`; no recibe table names, role IDs
arbitrarios o settings JSON libre.

Bootstrap response separa `created`, `existing`, `skipped` y warnings por owner.
No devuelve credentials, hashes, SMTP config ni audit snapshots.

## Bootstrap transaccional

1. Resolver organization del header/path y confirmar que coinciden.
2. Verificar membership y todas las owner permissions antes de mutar.
3. Abrir una transacción.
4. Invocar owner services con el mismo `EntityManager` para settings, base
   catalogs, default pipeline, default price list, taxes y notification templates.
5. Cada owner hace create-if-missing por natural key; no sobrescribe custom.
6. Registrar `ORGANIZATION_CONFIGURATION_BOOTSTRAPPED` con resumen.
7. Confirmar todo o revertir todo.

Si un owner necesita comunicación externa, solo crea outbox/notification PENDING
dentro de la transacción. Retry con la misma idempotency key no duplica defaults.

## Audit y errors

Owner mutations conservan sus audit actions. El orchestrator agrega un summary
action, no reemplaza detalles. Un error reporta owner/error code/correlation sin
SQL ni secret. UUID de otro tenant responde not found.

## Definition of Done

- [ ] No hay repositorios cruzados ni endpoints CRUD duplicados.
- [ ] System admin access nunca reemplaza owner permission.
- [ ] Overview consulta solo secciones autorizadas.
- [ ] Access review usa RBAC/CASL real.
- [ ] Bootstrap comparte transaction/manager y es idempotente.
- [ ] Custom configuration nunca se sobrescribe.
- [ ] Header/path tenant mismatch se rechaza.
