# Test task 001: organizaciones

## Navegación

- **Código:** TEST-ORG-001
- **Vienes de:** `../LEARNING-PATH.md`, registro `ORG-005`.
- **Regresa a:** `../LEARNING-PATH.md`, registro `ORG-005`.
- **No continúes hasta:** probar aislamiento y regresión de Plataforma/Autenticación.

## Unitarias

- Normalización de slug.
- Normalización determinista de tax ID.
- Validación de moneda, zona horaria y locale.
- Resolución de tenant context para membresía activa, inactiva e inexistente.

## Integración

- Slug único.
- Tax ID normalizado es unique global para organizations no archivadas y puede reutilizarse solo después de archivar la anterior.
- Membresía única por user/organization.
- `organization_members` expone `UQ(organization_id, id)`.
- Una sola settings row por organización.
- FKs de secuencias, tasas y catálogos rechazan organization inexistente.
- Un insert directo con `invited_by_member_id` de otro tenant falla por FK compuesta, aun saltándose el service.
- `onDelete: RESTRICT` impide eliminar organización con dependientes.
- Crear organización y settings hace rollback conjunto ante error.
- El runner entrega el mismo EntityManager a Organizations y Platform; un fallo del segundo revierte también organizations/memberships.

## E2E de aislamiento

- Usuario miembro lista solo organizaciones accesibles.
- Miembro de A no consulta detalle de B.
- Enviar `organization_id` de B en body no cambia el tenant real.
- Miembro suspendido pierde acceso aunque su access token siga vigente.
- Organización suspendida bloquea operaciones comerciales.
- Crear organization deja membership activa sin role; antes de Security B no existe una asignación prematura.
- Después de Security B la membership bootstrap recibe Super Admin de forma idempotente.
- Actualizar settings genera auditoría cuando módulo 22 esté integrado.

## Regresión

Ejecuta Plataforma y Autenticación: la FK nueva no debe romper seeds ni refresh. Prueba folios independientes para A y B y ejecuta dos veces el seed completo sin duplicar roles ni memberships.
