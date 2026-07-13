# Test task 001: clientes

## Navegación

- **Código:** TEST-CUST-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 4.
- **Regresa a:** `../LEARNING-PATH.md`, cierre.
- **No continúes hasta:** todas las acciones con ID de otro tenant respondan de forma segura.

## Unitarias

- Normalización de email/tax ID.
- Transiciones de status válidas e inválidas.
- Cálculo de filtros y sort permitidos.
- Policy de owner frente a manager.

## Integración

- Organization inexistente y owner de otro tenant son rechazados.
- Un insert directo que intenta relacionar owner, note, tag o history de otro tenant viola la FK compuesta; esta prueba evita depender únicamente del service.
- Customer y status history se guardan en la misma transacción.
- Customer tag no se duplica.
- Borrar customer con history está restringido; archivar funciona.
- Tax ID normalizado duplicado falla para dos customers activos del mismo tenant, se admite en tenant distinto y se puede reutilizar después de archivar el anterior.
- `UQ(organization_id, id)` existe en cada parent que recibe FKs comerciales.

## E2E

- Crear con permiso y leer detalle.
- Usuario sin permiso obtiene `403`.
- ID de tenant B responde `404` en read, update, archive, owner, notes y tags.
- Filtros combinados, paginación máxima y sort permitido.
- Cambiar status crea history y audit log.
- Archivar excluye de lista normal pero no borra history.
- Reasignar requiere `customers:assign` y membership activa.

## Dataset de test

Factories pequeñas con dos tenants; no dependas del seed Faker. Compara campos significativos y no snapshots gigantes.
