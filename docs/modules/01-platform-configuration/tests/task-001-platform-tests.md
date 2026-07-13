# Test task 001: plataforma y configuración

## Navegación

- **Código:** TEST-PLAT-001
- **Gate A viene de:** `../LEARNING-PATH.md`, registro `PLAT-006`.
- **Gate A regresa a:** `../LEARNING-PATH.md`, registro `PLAT-006`.
- **Gate B viene de:** retorno de Organizations, registro `ORG-004`.
- **Gate B regresa a:** `../LEARNING-PATH.md`, registro `PLAT-008`, y luego a
  Organizations.
- **No continúes hasta:** cada gate tenga comandos y resultados registrados.

## Gate A: Platform sin tenant

### Regresión de Foundation

- Joi acepta el environment completo aunque exista una variable ajena como
  `CI_JOB_ID` (`allowUnknown: true`).
- El loader tipado no devuelve `CI_JOB_ID` ni otra unknown key porque usa una
  allowlist explícita.
- Omitir `DATABASE_HOST` y enviar el typo `DATABSE_HOST` todavía falla.
- Runtime y CLI producen las mismas options y mantienen `synchronize: false`.
- `compose.yaml` resuelve y `database_test` queda healthy.

Estos casos verifican Foundation; Platform no mantiene un segundo schema Joi,
loader, Compose o DataSource.

### Unitarias

- El formateador aplica prefix y padding sin mutar una secuencia.
- La validación acepta solo settings globales conocidos.
- Codes se normalizan de forma determinista.
- Metadata debe ser objeto y sort order no puede ser negativo.

### Migration/Integration

- Una base vacía aplica toda la historia.
- La migración Platform puede revertirse y reaplicarse.
- Un catálogo global no duplica code normalizado.
- Una opción no duplica `catalog_id + code`; el mismo code en otro catálogo sí
  es válido.
- `onDelete: RESTRICT` impide borrar un catálogo con opciones.
- Una tasa fuera de 0–100 es rechazada.

### Seed A

- `PlatformReferenceSeeder` recibe el manager abierto por el runner.
- El seeder no llama `transaction` ni crea `QueryRunner`.
- Dos corridas conservan IDs y conteos.
- Una falla deliberada revierte todos los cambios de la corrida.
- El registry no contiene Faker ni datasets demo antes de Customers.

### E2E

- `GET /settings/public` devuelve solo claves públicas.
- La respuesta no contiene secretos ni unknown environment variables.
- No existe endpoint administrativo temporal sin autenticación.

## Gate B: integración organizacional

Ejecuta después del módulo 03 con dos organizaciones A/B.

- Las FKs rechazan organization IDs inexistentes.
- Los índices únicos permiten el mismo code en A/B, pero no duplicarlo dentro
  del mismo tenant.
- Tenant A no lee catálogos ni tasas de B.
- Cada tenant puede tener un default tax rate independiente.
- Dos transacciones concurrentes obtienen folios diferentes y consecutivos en
  la misma organización.
- A y B tienen secuencias independientes.
- `OrganizationsSeeder` invoca `PlatformOrganizationSeeder` con el mismo
  manager y una sola transacción del runner.
- Dos corridas mantienen organization IDs, relaciones y conteos.
- Una falla en B revierte también cambios realizados en A durante esa corrida.

## Regresión posterior

Security B comprueba que los endpoints administrativos requieren los permisos
exactos `settings:*`, `catalogs:*`, `number-sequences:*` y `tax-rates:*` del
catálogo persistido. Audit A comprueba before/after sin secretos.

## Aislamiento

Usa exclusivamente PostgreSQL test allowlisted y migrado. No uses
`synchronize`, seed global como fixture ni la base de desarrollo. Cierra app y
DataSource aunque falle un assert.

## Evidencia

Registra comando, suite, resultado y motivo de cualquier caso omitido. “Pasó en
mi máquina” sin comando ni database objetivo no permite marcar `PLAT-006` o
`PLAT-008`.
