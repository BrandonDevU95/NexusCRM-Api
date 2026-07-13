# Test task 001: Knowledge Base

## Navegación

- Código: `TEST-KB-001`.
- Vienes de: Pasada A paso 6 y Pasada B paso 3.
- Regresas a: `LEARNING-PATH` para cierre de cada rama.

## Unit

- Slug normalization y conflicto por tenant.
- Publication policy: draft válido, category inactive y contenido vacío.
- Visibility policy: reader, editor e internal/public.
- Query allowlists para filtros y sort.
- Dependency map del seeder y dataset determinístico.

## Integration

- Unique organization/slug permite mismo slug en otra organization.
- Category self-FK evita retirar parent con children.
- Article/tag de distintos tenants se rechaza.
- Search vector cambia al editar y GIN query devuelve resultados.
- Publish y audit hacen commit juntos; falla audit revierte status.
- Archive conserva asociaciones.
- Seed ejecutado dos veces mantiene IDs/conteos.

## E2E

Con `X-Organization-Id`: CRUD category/tag, crear draft, publicar, search,
paginación, permission denied, membership inactive y UUID cross-tenant como not
found. Confirma correlation ID y error envelope.

## Integración con tickets

- Link válido crea una fila y audit.
- Duplicado devuelve 409.
- Ticket o article de otro tenant responde not found y no inserta.
- Unlink retira solo la asociación.
- Article archived permanece en historial.
- Actor sin ambas permissions recibe 403.

Ejecuta suites específicas y luego lint, typecheck, unit, integration y E2E. Las
pruebas preparan fixtures mínimas; no dependen del demo seed global.

## Definition of Done

- [ ] Cada regla crítica tiene nivel de prueba justificado.
- [ ] PostgreSQL real comprueba búsqueda y constraints.
- [ ] Tenant isolation está cubierta en core y ticket links.
- [ ] Transacción con audit prueba rollback.
- [ ] Suites pasan solas y en quality gate.
