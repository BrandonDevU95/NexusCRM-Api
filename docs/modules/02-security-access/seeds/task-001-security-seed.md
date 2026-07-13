# Seed task 001: seguridad

## Navegación Parte A

- **Código:** SEED-SEC-001-A
- **Vienes de:** `../LEARNING-PATH.md`, registro `SEC-A03`.
- **Regresa a:** `../LEARNING-PATH.md`, registro `SEC-A03`.
- **No continúes hasta:** el usuario bootstrap sea idempotente y no imprima password/hash.

## Navegación Parte B

- **Código:** SEED-SEC-001-B
- **Vienes de:** `../LEARNING-PATH.md`, registro `SEC-B03`.
- **Regresa a:** `../LEARNING-PATH.md`, registro `SEC-B03`.
- **No continúes hasta:** catálogo, matriz y member role sean idempotentes.

## Etapa A

Después de las tablas de autenticación crea un usuario bootstrap solo en desarrollo. Email y password vienen de variables de entorno validadas. Guarda hash Argon2id; nunca la contraseña en logs o archivos.

## Etapa B

Después de Organizaciones inserta:

- El catálogo exacto de permisos descrito abajo.
- Roles base: Super Admin, Admin, Sales Manager, Sales Representative, Support Manager, Support Agent, Warehouse Manager, Warehouse User, Finance Viewer y Read Only.
- `role_permissions` según una matriz explícita y revisable.
- El rol Super Admin de la membresía bootstrap ya creada por Organizations.

Security B no crea otra membership. Busca la existente por
`organization_id + user_id` y crea únicamente `organization_member_roles`, con
`assigned_by_member_id = null` porque es un bootstrap controlado del sistema.

## Catálogo exacto de permisos

Los códigos son identidad técnica y no se traducen. La etiqueta visible sí podrá traducirse. No inventes wildcard en la tabla `permissions`; inserta cada código de esta lista.

### 1. Plataforma y configuración

- `settings:read`
- `settings:update`
- `catalogs:read`
- `catalogs:manage`
- `number-sequences:read`
- `number-sequences:manage`
- `tax-rates:read`
- `tax-rates:manage`

### 2. Seguridad, usuarios y permisos

- `users:create`
- `users:read`
- `users:update`
- `users:delete`
- `users:sessions-manage`
- `roles:manage`
- `permissions:manage`

### 3. Organizaciones

- `organizations:create`
- `organizations:read`
- `organizations:update`
- `organizations:archive`
- `organization-members:read`
- `organization-members:manage`
- `organization-settings:read`
- `organization-settings:update`

### 4. Clientes

- `customers:create`
- `customers:read`
- `customers:update`
- `customers:delete`
- `customers:assign`

### 5. Contactos

- `contacts:create`
- `contacts:read`
- `contacts:update`
- `contacts:delete`

### 6. Leads

- `leads:create`
- `leads:read`
- `leads:update`
- `leads:delete`
- `leads:assign`
- `leads:convert`

### 7. Pipeline comercial

- `pipelines:read`
- `pipelines:manage`

### 8. Oportunidades

- `deals:create`
- `deals:read`
- `deals:update`
- `deals:delete`
- `deals:close`

### 9. Actividades y seguimiento

- `activities:create`
- `activities:read`
- `activities:update`
- `activities:delete`
- `activities:comment`
- `activities:complete`
- `activities:attach`

### 10. Calendario y tareas

- `tasks:create`
- `tasks:read`
- `tasks:update`
- `tasks:delete`
- `tasks:assign`
- `calendar:read`
- `calendar:manage`

### 11. Productos y servicios

- `products:create`
- `products:read`
- `products:read-cost`
- `products:update`
- `products:delete`
- `products:manage-prices`

### 12. Listas de precios

- `price-lists:read`
- `price-lists:manage`
- `price-lists:assign`

### 13. Cotizaciones

- `quotes:create`
- `quotes:read`
- `quotes:update`
- `quotes:approve`
- `quotes:send`
- `quotes:override-price`
- `quotes:accept`
- `quotes:convert`
- `quotes:delete`

### 14. Órdenes y ventas

- `orders:create`
- `orders:read`
- `orders:update`
- `orders:confirm`
- `orders:cancel`
- `orders:fulfill`
- `orders:return`

### 15. Inventario básico

- `inventory:read`
- `inventory:adjust`
- `inventory:transfer`
- `inventory:reserve`
- `warehouses:read`
- `warehouses:manage`

### 16. Tickets de soporte

