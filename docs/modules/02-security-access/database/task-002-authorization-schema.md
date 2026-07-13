# Database task 002: autorización organizacional

## Navegación

- **Código:** DB-SEC-002
- **Vienes de:** `../LEARNING-PATH.md`, registro `SEC-B01`.
- **Regresa a:** `../LEARNING-PATH.md`, registro `SEC-B01`.
- **No continúes hasta:** PostgreSQL impida combinar membresía, rol o actor de
  asignación de organizaciones diferentes.

## Prerrequisito

`organizations` y `organization_members` ya existen. No crees una segunda
relación user–organization. La migración del módulo 03 ya declaró
`UNIQUE (organization_id, id)` en `organization_members`; esta clave candidata
permite FKs tenant-safe.

## Modelo organizacional

### permissions

Campos: `id uuid PK`, `code varchar(120) not null`,
`resource varchar(60) not null`, `action varchar(40) not null`,
`description varchar(255) null`, `is_active boolean not null default true` y
timestamps.

Los permisos son globales. Declara dos identidades consistentes:

- `UNIQUE (code)` para resolver el código técnico persistido.
- `UNIQUE (resource, action)` para impedir dos códigos que representen la misma
  acción.

El código se construye como `${resource}:${action}` y un validator confirma que
las tres columnas coincidan antes de persistir.

### roles

Campos: `id uuid PK`, `organization_id uuid not null`,
`code varchar(80) not null`, `name varchar(120) not null`,
`description varchar(255) null`, `is_system boolean not null default false`,
`is_active boolean not null default true`, timestamps y `archived_at`.

Una organization es lado **uno** y tiene **muchos** roles. La FK no nula
`roles.organization_id` usa `onDelete: RESTRICT`. Declara:

- `UNIQUE (organization_id, code)` para la clave natural tenant-scoped.
- `UNIQUE (organization_id, id)` como clave candidata de referencias
  compuestas.

Incluso Super Admin es un rol dentro de un tenant: no evita el header ni el
membership guard.

### role_permissions

Campos: `organization_id uuid not null`, `role_id uuid not null`,
`permission_id uuid not null`, `created_at timestamptz not null`, PK compuesta
`(organization_id, role_id, permission_id)`.

Roles y permissions son muchos-a-muchos. Un role es lado uno respecto a muchas
filas puente y un permission también. La FK compuesta
`(organization_id, role_id)` referencia `roles(organization_id, id)` y la FK
global `permission_id` referencia `permissions.id`; ambas usan
`onDelete: CASCADE` porque la asignación no existe sin sus padres.

### organization_member_roles

Campos:

| Campo | Null | Motivo |
| --- | ---: | --- |
| `organization_id uuid` | no | Incluye tenant en PK y FKs. |
| `organization_member_id uuid` | no | Miembro que recibe el rol. |
| `role_id uuid` | no | Rol asignado. |
| `assigned_by_member_id uuid` | sí | Miembro actor; null solo para bootstrap controlado del sistema. |
| `created_at timestamptz` | no | Trazabilidad. |

La PK compuesta es
`(organization_id, organization_member_id, role_id)`. Declara estas FKs:

1. `(organization_id, organization_member_id)` referencia
   `organization_members(organization_id, id)`. El miembro es lado **uno** y
   sus asignaciones lado **muchos**; columnas no nulas, `onDelete: CASCADE`
   porque la asignación no tiene significado sin la membresía.
2. `(organization_id, role_id)` referencia `roles(organization_id, id)`. El
   role es lado **uno** y sus asignaciones lado **muchos**; columnas no nulas,
   `onDelete: CASCADE`.
3. `(organization_id, assigned_by_member_id)` referencia
   `organization_members(organization_id, id)`. El actor es lado **uno** y
   puede originar muchas asignaciones; `assigned_by_member_id` es nullable y
   la FK usa `onDelete: RESTRICT` porque memberships se archivan y su evidencia
   no debe eliminarse.

No uses `assigned_by` hacia `users.id`: probaría identidad, pero no que el actor
pertenece al mismo tenant.

## Invariantes

- Las tres FKs compuestas impiden cruces de tenant aun si el service falla.
- Ningún rol activo recibe un permiso inexistente o inactivo.
- No se retira el último Super Admin capaz de administrar la organización.
- Archivar permission o role no borra historial.
- Ningún rol permite actuar donde el user no tenga membership activa.

## Índices

- `UQ_permissions_resource_action` en `(resource, action)`.
- `UQ_roles_organization_code` en `(organization_id, code)`.
- `UQ_roles_organization_id_id` en `(organization_id, id)`.
- Índice `roles(organization_id, is_active)`.
- Índice inverso `role_permissions(permission_id, role_id)`.
- Índices inversos de member roles por `role_id` y
  `assigned_by_member_id`, siempre incluyendo `organization_id`.

## Ciclo de migración

```powershell
pnpm migration:show
pnpm migration:generate src/database/migrations/CreateOrganizationAuthorization
pnpm migration:run
pnpm migration:revert
pnpm migration:run
```

El `down` elimina primero FKs/tablas puente y después roles/permissions sin
tocar memberships. Inspecciona el SQL generado: TypeORM no debe simplificar una
FK compuesta a una FK por ID.

## Definition of Done

- [ ] `permissions` es unique por code y por resource/action.
- [ ] `roles` y memberships exponen la clave candidata `(organization_id, id)`.
- [ ] Member, role y assigned-by usan FKs compuestas tenant-safe.
- [ ] `assigned_by_member_id` no referencia users.
- [ ] `up -> down -> up` pasa sobre PostgreSQL test.
- [ ] Un cruce de tenant falla por constraint de base.
