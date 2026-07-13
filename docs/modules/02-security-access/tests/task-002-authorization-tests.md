# Test task 002: autorización

## Navegación

- **Código:** TEST-SEC-002
- **Vienes de:** `../LEARNING-PATH.md`, registro `SEC-B04`.
- **Regresa a:** `../LEARNING-PATH.md`, registro `SEC-B04`.
- **No continúes hasta:** constants, seed, decorators, FKs y matriz coincidan.

## Fixture mínimo

Crea organizations A/B, memberships A/B, roles A/B y un recurso por tenant.
Usa IDs explícitos del fixture; no depende del seed demo.

## Unitarias

- Permission guard distingue falta de identity (`401`) y falta de permission
  (`403`).
- CASL permite owner y niega recurso ajeno.
- Varios roles producen la unión esperada sin acciones inexistentes.
- `PERMISSION_DEFINITIONS` contiene exactamente 121 codes únicos.
- Cada definición cumple `code === resource + ':' + action`; ningún par
  resource/action se repite.
- `PermissionCode` y `@RequirePermissions` rechazan en compilación strings que
  no pertenecen al catálogo.
- Metadata del decorator conserva todos los permisos requeridos, sin wildcard.
- Calendar contiene exactamente `calendar:read` y `calendar:manage`.
- Inventory no contiene una acción genérica manage.

## Integración

- `permissions.code` y `(resource, action)` son UNIQUE.
- Roles son unique por organization/code.
- `roles(organization_id, id)` y
  `organization_members(organization_id, id)` son claves candidatas.
- No duplica role permission ni member role.
- FK compuesta rechaza role A en membership B aunque ambos IDs existan.
- FK compuesta rechaza `assigned_by_member_id` de B para asignación en A.
- `assigned_by_member_id` null se permite solo al fixture de bootstrap.
- Protege último Super Admin.
- Archivar role elimina efecto sin borrar auditoría.
- Seed y constante tienen exactamente los mismos 121 codes y no existe `*`.
- Super Admin recibe los 121 permission IDs.
- Admin conserva exclusiones documentadas.
- Nuevos permisos respetan matriz: Sales Manager recibe price-list assign,
  quote override/accept/convert y order confirm/return; Sales Representative no
  recibe cost/price management/override/return; Support Agent recibe
  reply/internal-comment/attach pero no reopen; Warehouse Manager recibe
  read-cost/return; Finance Viewer recibe read-cost.
- Sales Representative no recibe assign/delete/approve; Support Agent no
  recibe assign/publish; Warehouse User no recibe adjust/manage; Finance Viewer
  y Read Only no reciben mutaciones de negocio.
- Read Only puede consultar calendario pero no administrar eventos; las rutas
  GET exigen `calendar:read` y toda mutación exige `calendar:manage`.
- Dos corridas conservan IDs, conteos y matriz.
- Todos los seeders reciben el mismo manager; una falla revierte dependencias y
  asignaciones de la corrida.

## E2E

- Sin token: `401`; token sin permission: `403`.
- Permission + recurso permitido: éxito.
- Permission general + policy fallida: `403`.
- ID de otro tenant: `404`.
- Cambiar roles altera permissions efectivos y Audit A persiste el cambio.
- Ningún DTO acepta organization o assigned-by para saltar tenant context.
- Controllers sensibles de Platform, Organizations y Security declaran
  `@RequirePermissions` con constants; una prueba de inventario de rutas falla
  si falta metadata.

## Regresión

Ejecuta Login, Refresh, Logout, Platform y Organizations. Authz no debe romper
cookies, tenant context, folios ni membership bootstrap.

## Evidencia

Registra comandos, conteo 121, resultado del cruce de tenant y lista de
controllers inspeccionados antes de marcar `SEC-B04`.
