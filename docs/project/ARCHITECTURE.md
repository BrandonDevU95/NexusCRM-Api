# Arquitectura de NexusCRM API

## Decisión principal

NexusCRM API es un backend NestJS independiente y un monolito modular por
dominio. Se parece deliberadamente a POS-Manager: una aplicación, un proceso,
una base de datos y módulos NestJS claros. No contiene Next.js, `apps/`,
`packages/shared` ni coordinación de monorepo.

Esta elección reduce conceptos simultáneos y permite concentrarse en NestJS,
PostgreSQL, relaciones, transacciones, seguridad y pruebas. “Monolito” describe
el despliegue; “modular” exige que cada dominio conserve responsabilidades y no
consulte tablas ajenas de manera informal.

## Estructura objetivo

```text
src/
  access-control/
  activities/
  audit-log/
  auth/
  automations/
  calendar/
  common/
  config/
  contacts/
  customers/
  database/
    migrations/
  deals/
  imports/
  inventory/
  knowledge-base/
  leads/
  notifications/
  orders/
  organizations/
  pipelines/
  price-lists/
  products/
  quotes/
  reports/
  seed/
  settings/
  tasks/
  tickets/
  users/
```

Los módulos viven directamente bajo `src/`, igual que en POS-Manager. No se
crea una capa `modules/` adicional. Cada dominio agrega solo las carpetas que
necesita:

```text
customers/
  dto/
  entities/
  events/       cuando emite eventos
  policies/     cuando tiene reglas CASL propias
  customers.controller.ts
  customers.module.ts
  customers.service.ts
```

El service puede inyectar `Repository<Entity>` de TypeORM. No se envolverá cada
repository en una clase que únicamente repita sus métodos. Cuando una consulta
sea compleja o necesite una frontera comprobable, podrá aparecer un query
service o repository especializado con una responsabilidad real.

## Responsabilidades

- **Controller:** contrato HTTP, DTO de entrada, guards, permiso, status y
  delegación. No contiene consultas ni transacciones.
- **Service:** casos de uso, reglas, coordinación y límites transaccionales.
- **Entity:** mapeo persistente, constraints simples y relaciones; no sustituye
  la validación del DTO ni la regla del service.
- **DTO:** forma y validación de entrada/salida. Joi no se usa para DTOs.
- **Policy:** decisión CASL sobre acción, recurso, tenant y propiedad.
- **Event:** hecho ya confirmado que consumen auditoría, notificaciones,
  automatizaciones o proyecciones.
- **Seed:** datos reference/demo; no cambia el esquema.

## Frontera multi-organización

`users` es una identidad global. La pertenencia se representa mediante
`organization_members`; no se guarda un único `organization_id` en `users`.
Todo agregado comercial incluye `organization_id`.

El cliente de la API enviará el identificador de la organización activa mediante
el mecanismo definido en Seguridad/Organizaciones. El servidor debe comprobar
la membresía y aplicar el mismo `organization_id` en la consulta. Encontrar un
registro por `id` y comprobar el tenant después es insuficiente: la consulta
misma debe incluir ambas condiciones.

Las relaciones entre dos registros comerciales se validan dentro de la misma
organización. La mera existencia de una foreign key no garantiza por sí sola
esa igualdad; el service y, cuando convenga, constraints compuestas deben
protegerla.

## Persistencia

- PostgreSQL es la única base soportada.
- TypeORM usa un `DataSource` explícito para CLI y aplicación.
- `synchronize: false` se mantiene en todos los ambientes.
- La aplicación no ejecuta migraciones silenciosamente al arrancar.
- Las migraciones se ejecutan de forma deliberada antes del despliegue.
- Una migración integrada a `main` es inmutable; cualquier corrección es otra
  migración.
- Dinero usa `numeric`, fechas operativas `timestamptz` e identificadores UUID.
- El borrado por cascada está prohibido para historial, seguridad, documentos,
  inventario y auditoría.

## Configuración

`.env` es la fuente local y nunca se versiona. `ConfigModule` carga los valores
y Joi valida tipo, formato, rango y presencia al arrancar. Los servicios reciben
configuración mediante `ConfigService`; no leen `process.env` fuera del módulo
de configuración.

Docker Compose recibe imagen, puertos, credenciales, nombres y límites mediante
variables. Las versiones de imagen se fijan en `.env.example`; los secretos se
dejan vacíos o con marcadores no utilizables.

## Autenticación y autorización

- Passwords con Argon2id.
- Access token JWT de vida corta.
- Refresh token opaco, almacenado únicamente como hash, rotado en cada uso.
- Sesiones revocables y detección de reutilización de refresh token.
- Cookies HttpOnly; `Secure`, `SameSite`, CORS y protección CSRF se deciden de
  forma coherente con los dominios de `NexusCRM-Web` y la API.
- RBAC concede permisos generales persistidos.
- CASL añade reglas por tenant, recurso, propiedad y estado.
- Ocultar una acción en el frontend nunca sustituye la autorización del backend.

## Consistencia y eventos

Lead conversion, quote-to-order, asignación de folios, movimientos/reservas de
inventario y rotación de refresh token son operaciones atómicas. Si falla una
parte, la transacción completa debe revertirse.

Las integraciones confiables usan `outbox_events` guardados con el cambio de
negocio. Audit Parte A (`v0.2.0`) introduce la tabla y un publisher transaccional
mínimo para que los módulos posteriores no prometan eventos que puedan perderse
entre database commit y proceso. Automations (`v0.8.0`) agrega dispatcher,
reclamo concurrente, reintentos, reglas y observabilidad; no crea por primera vez
la fuente de verdad. Un evento nunca se marca entregado antes de confirmar su
efecto y toda publicación lleva tenant, aggregate, event type, correlation e
idempotency key.

## Seeds y pruebas

`SeedModule` se conserva, pero se invoca mediante CLI/Nest application context,
no mediante un endpoint destructivo general. El seed maestro llama seeders por
dominio en orden, con una transacción, advisory lock, seed de Faker fijo y
resumen de resultados.

Los tests no dependen del seed de desarrollo. Unit tests usan dobles pequeños;
integration y E2E usan una base PostgreSQL separada creada por migraciones y
factories controladas.
