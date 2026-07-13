# Test task 001: contactos

## Navegación

- **Código:** TEST-CONT-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 4.
- **Regresa a:** `../LEARNING-PATH.md`, cierre.
- **No continúes hasta:** probar concurrencia de principal y aislamiento en cada endpoint.

## Unitarias

- Preferencias efectivas con `do_not_contact`.
- Normalización de email.
- Policy combina permiso de contacto y acceso a customer.

## Integración

- Contact rechaza customer de otro organization.
- Preferences es uno-a-uno.
- Índice parcial impide dos principales activos.
- Cero principales es válido; archivar el principal no selecciona otro automáticamente.
- Un insert directo de contact o preferences con organization del padre equivocado falla por FK compuesta, aun sin pasar por service.
- Hard delete de customer con contacts queda restringido.

## E2E

- CRUD anidado bajo customer.
- Cambiar principal desmarca anterior.
- Archivar al principal deja cero hasta una elección explícita.
- Contact de otro tenant responde `404` incluso usando un customer accesible en la ruta.
- Usuario sin permiso obtiene `403`.
- `do_not_contact` se conserva y audita.
- Archivado desaparece de lista normal.

## Concurrencia y aislamiento

Lanza dos intentos de principal distinto para el mismo customer y confirma estado final válido. Usa dos tenants con UUIDs reales para probar que ninguna consulta confía solo en `contact.id`.
