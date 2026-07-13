# Test task 001: pipeline comercial

## Navegación

- **Código:** TEST-PIPE-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 4.
- **Regresa a:** `../LEARNING-PATH.md`, verificación final.
- **No continúes hasta:** unitarias, integración y E2E pasen con dos tenants.

## Unitarias

- Probability y terminalidad.
- Validación de lista exacta al reordenar.
- Pipeline válido requiere etapa OPEN, WON y LOST.
- Policy de lectura/administración.

## Integración y concurrencia

- Code y sort order únicos en su ámbito.
- Máximo un default activo por tenant.
- Un insert directo de stage/history con parent de otro tenant falla por FK compuesta; no se prueba solamente el service.
- Pipelines y stages exponen `UQ(organization_id, id)` y stage además protege `(organization_id, pipeline_id, id)`.
- Reordenamiento concurrente deja un orden completo sin duplicados.
- Error intermedio revierte posiciones e history.
- `onDelete: RESTRICT` protege pipeline/stage con dependientes.

## E2E

- CRUD y reordenamiento autorizado.
- Usuario de solo lectura no administra.
- IDs de tenant B responden `404`.
- Archivar default obliga a elegir/rechazar según regla explícita.
- Cambios producen history y auditoría una vez.

Usa factories pequeñas; no dependas del seed global.