- `tickets:create`
- `tickets:read`
- `tickets:update`
- `tickets:assign`
- `tickets:reply`
- `tickets:internal-comment`
- `tickets:attach`
- `tickets:close`
- `tickets:reopen`
- `ticket-categories:manage`

### 17. Base de conocimiento

- `knowledge-base:read`
- `knowledge-base:create`
- `knowledge-base:update`
- `knowledge-base:delete`
- `knowledge-base:publish`

### 18. Automatizaciones

- `automations:read`
- `automations:manage`
- `automations:execute`

### 19. Notificaciones

- `notifications:read`
- `notifications:update-preferences`
- `notification-templates:manage`

### 20. Reportes y dashboards

- `reports:read`
- `reports:manage`
- `dashboards:manage`

### 21. Importación y exportación

- `imports:create`
- `imports:read`
- `exports:create`
- `exports:read`

### 22. Auditoría y logs

- `audit:read`
- `security-logs:read`

### 23. Administración del sistema

- `system-admin:access`

`system-admin:access` solo permite entrar al área administrativa; cada acción también exige el permiso del módulo propietario. No lo conviertas en bypass.

El catálogo contiene exactamente **121** códigos. `tasks:read` autoriza tareas,
no eventos: Calendar separa `calendar:read` para consultar eventos de
`calendar:manage` para crearlos, modificarlos, cancelarlos y responder
asistencias. Inventory usa las acciones específicas listadas; no agregues
`inventory:manage`.

## Matriz explícita de roles base

En la columna **Incluye** se listan grupos y excepciones concretas. Un grupo como `customers:*` significa “todos los códigos `customers:` enumerados arriba” al construir el seed; la base recibe filas individuales, nunca un wildcard.

