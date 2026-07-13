# Seed task 001: verificación administrativa sin datos propios

## Navegación

- Código: `SEED-ADMIN-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 3.
- Regresas a: paso 4.

Administration no registra un seeder que inserte filas propias. El seed maestro
ya ejecuta Platform, Security, Organizations, Pipelines, Price Lists,
Notifications y demás owners en dependency order.

Esta tarea agrega una verificación posterior:

- Existe `system-admin:access` en permissions.
- Super Admin tiene ese permission y cada owner permission explícita; no existe
  una permission `*`.
- Admin recibe solamente el catálogo definido por Security.
- Organization demo tiene settings, catalogs, pipeline, taxes, price list y
  templates requeridos.
- Ejecutar cada owner seed por segunda vez conserva IDs/custom values.
- Configuration readiness no reporta faltantes inesperados.

No llames endpoints desde seed ni insertes directamente en owner tables. Si
falta un dato, corrige el seeder propietario y su dependency order.

## Definition of Done

- [ ] No existe `AdministrationSeeder` con inserts.
- [ ] No existe wildcard permission persistida.
- [ ] Verificación nombra owner de cada faltante.
- [ ] Segunda ejecución del seed maestro es idempotente.
- [ ] Prod no recibe demo organization/users.
