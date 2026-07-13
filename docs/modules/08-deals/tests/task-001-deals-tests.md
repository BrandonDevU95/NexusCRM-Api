# Test task 001: oportunidades

## Navegación

- **Código:** TEST-DEAL-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 4.
- **Regresa a:** `../LEARNING-PATH.md`, verificación final.
- **No continúes hasta:** suites del módulo y regresiones de dependencias pasen.

## Unitarias

- State machine OPEN/ON_HOLD/WON/LOST/CANCELLED.
- Ganar/perder exige stage y reason correctos.
- Cálculo decimal de productos según política.
- MANUAL conserva amount al cambiar products; PRODUCTS recalcula y rechaza amount manual.
- Policy owner/manager/readonly.

## State machine e integración

- Stage pertenece a pipeline y tenant.
- Contact pertenece a customer.
- Owner es membresía activa del tenant.
- Inserts directos que mezclan customer/contact/owner/pipeline/stage/loss reason/product de otro tenant fallan por FKs compuestas.
- Parent tables referenciadas exponen `UQ(organization_id, id)` y stage/contact exponen los uniques triples requeridos.
- Transición actualiza deal e inserta history atómicamente.
- Error de audit/outbox dentro de transacción revierte cambio.
- Checks WON/LOST y unique deal/product funcionan.
- Dos movimientos concurrentes no pierden history ni dejan estado ambiguo.

## E2E

- CRUD, filtros por pipeline/stage/owner/customer/status/date.
- ID de tenant B responde `404` en toda acción.
- Sin `deals:close` no gana ni pierde.
- Deal terminal rechaza update/move incompatible.
- Archivo conserva products/history.
- Eventos y auditoría se producen una vez.

## Regresión

Ejecuta Customers, Contacts, Pipelines y Products. Usa dos tenants y dataset pequeño creado por factory, no el seed de desarrollo.
