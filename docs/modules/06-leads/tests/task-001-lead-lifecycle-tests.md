# Test task 001: ciclo de leads

## Navegación

- **Código:** TEST-LEAD-001
- **Vienes de:** `../LEARNING-PATH.md`, parte A paso 4.
- **Regresa a:** `../LEARNING-PATH.md`, cierre de parte A.
- **No continúes hasta:** cubrir state machine, permisos, histories y tenant.

## Unitarias

- Cada transición válida e inválida.
- LOST requiere reason; CONVERTED no se acepta en update común.
- Score y valor en límites.
- Policy por owner/manager.

## Integración

- Owner y source respetan tenant.
- Inserts directos con owner/source/lead history de otro tenant fallan por FK compuesta, incluso saltándose el service.
- Status y history son atómicos.
- Score actual y score history son atómicos.
- Checks de converted/lost se cumplen.

## Casos E2E

- CRUD, asignación, scoring y filtros.
- `leads:assign` y `leads:convert` son independientes.
- ID de tenant B devuelve `404` en toda acción.
- Lead terminal rechaza ediciones incompatibles.
- Eventos y audit logs no contienen datos excesivos.

Usa factories con dos tenants; no dependas del seed.
