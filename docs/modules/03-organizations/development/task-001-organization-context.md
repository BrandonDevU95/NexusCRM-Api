# Development task 001: organización y tenant context

## Navegación

- **Código:** DEV-ORG-001
- **Vienes de:** `../LEARNING-PATH.md`, registros `ORG-002` y `ORG-003`.
- **Regresa a:** `../LEARNING-PATH.md`, registros `ORG-002` y `ORG-003`.
- **No continúes hasta:** ningún caso de uso confíe en `organization_id` enviado en body.

## Casos de uso

- Crear organización con settings iniciales en una transacción.
- Leer y actualizar perfil/configuración.
- Listar organizaciones accesibles para el usuario.
- Invitar o incorporar usuario existente.
- Activar, suspender o archivar membresía.
- Seleccionar organización activa para un request.

## Endpoints orientativos

- `POST /organizations`
- `GET /organizations`
- `GET /organizations/:id`
- `PATCH /organizations/:id`
- `GET /organizations/:id/members`
- `POST /organizations/:id/members`
- `PATCH /organizations/:id/members/:memberId`
- `GET/PATCH /organizations/:id/settings`

## Tenant context

Los endpoints tenant-scoped exigen `X-Organization-Id`. El guard valida que el usuario tenga membresía activa y crea un contexto con `userId`, `organizationId` y `membershipId` para services, auditoría y eventos. El body y el JWT no deciden tenant; el token solo identifica al usuario. `GET /organizations` es global a la identidad y lista membresías accesibles, pero al administrar una organización activa se valida el header contra la ruta.

## Orden de implementación

1. Repositories con filtros organizacionales.
2. Crear organización, settings y membership bootstrap atómicamente, **sin role**.
3. Membresías e invitaciones; el actor siempre es una membership del tenant.
4. Resolver tenant context y guard de membresía activa.
5. Endpoints, DTOs y Swagger.
6. Eventos `organization.created`, `member.added`, `member.status_changed`.

## DTO validation

Valida slug, tax ID, moneda ISO, zona IANA, locale, email y status permitido. Deriva `normalizedTaxId`; el DTO nunca lo acepta directamente. Rechaza IDs del sistema, roles prematuros y settings desconocidos. Normaliza sin alterar nombres de presentación.

## Permisos y auditoría

Durante bootstrap, crear organization inserta al creador únicamente como membership activa. No crea role ni `organization_member_roles`; Security B asignará Super Admin cuando esas tablas existan. Después usa `organizations:read`, `organizations:update`, `organization-members:manage` y `organization-settings:update`. Audita cambios de organización, settings y memberships.

## Errores

- Slug duplicado: `409`.
- Tax ID normalizado duplicado en otra organization vigente: `409`.
- Zona/moneda inválida: `422` o `400` consistente.
- Organización o membresía de otro tenant: `404`.
- Organización suspendida o membresía inactiva: `403`.