| Rol | Incluye | Excluye y límites obligatorios |
|---|---|---|
| Super Admin | `*`: todos los códigos exactos del catálogo | Es máximo administrador dentro de la organización de su membresía. El seed expande `*` a cada permission ID, no inserta un permiso llamado `*` y nunca permite saltar `X-Organization-Id` ni el guard de membresía. |
| Admin | Todos los permisos tenant-scoped; `system-admin:access`; `audit:read` | No recibe `organizations:create`, `organizations:archive`, `permissions:manage` ni `security-logs:read` salvo política de plataforma. No administra otra organización. |
| Sales Manager | `customers:*`, `contacts:*`, `leads:*`, `pipelines:*`, `deals:*`, `activities:*`, `tasks:*`, `calendar:read`, `calendar:manage`, `products:read`, `price-lists:read`, `price-lists:assign`, `quotes:*`, `orders:create`, `orders:read`, `orders:update`, `orders:confirm`, `orders:cancel`, `orders:return`, `inventory:read`, `notifications:read`, `notifications:update-preferences`, `reports:read`, `dashboards:manage`, `imports:create`, `imports:read`, `exports:create`, `exports:read` | Sin gestión de usuarios/roles/settings, sin `products:read-cost`, `products:manage-prices`, ajustes de inventario, fulfillment, soporte administrativo ni auditoría. CASL limita al equipo comercial cuando corresponda. |
| Sales Representative | `customers:create`, `customers:read`, `customers:update`, `contacts:create`, `contacts:read`, `contacts:update`, `leads:create`, `leads:read`, `leads:update`, `leads:convert`, `deals:create`, `deals:read`, `deals:update`, `deals:close`, `activities:create`, `activities:read`, `activities:update`, `activities:comment`, `activities:complete`, `activities:attach`, `tasks:create`, `tasks:read`, `tasks:update`, `calendar:read`, `calendar:manage`, `products:read`, `price-lists:read`, `quotes:create`, `quotes:read`, `quotes:update`, `quotes:send`, `quotes:accept`, `quotes:convert`, `orders:create`, `orders:read`, `orders:confirm`, `notifications:read`, `notifications:update-preferences`, `reports:read`, `exports:create`, `exports:read` | Sin delete/assign, `products:read-cost`, gestión de precios, `quotes:approve`, `quotes:override-price`, cancelación/devolución ni importación masiva. CASL restringe customers, leads, deals, quotes, calendar, reports y exports a propios/asignados. |
| Support Manager | `customers:read`, `contacts:read`, `orders:read`, `products:read`, `activities:create`, `activities:read`, `activities:comment`, `activities:complete`, `activities:attach`, `tasks:create`, `tasks:read`, `tasks:update`, `tasks:assign`, `calendar:read`, `calendar:manage`, `tickets:*`, `ticket-categories:manage`, `knowledge-base:*`, `notifications:read`, `notifications:update-preferences`, `reports:read`, `dashboards:manage`, `exports:create`, `exports:read` | Sin ventas mutables, precios, inventario ajustable, users/roles ni auditoría global. Alcance CASL al equipo de soporte. |
| Support Agent | `customers:read`, `contacts:read`, `orders:read`, `products:read`, `activities:create`, `activities:read`, `activities:comment`, `activities:complete`, `activities:attach`, `tasks:create`, `tasks:read`, `tasks:update`, `calendar:read`, `tickets:create`, `tickets:read`, `tickets:update`, `tickets:reply`, `tickets:internal-comment`, `tickets:attach`, `tickets:close`, `knowledge-base:read`, `notifications:read`, `notifications:update-preferences` | Sin administración de calendario, `tickets:assign`, `tickets:reopen`, categorías, publicación, delete ni reportes globales. CASL limita tickets y eventos visibles al alcance autorizado. |
| Warehouse Manager | `products:read`, `products:read-cost`, `orders:read`, `orders:update`, `orders:fulfill`, `orders:return`, `inventory:read`, `inventory:adjust`, `inventory:transfer`, `inventory:reserve`, `warehouses:read`, `warehouses:manage`, `tasks:create`, `tasks:read`, `tasks:update`, `tasks:assign`, `calendar:read`, `notifications:read`, `notifications:update-preferences`, `reports:read`, `exports:create`, `exports:read` | Sin gestionar calendario, precios/quotes, confirmar/cancelar órdenes, customers, roles, automations ni auditoría. CASL puede limitar a warehouses asignados. |
| Warehouse User | `products:read`, `orders:read`, `orders:fulfill`, `inventory:read`, `inventory:transfer`, `warehouses:read`, `tasks:read`, `tasks:update`, `calendar:read`, `notifications:read`, `notifications:update-preferences` | Sin administración de calendario, ajustes manuales, reservas administrativas, cancelación de órdenes ni gestión de almacenes. CASL limita a almacenes asignados. |
| Finance Viewer | `customers:read`, `contacts:read`, `products:read`, `products:read-cost`, `price-lists:read`, `quotes:read`, `orders:read`, `inventory:read`, `reports:read`, `notifications:read`, `notifications:update-preferences`, `exports:create`, `exports:read` | Solo lectura de negocio excepto generar su propia exportación. Sin configuración mutable, datos de seguridad ni auditoría salvo rol adicional aprobado. |
| Read Only | `customers:read`, `contacts:read`, `leads:read`, `pipelines:read`, `deals:read`, `activities:read`, `tasks:read`, `calendar:read`, `products:read`, `price-lists:read`, `quotes:read`, `orders:read`, `inventory:read`, `warehouses:read`, `tickets:read`, `knowledge-base:read`, `notifications:read`, `reports:read`, `exports:read` | Ninguna creación, actualización, eliminación, asignación, aprobación, cierre, ajuste o administración. CASL todavía puede reducir filas/campos visibles. |

## Validación de la matriz

- Cada código incluido existe en `permissions` y está activo.
- Todo código del catálogo está asignado a Super Admin.
- El catálogo, `PERMISSION_DEFINITIONS`, los tipos del decorator y las filas
  persistidas contienen los mismos 121 códigos.
- Ningún rol recibe por accidente un código no listado en su fila.
- Los límites CASL se prueban aparte: un permiso concede una acción potencial, no acceso irrestricto a todas las filas.
- Cambiar la matriz requiere revisión, audit log del seed administrativo y actualización de tests.

## Orden

1. Permissions por `code`, validando también unique `resource + action`.
2. Roles por `organization_id + code`.
3. Role permissions.
4. Localizar usuario y membership bootstrap existentes.
5. Member roles con `assigned_by_member_id` null solo para bootstrap.

## Datos antes de Customers

No instales ni uses `@faker-js/faker` en Security. El usuario bootstrap y los
roles/permissions son datos constantes y controlados. Los primeros demo data
generados pertenecen a Customers; los tests usan fixtures locales mínimos.

## Idempotencia y una sola transacción

Upsert por claves naturales. Ejecutar dos veces no cambia IDs ni duplica
puentes. El runner de Foundation posee una sola transacción y entrega el mismo
`EntityManager` a todos los seeders resueltos. Ningún seeder abre una
transacción o `QueryRunner`; un fallo en la matriz revierte toda la corrida,
incluidas sus dependencias ejecutadas en ella.

## Entorno

Rechaza producción por defecto. El bootstrap de un ambiente real es un procedimiento separado y controlado.
