# Development task 001: ciclo de vida del lead

## Navegación

- **Código:** DEV-LEAD-001
- **Vienes de:** `../LEARNING-PATH.md`, parte A paso 2.
- **Regresa a:** `../LEARNING-PATH.md`, parte A paso 3.
- **No continúes hasta:** CONVERTED sea imposible mediante update general.

## Casos de uso

Crear, consultar, actualizar, asignar, calificar, puntuar, programar seguimiento, perder y archivar. Importar se integra en módulo 21, no dentro del controller de Leads.

## Contrato tenant

Las rutas `/leads` exigen `X-Organization-Id`. El guard valida membresía activa, crea tenant context y repositories/services filtran por organization ID. Body y JWT no eligen tenant.

## Endpoints orientativos

- `POST /leads`, `GET /leads`, `GET /leads/:id`, `PATCH /leads/:id`, `DELETE /leads/:id`
- `PUT /leads/:id/owner`
- `POST /leads/:id/status-transitions`
- `POST /leads/:id/scores`
- `GET /leads/:id/status-history`

## State machine

Define explícitamente transiciones desde NEW hasta estados terminales CONVERTED/LOST. CONVERTED solo lo establece el caso de uso de conversión; un PATCH nunca puede simularlo. LOST requiere razón; reabrir requiere permiso/regla explícitos.

## DTO validation

Email, teléfono, UUID, score 0–100, money decimal, ISO currency, fecha ISO y filtros acotados. Owner viene como member ID válido del tenant. No acepta `converted_at`, `organization_id`, history ni score actual mediante update general.

## Permisos

`leads:create/read/update/delete/assign/convert`. CASL separa propietario, sales manager y solo lectura.

## Auditoría y eventos

Audita create, assignment, status, score, loss y archive. Emite `lead.created`, `lead.assigned`, `lead.status_changed`, `lead.scored`, `lead.lost`.

## Errores

Otro tenant o archivado: `404`; transición inválida: `409`/`422`; owner ajeno: `422`; status terminal ineditable: `409`.
