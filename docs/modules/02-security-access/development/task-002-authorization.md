# Development task 002: RBAC, permisos y CASL

## Navegación

- **Código:** DEV-SEC-002
- **Vienes de:** `../LEARNING-PATH.md`, registro `SEC-B02`.
- **Regresa a:** `../LEARNING-PATH.md`, registro `SEC-B02`.
- **No continúes hasta:** cada endpoint sensible aplique identidad, tenant,
  permission, policy y filtro DB en ese orden.

## Autorización en capas

1. Authentication confirma identidad.
2. Tenant guard confirma membership activa en `X-Organization-Id`.
3. Permission guard confirma la acción general.
4. CASL aplica condiciones de recurso, owner, team o warehouse.
5. Service delimita nuevamente por `organization_id`.

Body y JWT no eligen tenant. El token aporta user ID; el guard produce
`userId`, `organizationId` y `membershipId` validados.

## Dependencia e instalación

```powershell
pnpm add -E @casl/ability@7.0.1
```

Versiona juntos `package.json` y `pnpm-lock.yaml`. No instales una biblioteca
RBAC adicional.

## Una fuente tipada de permisos

Define `PERMISSION_DEFINITIONS` como arreglo `as const` con `code`, `resource`,
`action` y descripción. Deriva `PermissionCode` de esa constante. El seeder
persiste esa misma definición y valida que `code === resource + ':' + action`;
no mantengas otra lista manual en runtime.

`@RequirePermissions(...codes: PermissionCode[])` guarda metadata tipada. El
guard exige todos los códigos declarados salvo que otro decorador explícito
modele una alternativa. No aceptes strings arbitrarios ni wildcards.

Ejemplos de protección:

```typescript
@RequirePermissions(PERMISSIONS.ROLES_MANAGE)
@RequirePermissions(PERMISSIONS.QUOTES_READ, PERMISSIONS.QUOTES_ACCEPT)
```

Actualiza controllers existentes de Platform y Organizations durante esta
rama. No basta con proteger únicamente controllers nuevos de Security.

## Casos de uso

- Crear, editar, archivar y listar roles.
- Asignar/retirar permissions de un role.
- Asignar/retirar roles de una membership.
- Guardar `assignedByMemberId` desde tenant context, nunca desde body.
- Consultar permissions efectivos.
- Construir CASL ability desde roles, permissions y contexto.
- Invalidar autorización cacheada cuando cambie la matriz.

## Endpoints orientativos

- `GET /roles`, `POST /roles`, `PATCH /roles/:id`.
- `PUT /roles/:id/permissions`.
- `PUT /organization-members/:memberId/roles`.
- `GET /auth/me/permissions`.

## Validación y reglas

- Codes normalizados, IDs UUID y listas sin duplicados.
- `organization_id` y `assigned_by_member_id` no vienen del DTO.
- Permissions enviados existen y están activos.
- Role, membership y actor pertenecen al tenant activo; la base también lo
  exige con FKs compuestas.
- Protege último Super Admin y evita autoescalación.
- `system-admin:access` habilita el área, nunca hace bypass.

## Permisos administrativos mínimos

Usa las constantes exactas `users:create`, `users:read`, `users:update`,
`users:delete`, `users:sessions-manage`, `roles:manage` y
`permissions:manage`. Los permisos de Platform y Organizations también se
aplican en esta rama, según el catálogo del seed.

Calendar separa `calendar:read` de `calendar:manage`: consultar eventos no debe
conceder creación, edición, cancelación ni respuesta de asistentes.
Inventory conserva las acciones específicas `inventory:read`,
`inventory:adjust`, `inventory:transfer`, `inventory:reserve`,
`warehouses:read` y `warehouses:manage`; no inventes `inventory:manage`.

## Auditoría

Asignar roles o permissions produce before/after con actor membership. Hasta
Audit A emite un evento seguro sin token ni claims completos; Audit A conecta
la persistencia antes de publicar `v0.2.0`.

## Errores

- Sin login: `401`.
- Identidad sin permiso: `403`.
- Recurso de otro tenant: `404`.
- Último administrador: `409`.
- Permission o role archivado: `409` o `422`, consistente.

## Definition of Done

- [ ] Runtime y seed consumen una fuente tipada de 121 permissions.
- [ ] Decorators no aceptan strings o wildcards ajenos al catálogo.
- [ ] Platform, Organizations y Security tienen decorators explícitos.
- [ ] `assignedByMemberId` proviene de tenant context.
- [ ] Service y DB rechazan cruces de tenant.
- [ ] Calendar usa exactamente read/manage e Inventory no agrega manage genérico.
